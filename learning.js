(function(){
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function words(text,story){
  const terms=story.terms.slice().sort((a,b)=>b.length-a.length);
  const regex=new RegExp('('+terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','g');
  return text.split(regex).map(part=>terms.includes(part)?'<button type="button" class="term-word" data-term="'+esc(part)+'" aria-haspopup="dialog" aria-label="'+esc(part)+' 뜻 보기">'+esc(part)+'</button>':esc(part)).join('');
 }
 function pause(story,index){
  if(story.pause.after!==index)return '';
  return '<aside class="story-pause" aria-label="잠깐 생각하기"><h3>'+EcoMedia.mascot()+'모아와 잠깐 생각해요</h3><p>'+esc(story.pause.question)+'</p><p class="pause-note">정답은 없어요. 마음에 가까운 생각을 골라요.</p><div class="pause-options">'+story.pause.options.map((o,i)=>'<button type="button" data-pause="'+i+'" aria-pressed="false">'+esc(o)+'</button>').join('')+'</div><p class="pause-response" role="status">고르지 않고 계속 읽어도 좋아요.</p></aside>';
 }
 const termDialog=document.createElement('dialog');termDialog.id='termDialog';termDialog.setAttribute('aria-labelledby','termTitle');
 termDialog.innerHTML='<div class="dialog-top"><strong id="termTitle"></strong><button type="button" class="close" aria-label="용어 풀이 닫기">×</button></div><p id="termDefinition"></p>';
 document.body.append(termDialog);
 function mount(reader,story){
  const compare=reader.querySelector('#pauseCompare');
  reader.querySelectorAll('[data-term]').forEach(button=>button.onclick=()=>{
   termDialog.querySelector('#termTitle').textContent=button.dataset.term;
   termDialog.querySelector('#termDefinition').textContent=EcoGlossary[story.grade][button.dataset.term];
   reader.dispatchEvent(new Event('readinginterrupt'));termDialog.showModal();
  });
  reader.querySelectorAll('[data-pause]').forEach(button=>button.onclick=()=>{
   reader.querySelectorAll('[data-pause]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   const chosen=story.pause.options[+button.dataset.pause];
   reader.querySelector('.pause-response').textContent='내 예상: '+chosen+' · 끝까지 읽고 비교해 봐요.';
   compare.textContent='내 예상은 “'+chosen+'”이었어요. 이야기의 선택·결과와 무엇이 같거나 다른가요?';
  });
  reader.querySelectorAll('[data-teacher]').forEach(b=>b.onclick=()=>{reader.dispatchEvent(new Event('readinginterrupt'));teacher(story)});
 }
 function teacher(story){
  const info=document.querySelector('#info');
  document.querySelector('#infoTitle').textContent=story.grade+'학년 · '+story.subtitle+' 수업 자료';
  document.querySelector('#infoBody').innerHTML='<article class="teacher-sheet"><h2>'+esc(story.subtitle)+'</h2><p>'+story.grade+'학년 · '+esc(story.area)+' · '+story.teacher.minutes+'분 예시</p><h3>학습 목표</h3><p>'+esc(story.teacher.objective)+'</p><p>장면 읽기 10분 → 개념·퀴즈 5분 → 활동 10분 → 게임·되돌아보기 5분. 학급에 맞게 시간을 조절하세요.</p><h3>함께 나눌 질문</h3><ol>'+story.teacher.prompts.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ol><h3>그림·말·글로 해 보는 활동</h3><p>'+esc(story.activity)+'</p><p>이름·연락처를 쓰지 않아요. 그림이나 말로 표현해도 좋아요.</p><div class="worksheet-space" aria-label="생각을 그리거나 적는 칸"></div><h3>나의 선택과 까닭</h3><div class="worksheet-lines" aria-label="선택과 까닭을 적는 칸"></div><p>오늘의 말: '+story.terms.map(esc).join(' · ')+'</p><button type="button" id="printWorksheet" class="action">활동지 인쇄</button></article>';
  info.classList.add('teacher-info');document.body.classList.add('modal-open');
  if(!info.open)info.showModal();
  document.querySelector('#printWorksheet').onclick=()=>{document.body.classList.add('printing-worksheet');try{window.print()}finally{document.body.classList.remove('printing-worksheet')}};
  info.addEventListener('close',()=>info.classList.remove('teacher-info'),{once:true});
 }
 window.EcoLearning={words,pause,mount,teacher};
})();
