
const $ = selector => document.querySelector(selector);
const escapeHTML = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const areas = ['경제','노동','금융'];
const profiles = [
  {name:'첫 경제 걸음',description:'짧은 말과 가까운 경험으로 배우는 지우와 하린'},
  {name:'생활 속 발견',description:'이유를 말하고 작은 계획을 세우는 두 친구'},
  {name:'선택하는 힘',description:'비교하고 질문하며 동네를 탐험하는 두 친구'},
  {name:'합리적인 생활',description:'기록과 조사로 생각을 연결하는 두 친구'},
  {name:'경제를 보는 눈',description:'사회와 권리를 근거로 토론하는 두 친구'},
  {name:'세상과 연결',description:'세계와 미래를 계획하며 책임을 생각하는 두 친구'}
];
const LEGACY_MAP = [1,9,12,17,21,27,33,36,42,46,54,56,61,69,73,76,83,87,5,7,3,20,21,30,34,36,42,48,54,59,62,66,71,79,83,88];
let grade=0, category='전체', readerId=null, progress={};
function storageRead(key) {
  try { const v=JSON.parse(localStorage.getItem(key)||'null');return v&&typeof v==='object'&&!Array.isArray(v)?v:null; }catch{return null;}
}
function save(){try{localStorage.setItem('ecotoon-progress-v3',JSON.stringify(progress));return true;}catch{return false;}}
const existing=storageRead('ecotoon-progress-v3');
if(existing)progress=existing;
else {
 const legacy=storageRead('ecotoon-progress')||{};
 Object.entries(legacy).forEach(([index,record])=>{
   const target=STORIES[LEGACY_MAP[+index]-1];
   if(!target||!record||typeof record!=='object')return;
   const current=progress[target.id]||{};
   const notes=[current.note,typeof record.note==='string'?record.note:null].filter(Boolean);
   progress[target.id]={...current,read:current.read===true||record.read===true,quiz:current.quiz===true||record.quiz===true,note:notes.join('\n\n')};
 });
 if(Object.keys(progress).length)save();
}
function record(id){
 const p=progress[id];return p&&typeof p==='object'?p:{};
}
function artClass(story,art){return 'growth-art age-'+story.grade+' art-'+art;}
$('#grades').innerHTML='<button data-grade="0" class="selected" aria-pressed="true">전체 학년<small>모든 이야기</small></button>'+profiles.map((p,i)=>'<button data-grade="'+(i+1)+'" aria-pressed="false">'+(i+1)+'학년<small>'+p.name+'</small></button>').join('');
const growth=document.createElement('section');growth.className='growth-gallery';growth.id='growth';
growth.innerHTML='<div class="section-heading"><div><div class="eyebrow">한 해 한 해, 함께 자라는 친구들</div><h2>지우와 하린의 여섯 번의 성장</h2></div><p>같은 친구, 조금씩 깊어지는 이야기</p></div><div class="growth-steps">'+profiles.map((p,i)=>'<button data-growth="'+(i+1)+'"><div class="art-crop"><div class="growth-art age-'+(i+1)+' art-0" role="img" aria-label="'+(i+1)+'학년 지우와 하린"></div></div><b>'+(i+1)+'학년</b><span>'+p.name+'</span></button>').join('')+'</div><p class="growth-note">노랑 옷의 지우와 초록 옷의 하린. 외형과 말투가 학년과 함께 자라요.</p>';
$('#library').before(growth);
growth.querySelectorAll('[data-growth]').forEach(button=>button.onclick=()=>{selectGrade(+button.dataset.growth);$('#library').scrollIntoView({behavior:'auto'});});
function selectGrade(value){
 grade=value;
 document.querySelectorAll('#grades button').forEach(b=>{const selected=+b.dataset.grade===grade;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});
 render();
}
$('#grades').onclick=event=>{const button=event.target.closest('button');if(button)selectGrade(+button.dataset.grade);};
document.querySelectorAll('[data-category]').forEach(button=>{
 button.setAttribute('aria-pressed',button.dataset.category===category);
 button.onclick=()=>{category=button.dataset.category;document.querySelectorAll('[data-category]').forEach(b=>{const selected=b.dataset.category===category;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});render();};
});
function render(){
 const shown=STORIES.filter(s=>(!grade||s.grade===grade)&&(category==='전체'||s.area===category));
 $('#count').textContent='총 '+shown.length+'편 · 모두 8장면';
 $('#cards').innerHTML=shown.map(s=>{
  const p=record(s.id);
  return '<button class="card" data-story="'+s.id+'" aria-label="'+s.grade+'학년 '+escapeHTML(s.title)+' 읽기"><div class="cover art-crop"><div class="'+artClass(s,s.cover)+'" role="img" aria-label="'+s.grade+'학년 성장형 캐릭터의 '+escapeHTML(s.title)+' 대표 삽화"></div><span class="grade-label">'+s.grade+'학년</span>'+(p.read?'<span class="read-label">'+(p.gameDone?'게임 완료 ★':'게임 열림 ✓')+'</span>':'')+'</div><div class="card-body"><div class="tags"><span class="tag '+s.area+'">'+s.area+'</span><span>EP. '+String(s.number).padStart(2,'0')+'</span></div><h3>'+escapeHTML(s.title)+'</h3><p>'+escapeHTML(s.lesson)+'</p><div class="card-bottom"><span>▤ 8장면 · 완료 후 미니게임</span><b>읽어 보기 ↗</b></div></div></button>';
 }).join('');
}
function open(dialog){dialog.showModal();document.body.classList.add('modal-open');}
document.querySelectorAll('dialog').forEach(dialog=>{
 dialog.querySelector('.close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
});
$('#cards').onclick=event=>{const button=event.target.closest('[data-story]');if(button)readStory(button.dataset.story);};
function speech(line){
 const colon=line.indexOf(':');const person=colon>=0?line.slice(0,colon):'이야기',text=colon>=0?line.slice(colon+1).trim():line;
 const kind=person==='지우'?'jiwoo':person==='하린'?'harin':'guest';
 return '<div class="integrated-speech '+kind+'"><b>'+escapeHTML(person)+'</b><p>'+escapeHTML(text)+'</p></div>';
}
function readerGame(story){
 const zone=$('#miniGameZone'),p=record(story.id);
 zone.innerHTML='<div class="unlock-heading"><span>'+(p.read?'🎮':'🔒')+'</span><div><h3>'+escapeHTML(story.game.title)+'</h3><p>'+(p.read?'읽기를 완료했어요! 이제 배움을 게임에서 써 볼까요?':'위에서 활동을 저장하고 읽기를 완료하면 게임이 열려요.')+'</p></div></div><button class="action" id="startGame" '+(!p.read?'disabled':'')+'>'+(p.gameDone?'다시 게임하기 ↻':'미니게임 시작 →')+'</button>'+(p.gameDone?'<p class="game-record">지난 최고 기록: '+'★'.repeat(Math.max(1,Math.min(3,+p.gameStars||1)))+'</p>':'')+'<div id="miniGamePlay" hidden></div>';
 $('#startGame').onclick=()=>{
   if(!record(story.id).read)return;
   const root=$('#miniGamePlay');root.hidden=false;$('#startGame').hidden=true;
   window.MiniGames.mount(root,story,stars=>{
    progress[story.id]={...record(story.id),gameDone:true,gameStars:Math.max(+record(story.id).gameStars||0,stars)};
    const ok=save();render();return ok;
   });
   root.scrollIntoView({block:'start',behavior:'instant'});
 };
}
function readStory(id){
 const story=STORIES.find(s=>s.id===id);if(!story)return;readerId=id;
 const index=STORIES.indexOf(story),next=STORIES[(index+1)%STORIES.length];
 $('#readerLabel').textContent=story.grade+'학년 · '+story.area+' · 이야기 '+story.number+'/15';
 $('#readerBody').innerHTML='<div class="reader-title"><span class="tag '+story.area+'">'+story.area+' 이야기</span><h2>'+escapeHTML(story.title)+'</h2><p>'+escapeHTML(profiles[story.grade-1].description)+'</p><span class="reading-meta">8장면 · 함께 읽고 생각하기 · 완료 후 미니게임</span></div><nav class="panel-navigation" aria-label="장면 이동"><span>장면 바로가기</span>'+story.panels.map((p,i)=>'<button data-jump="'+i+'" aria-label="'+(i+1)+'장면으로 이동">'+(i+1)+'</button>').join('')+'</nav><div class="comic-panels grade-'+story.grade+'">'+story.panels.map((p,i)=>'<section class="integrated-panel" id="panel-'+i+'" aria-labelledby="panel-title-'+i+'"><div class="comic-stage"><div class="comic-art '+artClass(story,p.art)+'" role="img" aria-label="'+escapeHTML(p.caption)+'의 대표 삽화"></div><div class="stage-heading"><span>'+String(i+1).padStart(2,'0')+' / 08</span><h3 id="panel-title-'+i+'">'+escapeHTML(p.caption)+'</h3></div>'+p.lines.map(speech).join('')+'</div></section>').join('')+'</div><section class="learn-box"><strong>🌱 오늘의 경제 씨앗</strong><p>'+escapeHTML(story.lesson)+'</p></section><section class="quiz"><strong>💡 생각 퀴즈</strong><p>'+escapeHTML(story.quiz.question)+'</p>'+story.quiz.options.map((option,i)=>'<button data-answer="'+i+'">'+(i+1)+'. '+escapeHTML(option)+'</button>').join('')+'<p class="feedback" aria-live="polite"></p></section><section class="activity"><strong>✎ 생활 속으로 한 걸음</strong><p>'+escapeHTML(story.activity)+'</p><label for="reflection">나의 생각과 실천 기록</label><textarea id="reflection" placeholder="이름·연락처 없이 나의 생각을 적어요. 글 대신 어른과 이야기하거나 그림으로 활동해도 좋아요."></textarea><small>기록은 현재 기기의 이 브라우저에만 저장돼요.</small><br><button class="action" id="saveActivity">활동 저장하고 읽기 완료 ✓</button><p id="saveMessage" role="status" aria-live="polite"></p></section><section class="mini-game-zone" id="miniGameZone"></section><div class="reader-end"><p>다음 이야기로 배움을 이어 가요.</p><button class="action" id="nextStory">'+next.grade+'학년 · '+escapeHTML(next.title)+' →</button><button class="back-to-library" id="backToLibrary">목록으로 돌아가기</button></div>';
 $('#reflection').value=typeof record(id).note==='string'?record(id).note:'';
 document.querySelectorAll('[data-jump]').forEach(button=>button.onclick=()=>{const panel=$('#panel-'+button.dataset.jump);panel.scrollIntoView({behavior:'instant',block:'start'});const h=panel.querySelector('h3');h.setAttribute('tabindex','-1');h.focus({preventScroll:true});});
 document.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>{
   const correct=+button.dataset.answer===story.quiz.answer;
   document.querySelectorAll('[data-answer]').forEach(b=>b.classList.remove('correct','wrong'));
   button.classList.add(correct?'correct':'wrong');$('.feedback').textContent=correct?'맞아요! '+story.lesson:'다시 생각해 볼까요? 오늘의 경제 씨앗을 살펴보세요.';
   if(correct){progress[id]={...record(id),quiz:true};save();}
 });
 $('#saveActivity').onclick=()=>{
   progress[id]={...record(id),read:true,note:$('#reflection').value};
   const ok=save();
   $('#saveMessage').textContent=ok?'저장했어요! 아래 미니게임이 열렸어요.':'읽기는 완료했지만 브라우저 저장을 사용할 수 없어요. 게임은 이번 화면에서 열려요.';
   readerGame(story);render();
 };
 $('#nextStory').onclick=()=>readStory(next.id);$('#backToLibrary').onclick=()=>$('#reader').close();
 readerGame(story);
 if(!$('#reader').open)open($('#reader'));$('#reader').scrollTop=0;
}
function activities(){
 $('#infoTitle').textContent='나의 활동';
 const done=STORIES.filter(s=>{const p=record(s.id);return p.read||p.quiz||p.note||p.gameDone;});
 $('#infoBody').innerHTML='<h2>배움과 실천이 차곡차곡 🌱</h2><div class="activity-stats"><span>읽기 <b>'+done.filter(s=>record(s.id).read).length+' / 90</b></span><span>미니게임 <b>'+done.filter(s=>record(s.id).gameDone).length+' / 90</b></span></div><p>학년마다 15편씩, 경제·노동·금융 5편씩 만나요.</p><p>기록은 이 브라우저에만 보관됩니다.</p><div id="savedItems"></div>';
 if(!done.length)$('#savedItems').textContent='아직 활동이 없어요. 내 학년 이야기부터 만나 볼까요?';
 done.forEach(s=>{
   const p=record(s.id),item=document.createElement('div');item.className='activity-item';
   const title=document.createElement('strong');title.textContent=s.grade+'학년 · '+s.title;
   const status=document.createElement('p');status.textContent=(p.read?'읽기 완료 ✓':'읽기 진행')+(p.gameDone?' · 게임 완료 '+'★'.repeat(Math.max(1,Math.min(3,+p.gameStars||1))):p.read?' · 게임 열림':'');
   const note=document.createElement('p');note.textContent=typeof p.note==='string'?p.note:'아직 남긴 생각이 없어요.';
   const button=document.createElement('button');button.className='action';button.textContent='이야기와 게임 다시 보기';button.onclick=()=>{$('#info').close();readStory(s.id);};
   item.append(title,status,note,button);$('#savedItems').append(item);
 });open($('#info'));
}
$('#activityNav').onclick=activities;$('#activityButton').onclick=activities;
$('#guideNav').onclick=()=>{
 $('#infoTitle').textContent='선생님 안내';
 $('#infoBody').innerHTML='<h2>함께 자라는 경제 이야기</h2><p>1~6학년 각 15편, 경제·노동·금융 각 5편으로 총 90편입니다. 학년별 성장형 지우·하린과 만화 안의 말풍선으로 8장면을 읽습니다. 학년별 대표 삽화를 여러 장면에서 함께 사용합니다.</p><ol><li>경험을 나누고 학년별 이야기를 고릅니다.</li><li>만화의 8장면을 읽고 선택과 이유를 이야기합니다.</li><li>퀴즈와 생활 활동을 합니다. 저학년은 그림이나 구술도 가능합니다.</li><li>활동 저장하고 읽기 완료를 누르면 주제별 미니게임이 열립니다.</li><li>게임 결과와 생활 활동을 연결해 다시 생각합니다.</li></ol><p>노래 활동은 새로 만든 리듬을 사용합니다. 금융·무역·창업 게임은 놀이 돈과 가상 상황으로만 진행하며 실제 거래나 투자 추천이 아닙니다. 직업·계약 체험은 안전한 모의 활동이며 실제 취업이 아닙니다.</p><p>기록은 기기 내 브라우저에만 저장됩니다. 계정·교사용 수집·다른 기기 동기화는 제공하지 않습니다. 이름과 연락처, 실제 계좌·신용 정보를 입력하지 않도록 안내해 주세요.</p>';
 open($('#info'));
};
const total=document.querySelector('.intro-strip span:nth-of-type(2) b');if(total)total.textContent=STORIES.length;
render();
