// Playwright CLI snippet, not a runtime dependency or @playwright/test suite.
// Start the local server, open an isolated CLI browser session, then run:
// playwright-cli -s=ecotoon-wp1 run-code --filename scripts/smoke-flow.cjs
async (page) => {
  const origin = new URL(page.url()).origin;
  if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) throw new Error('Use a local test server');
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const checks = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const stage = key => page.locator('#readerSteps [data-stage="' + key + '"]');
  const assertStage = async key => {
    await settle();
    check(await stage(key).getAttribute('aria-current') === 'step', 'Current stage: ' + key);
    check(new URL(page.url()).hash === '#/g1-01' + (key === 'comic' ? '' : '/' + key), 'Stage URL: ' + key);
  };
  await page.goto(origin);
  await page.evaluate(() => {
    localStorage.removeItem('ecotoon-classroom-v1');localStorage.removeItem('ecotoon-progress-v3');
    localStorage.removeItem('ecotoon-progress');
  });
  await page.reload();
  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({width, height:900});
    await page.goto(origin + '/#library');
    await page.locator('[data-story="g1-01"]').click();
    await assertStage('comic');
    const historyLength = await page.evaluate(() => history.length);
    for (const key of ['summary', 'quiz', 'activity', 'game', 'comic']) {
      await stage(key).click();
      await assertStage(key);
    }
    check(await page.evaluate(() => history.length) === historyLength, 'Stage navigation must not add history');
    const geometry = await page.locator('#readerSteps').evaluate(element => {
      const rect = element.getBoundingClientRect();
      return [...element.querySelectorAll('button')].map(button => {
        const box = button.getBoundingClientRect();
        return {visible: getComputedStyle(button).display !== 'none', width:box.width, height:box.height,
          inside:box.left >= rect.left && box.right <= rect.right && box.right <= innerWidth};
      });
    });
    check(geometry.length === 5 && geometry.every(box => box.visible && box.inside && box.width >= 44 && box.height >= 44), 'Five usable stage buttons at ' + width);
    await page.screenshot({path:'output/playwright/wp1/reader-' + width + '.png'});
    await stage('quiz').click();
    const boxes = await page.evaluate(() => ({
      toolbar:document.querySelector('.reader-toolbar').getBoundingClientRect().bottom,
      quiz:document.querySelector('#stage-quiz').getBoundingClientRect().top,
      overflow:document.querySelector('#reader').scrollWidth > document.querySelector('#reader').clientWidth
    }));
    check(boxes.quiz >= boxes.toolbar - 1 && !boxes.overflow, 'Quiz anchor clears toolbar at ' + width);
    await page.screenshot({path:'output/playwright/wp1/quiz-' + width + '.png'});
    // A manual scroll follows the page position rather than retaining the last clicked step.
    await page.locator('#stage-activity').evaluate(element => element.scrollIntoView({block:'start',behavior:'instant'}));
    await assertStage('activity');
    await page.goBack();
    await page.locator('#reader').waitFor({state:'hidden'});
    await page.goForward();
    await page.locator('#reader').waitFor({state:'visible'});
    await assertStage('activity');
    await page.getByRole('button',{name:'닫기',exact:true}).click();
    await page.waitForURL(url => !url.hash.startsWith('#/'));
    checks.push(width + 'px: stage navigation, touch targets, anchor position, manual scroll, Back/Forward, close');
  }
  await page.goto(origin + '/#/g1-01/game');
  await page.reload(); // Test direct URL bootstrapping, not only hashchange navigation.
  await assertStage('game');
  check(!(await page.locator('#startGame').isEnabled()), 'Direct game link cannot bypass activity');
  await page.getByRole('button',{name:'④ 활동으로 이동 →',exact:true}).click();
  await assertStage('activity');
  await stage('comic').click();
  await page.locator('#readingMode').click(); // Low grades open in paged mode.
  await page.getByRole('button',{name:'웹툰을 읽었어요 · 개념 정리로 →',exact:true}).click();
  check(await stage('comic').getAttribute('data-complete') === 'true', 'Reading session completion');
  await page.getByRole('button',{name:'개념을 살펴봤어요 · 퀴즈로 →',exact:true}).click();
  check(await stage('summary').getAttribute('data-complete') === 'true', 'Summary session completion');
  await page.locator('[data-answer="1"]').click(); // g1-01's existing correct choice.
  check(await stage('quiz').getAttribute('data-complete') === 'true', 'Quiz progress updates immediately');
  await page.getByRole('button',{name:'생활 속 활동으로 →',exact:true}).click();
  await page.getByRole('button',{name:'활동 마치고 게임 열기 →',exact:true}).click();
  await assertStage('game');
  check(await page.locator('#startGame').isEnabled(), 'Blank optional note unlocks game');
  await page.locator('#startGame').click();
  await page.locator('[data-coin="100"]').click();
  const inProgress = await page.locator('#miniGamePlay').innerHTML();
  await stage('activity').click();
  await page.getByLabel('나의 생각과 실천 기록 (선택)',{exact:true}).fill('놀이 돈의 숫자를 살펴봤어요.');
  await page.locator('#saveActivity').click();
  check(await page.locator('#miniGamePlay').innerHTML() === inProgress, 'Resaving must preserve a running game');
  await page.locator('#coin-clear').click();
  for (let round = 0; round < 10 && await page.locator('#coin-check').count(); round++) {
    let amount = Number((await page.locator('.coin-target strong').innerText()).replace(/\D/g,''));
    const coins = await page.locator('[data-coin]').evaluateAll(elements => elements.map(element => Number(element.dataset.coin)).sort((a,b) => b-a));
    for (const coin of coins) while (amount >= coin) {
      await page.locator('[data-coin="' + coin + '"]').click();
      amount -= coin;
    }
    check(amount === 0, 'Coin fixture solvable');
    await page.locator('#coin-check').click();
  }
  check(await page.getByRole('heading',{name:'배움 미션 완료!',exact:true}).isVisible(), 'Game can finish');
  const victory = await page.locator('#miniGamePlay').innerHTML();
  await stage('activity').click();
  await page.getByLabel('나의 생각과 실천 기록 (선택)',{exact:true}).fill('완료 후에도 메모를 고칠 수 있어요.');
  await page.locator('#saveActivity').click();
  check(await page.locator('#miniGamePlay').innerHTML() === victory, 'Resaving must preserve victory screen');
  check(await page.locator('[data-story="g1-01"] .card-progress [data-complete="true"]').count() === 4, 'Four card progress markers complete');
  const stored = await page.evaluate(() => (()=>{const d=JSON.parse(localStorage.getItem('ecotoon-classroom-v1')||'null');return d?d.profiles.find(p=>p.id===d.activeId).records:{};})()['g1-01']);
  check(stored.read && stored.quiz && stored.gameDone && stored.gameStars === 3 && stored.note.includes('완료 후'), 'Original v3 fields preserved');
  check(Object.keys(stored).sort().join(',') === 'gameDone,gameStars,note,quiz,read', 'No record schema change');
  await page.reload();
  await assertStage('game');
  check(await stage('game').getAttribute('data-complete') === 'true', 'Persisted game completion');
  await stage('activity').click();
  check(await page.locator('#reflection').inputValue() === stored.note, 'Note survives reload');
  await page.keyboard.press('Escape');
  await page.waitForURL(url => !url.hash.startsWith('#/'));
  checks.push('Direct-link lock, blank-note activity, running/completed game preservation, v3 persistence, Escape');
  for (const step of ['', '/summary', '/quiz', '/activity', '/game']) {
    await page.goto(origin + '/#/g3-05' + step);
    await page.reload();
    check((await page.locator('#readerLabel').innerText()).includes('3학년'), 'Shared URL episode');
    check(await page.locator('#readerSteps [aria-current="step"]').getAttribute('data-stage') === (step.slice(1) || 'comic'), 'Shared URL step ' + step);
    await page.goBack();
    await page.locator('#reader').waitFor({state:'hidden'});
  }
  await page.goto(origin + '/#/g6-15');
  await page.reload();
  check(await page.locator('#nextStory').count() === 0, 'Grade six never wraps to grade one');
  await page.locator('#finishGrade').click();
  check((await page.locator('#gradeEnd').innerText()).includes('0 / 15편'), 'Last episode does not fabricate grade completion');
  await page.locator('#gradeLibrary').click();
  await page.waitForURL(url => !url.hash.startsWith('#/'));
  check(await page.locator('[data-grade="6"]').getAttribute('aria-pressed') === 'true', 'Grade library selection');
  await page.locator('[data-category="경제"]').click();
  await page.locator('[data-story="g6-04"]').click();
  await page.locator('#nextStory').click();
  check((await page.locator('#readerLabel').innerText()).includes('이야기 5/15'), 'Next episode respects same grade and filter');
  check(await page.locator('#nextStory').count() === 0, 'Filtered area stops at its last episode');
  await page.locator('#finishGrade').click();
  await page.locator('#resumeGrade').click();
  check(new URL(page.url()).hash === '#/g6-01', 'Resume incomplete grade story');
  await page.goto(origin + '/#/g9-99/quiz');
  check(!(await page.locator('#reader').isVisible()), 'Invalid route closes reader');
  check(await page.locator('#routeNotice').isVisible(), 'Invalid route offers library recovery');
  checks.push('Five fresh deep links, final episode summary, filter-aware next episode, resume and invalid-route recovery');
  await page.evaluate(() => {
    const progress = {};
    for (let n=1;n<=15;n++) progress['g6-'+String(n).padStart(2,'0')] = {read:true,quiz:true,note:'',gameDone:true,gameStars:2};
    localStorage.removeItem('ecotoon-classroom-v1');localStorage.setItem('ecotoon-progress-v3', JSON.stringify(progress));
  });
  await page.goto(origin + '/#/g6-15/game');
  await page.reload();
  await page.locator('#finishGrade').click();
  check(await page.getByRole('heading',{name:'6학년 학습을 모두 마쳤어요!',exact:true}).isVisible(), 'Actual grade completion');
  check(await page.locator('#resumeGrade').count() === 0, 'No fake next story after grade completion');
  checks.push('Fully completed grade confirmation');
  await page.evaluate(() => {
    localStorage.removeItem('ecotoon-classroom-v1');localStorage.removeItem('ecotoon-progress-v3');
    localStorage.setItem('ecotoon-progress', JSON.stringify({0:{read:true,quiz:true,note:'이전 활동 기록'}}));
  });
  await page.goto(origin + '/#/g1-01/activity');
  await page.reload();
  check(await page.locator('#reflection').inputValue() === '이전 활동 기록', 'Legacy note migration');
  check(await page.locator('#startGame').isEnabled(), 'Legacy reading completion still unlocks game');
  check(await page.evaluate(() => JSON.parse(localStorage.getItem('ecotoon-progress'))['0'].note) === '이전 활동 기록', 'Legacy key preserved');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable:true, value:{writeText:async () => {throw new Error('Clipboard unavailable');}}
  }));
  await page.locator('#shareStory').click();
  check(await page.getByLabel('공유할 이야기 주소',{exact:true}).inputValue() === page.url(), 'Copy fallback exposes the exact story and stage URL');
  const currentLink = page.url();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable:true, value:{writeText:async text => {window.copiedTestLink = text;}}
  }));
  await page.locator('#shareStory').click();
  check(await page.evaluate(() => window.copiedTestLink) === currentLink, 'Copy action writes the current link');
  checks.push('Legacy migration and preservation, link-copy success and fallback');
  const unavailable = await page.context().newPage();
  unavailable.on('pageerror', error => errors.push(error.message));
  await unavailable.addInitScript(() => Object.defineProperty(window, 'localStorage', {
    get(){throw new Error('Storage unavailable');}
  }));
  await unavailable.goto(origin + '/#/g1-01/activity');
  await unavailable.locator('#saveActivity').click();
  check(await unavailable.locator('#startGame').isEnabled(), 'Game unlock without browser storage');
  check((await unavailable.locator('#saveMessage').innerText()).includes('브라우저 저장은 사용할 수 없지만'), 'Storage failure explained');
  await unavailable.locator('#startGame').click();
  await unavailable.locator('[data-coin="100"]').click();
  const unsavedGame = await unavailable.locator('#miniGamePlay').innerHTML();
  await unavailable.locator('#readerSteps [data-stage="activity"]').click();
  await unavailable.locator('#saveActivity').click();
  check(await unavailable.locator('#miniGamePlay').innerHTML() === unsavedGame, 'Running game preserved without storage');
  await unavailable.close();
  checks.push('Unavailable-storage fallback and game preservation');
  check(errors.length === 0, 'Browser JavaScript errors: ' + errors.join('; '));
  return {passed:checks, errors};
}
