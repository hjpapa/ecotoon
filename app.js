
const $ = selector => document.querySelector(selector);
const escapeHTML = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const areas = ['경제','노동','금융'];
const Flow = window.LearningFlow;
let activeStep = 'comic', sessionSteps = new Set(), suppressScrollTracking = false;
let scrollFrame = 0, comicReader = null;
const profiles = [
  {name:'첫 경제 걸음',description:'짧은 말과 가까운 경험으로 배우는 지우와 하린'},
  {name:'생활 속 발견',description:'이유를 말하고 작은 계획을 세우는 두 친구'},
  {name:'선택하는 힘',description:'비교하고 질문하며 동네를 탐험하는 두 친구'},
  {name:'합리적인 생활',description:'기록과 조사로 생각을 연결하는 두 친구'},
  {name:'경제를 보는 눈',description:'사회와 권리를 근거로 토론하는 두 친구'},
  {name:'세상과 연결',description:'세계와 미래를 계획하며 책임을 생각하는 두 친구'}
];
let grade=0, category='전체', readerId=null;
const classroomStore=window.classroomStore=ClassroomStorage.create({
 getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)
},STORIES);
let progress=classroomStore.current().records;
function save(){
 const ok=classroomStore.save(progress);
 if(window.refreshClassroomStatus)window.refreshClassroomStatus();
 if(!ok&&$('#reader').open)$('#linkMessage').textContent=classroomStore.issue();
 return ok;
}
window.applyClassroomProfile=()=>{progress=classroomStore.current().records;render();};
function record(id){
 const p=progress[id];return p&&typeof p==='object'?p:{};
}
function episodeArt(story,index,description){
 const sheet=story.illustration;
 const col=index%sheet.columns,row=Math.floor(index/sheet.columns);
 return '<div class="episode-art"><div class="episode-tile"><img src="'+escapeHTML(sheet.src)+'" width="'+sheet.width+'" height="'+sheet.height+'" loading="lazy" decoding="async" alt="'+escapeHTML(description)+'" style="width:'+sheet.columns*100+'%;height:'+sheet.rows*100+'%;left:'+(-col*100)+'%;top:'+(-row*100)+'%"></div></div>';
}
function episodeRatio(story){const s=story.illustration;return s.width*s.rows/(s.height*s.columns);}
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
  const p=record(s.id), flags=Flow.progressFlags(p);
  const stages=[['read','읽기'],['quiz','퀴즈'],['activity','활동'],['game','게임']];
  const status=stages.map(([key,label])=>label+' '+(flags[key]?'완료':'미완료')).join(', ');
  const marks='<span class="card-progress" aria-hidden="true">'+stages.map(([key,label])=>'<span data-complete="'+flags[key]+'"><span>'+EcoIcons(flags[key]?'check':'circle')+'</span> '+label+'</span>').join('')+'</span>';
  return '<article class="card"><a class="card-link" data-story="'+s.id+'" href="'+Flow.storyHash(s.id)+'" aria-labelledby="title-'+s.id+'" aria-describedby="hook-'+s.id+' progress-'+s.id+'"><div class="cover episode-cover" style="--episode-ratio:'+episodeRatio(s)+'">'+episodeArt(s,0,s.subtitle+' · '+s.panels[0].caption)+'<span class="grade-label">'+s.grade+'학년</span>'+(p.read?'<span class="read-label">'+(p.gameDone?'게임 완료 ★':'게임 열림 ✓')+'</span>':'')+'</div><div class="card-body"><div class="tags"><span class="tag '+s.area+'">'+s.area+'</span><span>EP. '+String(s.number).padStart(2,'0')+'</span></div><h3 id="title-'+s.id+'">'+s.grade+'학년 · '+escapeHTML(s.title)+'</h3><span class="story-subtitle">'+escapeHTML(s.subtitle)+'</span><p id="hook-'+s.id+'">'+escapeHTML(s.hook)+'</p><span class="sr-only" id="progress-'+s.id+'">'+status+'</span>'+marks+'<div class="card-bottom"><span>'+EcoIcons('book')+' 8장면 · 활동 후 게임</span><b>읽어 보기 '+EcoIcons('arrow')+'</b></div></div></a></article>';
 }).join('');
}
function open(dialog){dialog.showModal();document.body.classList.add('modal-open');}
document.querySelectorAll('dialog').forEach(dialog=>{
 dialog.querySelector('.close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{
   if(dialog.open)return;
   document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));
   if(dialog.id==='reader'){
     const closedId=readerId;readerId=null;sessionSteps.clear();
     if(comicReader)comicReader.destroy();comicReader=null;
     if(Flow.parseRoute(location.hash,STORIES)){
       if(history.state&&history.state.ecotoonReader)history.back();
       else history.replaceState(null,'','#library');
     }
     const opener=document.querySelector('[data-story="'+closedId+'"]')||$('#grades button.selected');
     if(opener)opener.focus({preventScroll:true});
   }
 });
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
});
$('#cards').onclick=event=>{
 const link=event.target.closest('a[data-story]');
 if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 event.preventDefault();readStory(link.dataset.story);
};
// One reader history entry: stage/episode changes replace it, Back returns to the library.
function readStory(id,step='comic'){
 const hash=Flow.storyHash(id,step);if(!Flow.parseRoute(hash,STORIES))return;
 if($('#info').open)$('#info').close();
 if($('#reader').open)history.replaceState({ecotoonReader:true},'',hash);
 else history.pushState({ecotoonReader:true},'',hash);
 syncRoute();
}
function syncRoute(){
 const route=Flow.parseRoute(location.hash,STORIES);
 if(!route){
   if(location.hash.startsWith('#/')){
     $('#routeNotice').hidden=false;
     $('#routeNotice').textContent='이야기 주소를 찾을 수 없어요. 목록에서 다시 골라 주세요.';
     history.replaceState(null,'','#library');
   }
   if($('#reader').open)$('#reader').close();
   return;
 }
 $('#routeNotice').hidden=true;
 if($('#info').open)$('#info').close();
 if(readerId!==route.id||!$('#reader').open)mountReader(route.id);
 scrollToStep(route.step);
}
function updateSteps(){
 if(!readerId)return;
 const p=record(readerId),done={comic:p.read===true||sessionSteps.has('comic'),
   summary:p.read===true||sessionSteps.has('summary'),quiz:p.quiz===true,activity:p.read===true,game:p.gameDone===true};
 Flow.steps.forEach((step,i)=>{
   const button=$('#readerSteps [data-stage="'+step.key+'"]');
   button.dataset.complete=String(done[step.key]);
   button.querySelector('.step-mark').textContent=done[step.key]?'✓':String(i+1);
   button.setAttribute('aria-label',(i+1)+'단계 '+step.label+' · '+(done[step.key]?'완료':'미완료')+(step.key===activeStep?' · 현재 단계':''));
   if(step.key===activeStep)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
 });
}
function setActiveStep(step){
 activeStep=step;if(comicReader)comicReader.setStage(step);updateSteps();
 if(step!=='comic')$('#returnToLearning').hidden=true;
 $('#reader').style.setProperty('--reader-offset',($('.reader-toolbar').offsetHeight+18)+'px');
 const hash=Flow.storyHash(readerId,step);
 if(location.hash!==hash)history.replaceState({ecotoonReader:true},'',hash);
}
function scrollToStep(key){
 const step=Flow.steps.find(step=>step.key===key);if(!step||!readerId)return;
 suppressScrollTracking=true;setActiveStep(key);
 const target=key==='comic'&&comicReader?comicReader.target():document.getElementById(step.target);
 if($('#reader').dataset.readingMode!=='board')target.scrollIntoView({block:'start',behavior:'instant'});
 target.focus({preventScroll:true});
 requestAnimationFrame(()=>requestAnimationFrame(()=>{suppressScrollTracking=false;}));
}
function trackReaderStep(){
 if(!readerId||!$('#reader').open||suppressScrollTracking)return;
 if(comicReader)comicReader.trackScroll();
 if($('#reader').dataset.readingMode==='board')return;
 const reader=$('#reader'),top=$('.reader-toolbar').getBoundingClientRect().bottom+24;
 let current='comic';
 Flow.steps.forEach(step=>{if(document.getElementById(step.target).getBoundingClientRect().top<=top)current=step.key;});
 if(reader.scrollTop+reader.clientHeight>=reader.scrollHeight-3)current='game';
 if(current!==activeStep)setActiveStep(current);
}
$('#reader').addEventListener('scroll',()=>{
 cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(trackReaderStep);
});
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{
 $('#reader').style.setProperty('--reader-offset',($('.reader-toolbar').offsetHeight+18)+'px');
}).observe($('.reader-toolbar'));
$('#shareStory').onclick=async()=>{
 const url=location.href,message=$('#linkMessage');message.replaceChildren();
 try{
   await navigator.clipboard.writeText(url);
   message.textContent='현재 이야기와 단계의 링크를 복사했어요.';
 }catch{
   message.textContent='아래 주소를 선택해 복사해 주세요.';
   const input=document.createElement('input');input.readOnly=true;input.value=url;
   input.setAttribute('aria-label','공유할 이야기 주소');message.append(input);input.select();
 }
};
window.addEventListener('popstate',syncRoute);
window.addEventListener('hashchange',syncRoute);
function speech(line,reversed){
 const colon=line.indexOf(':');const person=colon>=0?line.slice(0,colon):'이야기',text=colon>=0?line.slice(colon+1).trim():line;
 const kind=person==='지우'?'jiwoo':person==='하린'?'harin':'guest';
 let side=person==='하린'?'right':'left';if(reversed)side=side==='left'?'right':'left';
 return '<div class="integrated-speech '+kind+' speaker-'+side+'"><b>'+escapeHTML(person)+'</b><p>'+escapeHTML(text)+'</p></div>';
}
function storyScene(story,p,index){
 return '<section class="integrated-panel" id="panel-'+index+'" tabindex="-1" aria-labelledby="panel-title-'+index+'"><div class="comic-stage"><div class="stage-heading"><span>'+String(index+1).padStart(2,'0')+' / 08</span><p id="panel-title-'+index+'">'+escapeHTML(p.caption)+'</p></div><div class="scene-picture" style="aspect-ratio:'+episodeRatio(story)+'">'+episodeArt(story,index,p.caption)+'</div><div class="dialogue-flow">'+p.lines.map(line=>speech(line,p.reverseSpeakers)).join('')+'</div></div></section>';
}
function summaryContent(story){
 const labels=['문제 · 어떤 일이 있었나요?','선택 · 어떻게 했나요?','결과 · 무엇이 달라졌나요?'];
 const recap='<ol class="story-recap">'+story.recap.map((panel,i)=>'<li><figure><div class="recap-picture" style="aspect-ratio:'+episodeRatio(story)+'">'+episodeArt(story,panel,'')+'</div><figcaption><strong>'+labels[i]+'</strong><p>'+escapeHTML(story.panels[panel].caption)+'</p><button type="button" data-recap="'+panel+'">'+(panel+1)+'장면 다시 보기</button></figcaption></figure></li>').join('')+'</ol>';
 const terms='<dl class="summary-terms">'+story.terms.map(term=>'<div><dt>'+escapeHTML(term)+'</dt><dd>'+escapeHTML(window.EcoGlossary[story.grade][term])+'</dd></div>').join('')+'</dl>';
 return recap+'<div class="economic-seed"><strong>🌱 오늘의 경제 씨앗</strong><p>'+escapeHTML(story.lesson)+'</p></div><h4 class="terms-heading">핵심 용어</h4>'+terms;
}
function revisitScene(panel,returnStep){
 comicReader.showScene(panel);
 const button=$('#returnToLearning');
 button.hidden=false;button.textContent=returnStep==='quiz'?'퀴즈로 돌아가기 →':'개념 정리로 돌아가기 →';
 button.onclick=()=>scrollToStep(returnStep);
 $('#reader').style.setProperty('--reader-offset',($('.reader-toolbar').offsetHeight+18)+'px');
 const target=$('#panel-'+panel);target.scrollIntoView({block:'start',behavior:'instant'});target.focus({preventScroll:true});
}
function readerGame(story){
 const zone=$('#miniGameZone');
 zone.innerHTML='<h3 class="learning-heading">⑤ 게임 · 다른 상황에 써 보기</h3><div class="unlock-heading"><span id="gameLockIcon" aria-hidden="true"></span><div><h4>'+escapeHTML(story.game.title)+'</h4><p id="gameLockMessage"></p></div></div><button class="action" id="goToActivity">④ 활동으로 이동 →</button><button class="action" id="startGame"></button><p class="game-record" id="gameRecord"></p><div id="miniGamePlay" hidden></div>';
 updateGameAvailability(story);
 $('#goToActivity').onclick=()=>scrollToStep('activity');
 $('#startGame').onclick=()=>{
   if(!record(story.id).read)return;
   const root=$('#miniGamePlay');root.hidden=false;$('#startGame').hidden=true;
   window.MiniGames.mount(root,story,stars=>{
    progress[story.id]={...record(story.id),gameDone:true,gameStars:Math.max(+record(story.id).gameStars||0,stars)};
    const ok=save();render();updateSteps();updateGameAvailability(story);return ok;
   });
   scrollToStep('game');
 };
}
function updateGameAvailability(story){
 const p=record(story.id),unlocked=p.read===true;
 $('#gameLockIcon').textContent=unlocked?'🎮':'🔒';
 $('#gameLockMessage').textContent=unlocked?'활동을 마쳤어요. 배운 내용을 새로운 상황에 써 보세요.':'④ 활동을 마치면 열려요. 글·그림·이야기 나누기 중 편한 방법으로 활동해요.';
 $('#goToActivity').hidden=unlocked;
 $('#startGame').disabled=!unlocked;
 $('#startGame').textContent=p.gameDone?'다시 게임하기 ↻':'미니게임 시작 →';
 $('#gameRecord').hidden=!p.gameDone;
 $('#gameRecord').textContent=p.gameDone?'지난 최고 기록: '+'★'.repeat(Math.max(1,Math.min(3,+p.gameStars||1))):'';
 // Never replace #miniGamePlay here: it owns the in-progress game and its result.
}
function mountReader(id){
 const story=STORIES.find(s=>s.id===id);if(!story)return;readerId=id;
 if(comicReader)comicReader.destroy();comicReader=null;
 sessionSteps=new Set();activeStep='comic';
 const next=Flow.nextStory(STORIES,story,category);
 $('#readerLabel').textContent=classroomStore.current().name+' · '+story.grade+'학년 · '+story.area+' · 이야기 '+story.number+'/15';
 $('#linkMessage').replaceChildren();
 $('#returnToLearning').hidden=true;
 $('#readerSteps').innerHTML=Flow.steps.map((step,i)=>'<button type="button" data-stage="'+step.key+'" aria-controls="'+step.target+'"><span class="step-mark" aria-hidden="true">'+(i+1)+'</span><span>'+step.label+'</span></button>').join('');
 $('#readerSteps').querySelectorAll('[data-stage]').forEach(button=>button.onclick=()=>scrollToStep(button.dataset.stage));
 $('#readerBody').innerHTML=`
  <section id="stage-comic" data-learning-stage="comic" tabindex="-1" aria-label="① 웹툰">
    <div class="reader-title"><span class="tag ${story.area}">${story.area} 이야기</span><h2>${escapeHTML(story.subtitle)}</h2><p class="reader-topic">학습 주제 · ${escapeHTML(story.title)}</p><p class="story-hook">${escapeHTML(story.hook)}</p><span class="reading-meta">① 웹툰 → ② 정리 → ③ 퀴즈 → ④ 활동 → ⑤ 게임</span></div>
    <div class="comic-panels grade-${story.grade}">${story.panels.map((p,i)=>storyScene(story,p,i)).join('')}</div>
    <div id="sceneControls" class="scene-controls"></div>
    <button id="scrollComicDone" class="action step-forward" data-continue="summary">웹툰을 읽었어요 · 개념 정리로 →</button>
  </section>
  <section id="stage-summary" class="learn-box" data-learning-stage="summary" tabindex="-1" aria-label="② 개념 정리">
    <h3 class="learning-heading">② 개념 정리 · 배움에 이름 붙이기</h3>${summaryContent(story)}
    <button class="action step-forward" data-continue="quiz">개념을 살펴봤어요 · 퀴즈로 →</button>
  </section>
  <section id="stage-quiz" class="quiz" data-learning-stage="quiz" tabindex="-1" aria-label="③ 퀴즈">
    <h3 class="learning-heading">③ 퀴즈 · 이해했는지 확인하기</h3><span class="quiz-kind">${story.quiz.kind==='story'?'이야기 속 선택 살펴보기':'새로운 상황에 적용하기'}</span><p class="quiz-question">${escapeHTML(story.quiz.question)}</p>
    ${story.quiz.options.map((option,i)=>'<button data-answer="'+i+'">'+(i+1)+'. '+escapeHTML(option)+'</button>').join('')}
    <p class="feedback" role="status" aria-live="polite"></p><button type="button" id="quizSceneButton" hidden>${story.quiz.hintPanel+1}장면 다시 보기 →</button><button class="action step-forward" data-continue="activity">생활 속 활동으로 →</button>
  </section>
  <section id="stage-activity" class="activity" data-learning-stage="activity" tabindex="-1" aria-label="④ 활동">
    <h3 class="learning-heading">④ 활동 · 생활로 옮기기</h3><p>${escapeHTML(story.activity)}</p>
    <label for="reflection">나의 생각과 실천 기록 <span class="optional-note">(선택)</span></label><textarea maxlength="10000" id="reflection" placeholder="이름·연락처 없이 나의 생각을 적어요. 글 대신 어른과 이야기하거나 그림으로 활동해도 좋아요."></textarea><small>기록은 현재 기기의 이 브라우저에만 저장돼요.</small><br>
    <button class="action" id="saveActivity">활동 마치고 게임 열기 →</button><p id="saveMessage" role="status" aria-live="polite"></p>
  </section>
  <section class="mini-game-zone" id="miniGameZone" data-learning-stage="game" tabindex="-1" aria-label="⑤ 게임"></section>
  <div class="reader-end"><p>${next?'같은 학년의 다음 이야기로 배움을 이어 가요.':story.number===15?'이 학년의 마지막 이야기예요. 나의 배움을 돌아볼까요?':'선택한 영역의 마지막 이야기예요. 학년 전체의 배움도 살펴봐요.'}</p>
    ${next?'<button class="action" id="nextStory">'+next.grade+'학년 · '+escapeHTML(next.subtitle)+' →</button>':'<button class="action" id="finishGrade">학년 학습 돌아보기 →</button>'}
    <button class="back-to-library" id="backToLibrary">목록으로 돌아가기</button>
  </div><section id="gradeEnd" class="grade-completion" hidden tabindex="-1" aria-label="학년 학습 돌아보기"></section>`;
 $('#reflection').value=typeof record(id).note==='string'?record(id).note:'';
 document.querySelectorAll('[data-recap]').forEach(button=>button.onclick=()=>revisitScene(+button.dataset.recap,'summary'));
 $('#quizSceneButton').onclick=()=>revisitScene(story.quiz.hintPanel,'quiz');
 document.querySelectorAll('[data-continue]').forEach(button=>button.onclick=()=>{
   if(button.dataset.continue==='summary')sessionSteps.add('comic');
   if(button.dataset.continue==='quiz')sessionSteps.add('summary');
   scrollToStep(button.dataset.continue);
 });
 document.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>{
   const correct=+button.dataset.answer===story.quiz.answer;
   document.querySelectorAll('[data-answer]').forEach(b=>b.classList.remove('correct','wrong'));
   button.classList.add(correct?'correct':'wrong');$('.feedback').textContent=correct?'맞아요! '+story.quiz.explain:'다시 살펴볼까요? '+story.quiz.hint;
   $('#quizSceneButton').hidden=correct;
   if(correct){progress[id]={...record(id),quiz:true};save();render();updateSteps();}
 });
 if(record(id).quiz===true)$('.feedback').textContent='이 퀴즈를 이미 맞혔어요. 다시 풀어 볼 수 있어요.';
 $('#saveActivity').onclick=()=>{
   progress[id]={...record(id),read:true,note:$('#reflection').value};
   const ok=save();
   $('#saveMessage').textContent=ok?'활동을 저장했어요! 게임이 열렸어요. 진행하던 게임은 그대로 이어져요.':'활동을 마쳤어요. 브라우저 저장은 사용할 수 없지만 이번 화면에서 게임을 할 수 있어요.';
   updateGameAvailability(story);render();updateSteps();scrollToStep('game');
 };
 if(next)$('#nextStory').onclick=()=>readStory(next.id);
 else $('#finishGrade').onclick=()=>showGradeEnd(story);
 $('#backToLibrary').onclick=()=>$('#reader').close();
 readerGame(story);
 comicReader=window.ComicReader.mount($('#reader'),story,{onComic:()=>scrollToStep('comic'),onSummary:()=>{sessionSteps.add('comic');scrollToStep('summary');}});
 if(!$('#reader').open)open($('#reader'));
 $('#reader').style.setProperty('--reader-offset',($('.reader-toolbar').offsetHeight+18)+'px');
 updateSteps();
}
function showGradeEnd(story){
 const summary=Flow.gradeProgress(STORIES,story.grade,progress),end=$('#gradeEnd');
 const complete=summary.completed===summary.total;
 end.innerHTML='<span class="completion-symbol" aria-hidden="true">'+(complete?'★':'🌱')+'</span><h2>'+story.grade+'학년 '+(complete?'학습을 모두 마쳤어요!':'배움을 차곡차곡 모아요')+'</h2><p>읽기·퀴즈·활동·게임까지 마친 이야기 <strong>'+summary.completed+' / '+summary.total+'편</strong></p><p>'+(complete?'열다섯 이야기에서 만난 배움을 생활 속에서도 써 보세요.':'마지막 편에 왔어요. 아직 남은 이야기는 천천히 이어 가도 좋아요.')+'</p>'+(summary.next?'<button class="action" id="resumeGrade">남은 이야기 이어 보기 →</button>':'')+'<button class="back-to-library" id="gradeLibrary">'+story.grade+'학년 전체 목록 보기</button>';
 end.hidden=false;
 if(summary.next)$('#resumeGrade').onclick=()=>{
   const p=record(summary.next.id);
   readStory(summary.next.id,p.read?(p.quiz?'game':'quiz'):'comic');
 };
 $('#gradeLibrary').onclick=()=>{
   category='전체';document.querySelectorAll('[data-category]').forEach(button=>{
     const selected=button.dataset.category===category;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',selected);
   });
   selectGrade(story.grade);$('#reader').close();$('#library').scrollIntoView({behavior:'instant'});
 };
 end.scrollIntoView({behavior:'instant',block:'start'});end.focus({preventScroll:true});
}
function activities(){
 $('#infoTitle').textContent=classroomStore.current().emoji+' '+classroomStore.current().name+'의 활동';
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
 $('#infoBody').innerHTML='<h2>함께 자라는 경제 이야기</h2><p>1~6학년 각 15편, 경제·노동·금융 각 5편으로 총 90편입니다. 학년별 성장형 지우·하린과 만화 안의 말풍선으로 8장면을 읽습니다. 장면마다 상황 묘사와 두 친구의 대화를 읽으며 사건·선택·결과를 따라갑니다. 각 이야기의 8장면은 상황·행동·표정에 맞춰 새로 제작한 전용 삽화로 이어집니다.</p><ol><li>경험을 나누고 학년별 이야기를 고릅니다.</li><li>만화의 8장면을 읽고 누가 무엇을 원했는지, 무엇을 골랐고 어떤 결과가 생겼는지 이야기합니다.</li><li>배운 개념을 정리하고 퀴즈와 생활 활동을 합니다. 저학년은 그림이나 구술도 가능합니다.</li><li>활동 마치고 게임 열기를 누르면 주제별 미니게임이 열립니다.</li><li>게임 결과와 생활 활동을 연결해 다시 생각합니다.</li></ol><p>노래 활동은 새로 만든 리듬을 사용합니다. 금융·무역·창업 게임은 놀이 돈과 가상 상황으로만 진행하며 실제 거래나 투자 추천이 아닙니다. 직업·계약 체험은 안전한 모의 활동이며 실제 취업이 아닙니다.</p><p>기록은 기기 내 브라우저에만 저장됩니다. 상단 별명 버튼에서 학생별 프로필을 선택하고 기록을 JSON 파일로 저장·불러올 수 있습니다. 공용 기기에서는 수업 전에 내 별명을 확인하고 수업 후 필요한 기록을 저장한 뒤 지워 주세요. 프로필은 비밀번호가 없는 구분 기능이며 같은 기기 사용자가 모두 열어 볼 수 있습니다. 계정·교사용 수집·자동 동기화는 제공하지 않습니다. 이름과 연락처, 실제 계좌·신용 정보를 입력하지 않도록 안내해 주세요.</p>';
 open($('#info'));
};
const total=document.querySelector('.intro-strip span:nth-of-type(2) b');if(total)total.textContent=STORIES.length;
render();
// Seed an in-page Back destination when a shared story URL is opened directly.
if(Flow.parseRoute(location.hash,STORIES)&&!(history.state&&history.state.ecotoonReader)){
 const hash=location.hash;history.replaceState(null,'','#library');history.pushState({ecotoonReader:true},'',hash);
}
syncRoute();
