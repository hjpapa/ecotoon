// Run in an isolated local Playwright CLI session; no runtime dependencies.
async (page) => {
  const origin=new URL(page.url()).origin;
  if(!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))throw new Error('Use a local test server');
  const check=(value,message)=>{if(!value)throw new Error(message);};
  const errors=[],results=[];
  await page.goto('about:blank');
  page.on('pageerror',error=>errors.push(error.message));
  const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const scene=()=>page.locator('#sceneProgress').getAttribute('value');
  const mode=()=>page.locator('#reader').getAttribute('data-reading-mode');
  const stage=key=>page.locator('#readerSteps [data-stage="'+key+'"]');
  const open=async(id)=>{await page.goto(origin+'/#/'+id);await settle();};
  for(const width of [360,390,768,1280]){
    await page.setViewportSize({width,height:900});await open('g1-01');
    check(await mode()==='paged','Low-grade default');
    check(await page.locator('.integrated-panel:visible').count()===1,'One scene visible');
    const bounds=await page.locator('#reader').boundingBox();
    check(width>1024||bounds.width===width&&bounds.height===900,'Mobile/tablet fills viewport');
    await page.locator('#nextScene').click();check(await scene()==='2','Tap next');
    await page.keyboard.press('ArrowRight');check(await scene()==='3','Arrow next');
    await page.keyboard.press('PageUp');check(await scene()==='2','Remote previous');
    await page.locator('.comic-panels').dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',isPrimary:true,clientX:240,clientY:400});
    await page.locator('.comic-panels').dispatchEvent('pointerup',{pointerId:1,pointerType:'touch',isPrimary:true,clientX:100,clientY:410});
    check(await scene()==='3','Horizontal touch swipe');
    await page.locator('.comic-panels').dispatchEvent('pointerdown',{pointerId:2,pointerType:'touch',isPrimary:true,clientX:240,clientY:400});
    await page.locator('.comic-panels').dispatchEvent('pointerup',{pointerId:2,pointerType:'touch',isPrimary:true,clientX:220,clientY:600});
    check(await scene()==='3','Vertical scrolling does not turn page');
    await page.locator('#sceneMenu').click();await page.locator('[data-jump="7"]').click();
    check(await scene()==='8','Scene picker');
    await page.locator('#nextScene').click();await settle();
    check(await stage('summary').getAttribute('aria-current')==='step','Final scene advances to summary');
    check(!(await page.locator('#readerModes').isVisible()),'Comic controls hidden in summary');
    await stage('comic').click();await page.locator('#readingMode').click();await settle();
    check(await page.locator('.integrated-panel:visible').count()===8,'Scroll shows all scenes');
    await page.locator('#panel-3').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await settle();
    check(await scene()==='4','Scroll updates scene progress');
    await page.screenshot({path:'output/playwright/wp2/reader-'+width+'.png'});
    // Every story's text stays inside its scene with no image/speech overlap.
    for(let grade=1;grade<=6;grade++)for(let n=1;n<=15;n++){
      await open('g'+grade+'-'+String(n).padStart(2,'0'));
      if(await mode()!=='scroll')await page.locator('#readingMode').click();
      const failures=await page.locator('#reader').evaluate((reader,grade)=>{
        const bad=[];
        if(reader.scrollWidth>reader.clientWidth)bad.push('horizontal overflow');
        for(const panel of reader.querySelectorAll('.integrated-panel')){
          const box=panel.getBoundingClientRect(),picture=panel.querySelector('.scene-picture').getBoundingClientRect();
          let bottom=picture.bottom;
          for(const speech of panel.querySelectorAll('.integrated-speech')){
            const rect=speech.getBoundingClientRect(),text=speech.querySelector('p');
            if(rect.left<box.left||rect.right>box.right||rect.bottom>box.bottom||rect.top<bottom)bad.push(panel.id+' overlap');
            if(parseFloat(getComputedStyle(text).fontSize)<(grade<=2?18:16)||text.scrollWidth>text.clientWidth)bad.push(panel.id+' text');
            bottom=rect.bottom;
          }
        }
        for(const button of reader.querySelectorAll('button')){
          if(!button.getClientRects().length)continue;
          const rect=button.getBoundingClientRect();
          if(rect.width<44||rect.height<44)bad.push(button.id+' small button');
        }
        return bad;
      },grade);
      check(!failures.length,width+'px g'+grade+'-'+n+': '+failures.join(', '));
    }
    results.push(width+'px: paging, keys, touch gesture routing, scene picker, scroll progress, all 720 scenes and reader buttons');
  }
  await page.setViewportSize({width:1920,height:1080});await open('g1-01');
  await page.locator('#boardMode').click();await settle();
  check(await mode()==='board','Board opens');
  check(await page.locator('#panel-0 .integrated-speech:not(.speech-pending)').count()===0,'Board starts before speech');
  await page.keyboard.press('PageDown');
  check(await page.locator('#panel-0 .integrated-speech:not(.speech-pending)').count()===1,'First speech');
  await page.keyboard.press('ArrowRight');
  check(await page.locator('#panel-0 .integrated-speech:not(.speech-pending)').count()===2,'Second speech');
  await settle();
  const board=await page.locator('#reader').evaluate(reader=>{
    const panel=reader.querySelector('.integrated-panel:not([hidden])');
    const art=panel.querySelector('.scene-picture').getBoundingClientRect();
    const dialogue=panel.querySelector('.dialogue-flow').getBoundingClientRect();
    return {font:parseFloat(getComputedStyle(panel.querySelector('.integrated-speech p')).fontSize),
      fits:reader.scrollHeight===reader.clientHeight,apart:art.right<=dialogue.left,
      speechFits:[...panel.querySelectorAll('.integrated-speech')].every(s=>s.getBoundingClientRect().bottom<=dialogue.bottom)};
  });
  check(board.font===27&&board.fits&&board.apart&&board.speechFits,'Board geometry: '+JSON.stringify(board));
  await page.screenshot({path:'output/playwright/wp2/board-1920.png'});
  await page.keyboard.press('ArrowRight');check(await scene()==='2','Board advances after last speech');
  await page.keyboard.press('ArrowLeft');check(await scene()==='1','Board returns to previous scene');
  await page.keyboard.press('Escape');check(await mode()==='paged','Escape restores reading mode');
  check(await page.locator('#reader').isVisible(),'First Escape retains reader');
  await stage('activity').click();await page.locator('#reflection').fill('모드 전환 뒤에도 남을 기록');
  await page.locator('#reflection').press('ArrowRight');check(await scene()==='1','Input keys do not turn scenes');
  await page.locator('#saveActivity').click();await page.locator('#startGame').click();
  await page.locator('[data-coin="100"]').click();const game=await page.locator('#miniGamePlay').innerHTML();
  await stage('comic').click();await page.locator('#boardMode').click();
  await stage('game').click();
  check(await mode()==='paged','Leaving comic exits board');
  check(await page.locator('#miniGamePlay').innerHTML()===game,'Mode switch preserves running game');
  check(await page.locator('#reflection').inputValue()==='모드 전환 뒤에도 남을 기록','Mode switch preserves note');
  await stage('comic').click();await page.locator('#boardMode').click();
  if(await page.locator('#readerFullscreen').isVisible()){
    await page.locator('#readerFullscreen').click();await settle();
    check(await page.evaluate(()=>!!document.fullscreenElement),'Native fullscreen');
    await page.locator('#readerFullscreen').click();await settle();
    check(await mode()==='paged','Fullscreen exit restores mode');
  }
  await page.keyboard.press('Escape');await page.locator('#reader').waitFor({state:'hidden'});
  await open('g6-01');check(await mode()==='scroll','Older-grade default');
  await page.locator('#boardMode').click();await page.keyboard.press('PageDown');await settle();
  check(await page.locator('#panel-0 .integrated-speech p').first().evaluate(el=>getComputedStyle(el).fontSize)==='24px','Older-grade board font 1.5x');
  await page.screenshot({path:'output/playwright/wp2/board-grade6.png'});
  results.push('1920px: sequential board dialogue, 1.5x text, previous, Escape, native fullscreen, note/game preservation');
  check(errors.length===0,errors.join('; '));
  return {passed:results,errors};
}

