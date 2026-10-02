let grade = 0;
let category = '전체';
let progress = {};
try { progress = JSON.parse(localStorage.getItem('ecotoon-progress') || '{}'); } catch {}
if (!progress || typeof progress !== 'object' || Array.isArray(progress)) progress = {};
const $ = selector => document.querySelector(selector);
const names = ['모든 이야기', '첫 경제 걸음', '생활 속 발견', '선택하는 힘', '합리적인 생활', '경제를 보는 눈', '세상과 연결'];
const areas = ['경제', '노동', '금융'];
const artDomains = {경제: 'economy', 노동: 'labor', 금융: 'finance'};
const escapeHTML = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const ordered = topics.map((t, i) => ({t, i})).sort((a, b) => a.t[0] - b.t[0] || areas.indexOf(a.t[1]) - areas.indexOf(b.t[1]) || a.i - b.i);
function artwork(t, panel) {
  const [domain, number] = typeof panel.art === 'string' ? panel.art.split(':') : [artDomains[t[1]], panel.art];
  return `comic-scene art-${domain} frame-${number}`;
}
function episode(i) { return topics.slice(0, i + 1).filter(t => t[0] === topics[i][0] && t[1] === topics[i][1]).length; }
function save() {
  try { localStorage.setItem('ecotoon-progress', JSON.stringify(progress)); return true; } catch { return false; }
}
$('#grades').innerHTML = names.map((name, i) => `<button data-grade="${i}" class="${!i ? 'selected' : ''}" aria-pressed="${!i}">${i ? i + '학년' : '전체 학년'}<small>${name}</small></button>`).join('');
function render() {
  const shown = ordered.filter(({t}) => (!grade || t[0] === grade) && (category === '전체' || t[1] === category));
  $('#count').textContent = `총 ${shown.length}편 · 모두 8장면`;
  $('#cards').innerHTML = shown.map(({t, i}) => `<button class="card" data-story="${i}" aria-label="${t[0]}학년 ${t[1]} ${t[2]} 8장면 읽기"><div class="cover ${artwork(t, t[5][t[11] || 0])}" role="img" aria-label="${escapeHTML(t[5][t[11] || 0].caption)} 삽화"><span class="grade-label">${t[0]}학년</span>${progress[i]?.read ? '<span class="read-label">읽었어요 ✓</span>' : ''}</div><div class="card-body"><div class="tags"><span class="tag ${t[1]}">${t[1]}</span><span>EP. ${String(episode(i)).padStart(2, '0')}</span></div><h3>${t[2]}</h3><p>${t[4]}</p><div class="card-bottom"><span>▤ 8장면 · 생각 퀴즈</span><b>읽어 보기 ↗</b></div></div></button>`).join('');
}
$('#grades').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  grade = +button.dataset.grade;
  document.querySelectorAll('#grades button').forEach(item => {
    item.classList.toggle('selected', item === button);
    item.setAttribute('aria-pressed', item === button);
  });
  render();
});
document.querySelectorAll('[data-category]').forEach(button => {
  button.setAttribute('aria-pressed', button.classList.contains('selected'));
  button.onclick = () => {
    category = button.dataset.category;
    document.querySelectorAll('[data-category]').forEach(item => {
      item.classList.toggle('selected', item === button);
      item.setAttribute('aria-pressed', item === button);
    });
    render();
  };
});
function open(dialog) {
  dialog.showModal();
  document.body.classList.add('modal-open');
}
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});
$('#cards').onclick = event => {
  const button = event.target.closest('[data-story]');
  if (button) readStory(+button.dataset.story);
};
function bubble(line) {
  const separator = line.indexOf(':');
  const speaker = separator < 0 ? '이야기' : line.slice(0, separator);
  const text = separator < 0 ? line : line.slice(separator + 1).trim();
  const person = speaker === '지우' ? 'jiwoo' : speaker === '하린' ? 'harin' : 'guest';
  return `<div class="speech ${person}"><span class="speaker">${escapeHTML(speaker)}</span><p>${escapeHTML(text)}</p></div>`;
}
function readStory(i) {
  const t = topics[i];
  const family = ordered.filter(item => item.t[0] === t[0] && item.t[1] === t[1]);
  const sibling = family.find(item => item.i !== i);
  const next = sibling || ordered[(ordered.findIndex(item => item.i === i) + 1) % ordered.length];
  $('#readerLabel').textContent = `${t[0]}학년 · ${t[1]} · ${t[3]}`;
  $('#readerBody').innerHTML = `<div class="reader-title"><span class="tag ${t[1]}">${t[1]} 이야기 ${episode(i)}</span><h2>${t[2]}</h2><p>${t[4]}</p><span class="reading-meta">8장면 · 약 7~10분 · 퀴즈와 생활 활동</span></div><nav class="panel-navigation" aria-label="이야기 장면 이동"><span>장면 바로가기</span>${t[5].map((_, j) => `<button data-jump="${j}" aria-label="${j + 1}장면으로 이동">${j + 1}</button>`).join('')}</nav><div class="comic-panels">${t[5].map((panel, j) => `<section class="panel" id="panel-${j}" aria-labelledby="panel-title-${j}"><div class="panel-heading"><span>${String(j + 1).padStart(2, '0')} / 08</span><h3 id="panel-title-${j}">${escapeHTML(panel.caption)}</h3></div><div class="${artwork(t, panel)}" role="img" aria-label="${escapeHTML(panel.caption)}의 대표 삽화"></div><div class="speech-stack">${panel.lines.map(bubble).join('')}</div></section>`).join('')}</div><section class="learn-box"><strong>🌱 오늘의 경제 씨앗</strong><p>${t[6]}</p></section><section class="quiz" id="storyQuiz"><strong>💡 잠깐! 생각 퀴즈</strong><p>${t[7]}</p>${t[8].map((answer, n) => `<button data-answer="${n}">${n + 1}. ${answer}</button>`).join('')}<p class="feedback" aria-live="polite"></p></section><section class="activity"><strong>✎ 생활 속으로 한 걸음</strong><p>${t[10]}</p><label for="reflection">나의 생각과 실천 기록</label><textarea id="reflection" placeholder="이름이나 연락처 없이, 나의 생각을 자유롭게 적어 보세요."></textarea><small>기록은 이 브라우저에만 저장돼요.</small><br><button class="action" id="saveActivity">활동 저장하고 읽기 완료 ✓</button><p id="saveMessage" aria-live="polite"></p></section><div class="reader-end"><p>같은 학년의 ${t[1]} 이야기를 더 만나 보세요.</p><button class="action" id="nextStory">${next.t[2]} →</button><button class="back-to-library" id="backToLibrary">목록으로 돌아가기</button></div>`;
  $('#reflection').value = progress[i]?.note || '';
  document.querySelectorAll('[data-jump]').forEach(button => button.onclick = () => {
    const panel = $(`#panel-${button.dataset.jump}`);
    panel.scrollIntoView({behavior: 'instant', block: 'start'});
    panel.querySelector('h3').setAttribute('tabindex', '-1');
    panel.querySelector('h3').focus({preventScroll: true});
  });
  document.querySelectorAll('[data-answer]').forEach(button => button.onclick = () => {
    const correct = +button.dataset.answer === t[9];
    document.querySelectorAll('[data-answer]').forEach(item => item.classList.remove('correct', 'wrong'));
    button.classList.add(correct ? 'correct' : 'wrong');
    $('.feedback').textContent = correct ? '정답이에요! ' + t[6] : '다시 생각해 볼까요? 오늘의 경제 씨앗을 읽어 보세요.';
    if (correct) { progress[i] = {...progress[i], quiz: true}; save(); }
  });
  $('#saveActivity').onclick = () => {
    progress[i] = {...progress[i], read: true, note: $('#reflection').value};
    const ok = save();
    $('#saveMessage').textContent = ok ? '저장했어요! 나의 활동에서 다시 볼 수 있어요.' : '브라우저 저장 공간을 사용할 수 없어 이번 화면에서만 기록돼요.';
    render();
  };
  $('#nextStory').onclick = () => readStory(next.i);
  $('#backToLibrary').onclick = () => $('#reader').close();
  if (!$('#reader').open) open($('#reader'));
  $('#reader').scrollTop = 0;
}
function activities() {
  $('#infoTitle').textContent = '나의 활동';
  const done = Object.entries(progress).filter(([i, record]) => topics[i] && record && (record.read || record.quiz || record.note));
  $('#infoBody').innerHTML = `<h2>작은 실천이 차곡차곡 🌱</h2><p>읽은 이야기 ${done.filter(([, record]) => record.read).length} / ${topics.length}편 · 퀴즈 정답 ${done.filter(([, record]) => record.quiz).length}개</p><p>학년마다 경제·노동·금융 각 2편, 모두 8장면으로 만나요.</p><p>기록은 현재 기기의 이 브라우저에만 보관돼요.</p><div id="savedItems"></div>`;
  if (!done.length) $('#savedItems').textContent = '아직 활동이 없어요. 마음에 드는 웹툰부터 읽어 볼까요?';
  done.forEach(([i, record]) => {
    const item = document.createElement('div'); item.className = 'activity-item';
    const title = document.createElement('strong'); title.textContent = `${topics[i][0]}학년 · ${topics[i][2]} ${record.read ? '✓' : ''}`;
    const note = document.createElement('p'); note.textContent = record.note || '퀴즈를 풀거나 이야기를 읽었어요.';
    item.append(title, note); $('#savedItems').append(item);
  });
  open($('#info'));
}
$('#activityNav').onclick = activities;
$('#activityButton').onclick = activities;
$('#guideNav').onclick = () => {
  $('#infoTitle').textContent = '선생님 안내';
  $('#infoBody').innerHTML = `<h2>이야기에서 생활 속 실천까지</h2><p>학년별 경제·노동·금융 학습 주제를 바탕으로 만든 ${topics.length}편의 웹툰입니다. 각 학년은 영역별 2편씩 6편이며, 모든 이야기는 8장면으로 구성됩니다.</p><p>지우와 하린이 문제를 발견하고, 선택을 고민하고, 함께 해결하는 과정을 읽습니다. 장면별 대표 삽화는 여러 이야기에서 함께 사용하며, 말풍선과 장면 제목으로 각 이야기를 구분합니다.</p><ol><li>도입 3분: 표지와 제목을 보고 경험 나누기</li><li>읽기 7~10분: 8장면의 인물 대사를 나누어 읽기</li><li>대화 5분: 어떤 선택을 했는지, 다른 방법은 없는지 이야기하기</li><li>확인 3분: 생각 퀴즈와 핵심 개념 확인하기</li><li>실천 10분: 이야기 끝의 생활 활동 수행하기</li></ol><p>1·2학년은 교사와 함께 읽거나 그림으로 답할 수 있습니다. 5·6학년 금융 활동은 실제 거래가 아닌 모의 체험으로 진행하세요. 계산에 사용하는 단리·기간 등의 가정을 함께 확인해 주세요.</p><p>학습 기록은 기기 내 브라우저에만 저장됩니다. 교사용 수집·학생 계정 기능은 없으며, 학생의 이름이나 개인정보를 입력하지 않도록 안내해 주세요.</p>`;
  open($('#info'));
};
render();
