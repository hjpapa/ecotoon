(function(){
 const engines={};
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const shuffle=list=>{const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 function mount(root,story,onComplete,context={}){
  const game=story.game;let errors=0,finished=false;
  root.dataset.gameType=game.type;
  root.innerHTML='<div class="game-heading"><span>PLAY · 배움을 써 보는 시간</span><h3>'+esc(game.title)+'</h3></div><p id="game-rule"></p><div id="game-board"></div><p id="game-feedback" role="status" aria-live="polite"></p><div id="game-reward"></div>';
  const q=s=>root.querySelector(s),board=q('#game-board');
  root.onclick=event=>{const b=event.target.closest('button');if(!b)return;const attrs=[...b.attributes].filter(a=>a.name==='id'||a.name.startsWith('data-'));queueMicrotask(()=>{if(b.isConnected||!attrs.length)return;const selector='button'+attrs.map(a=>'['+a.name+'="'+CSS.escape(a.value)+'"]').join('');q(selector)?.focus({preventScroll:true});});};
  const tell=(message,bad=false)=>{q('#game-feedback').innerHTML=EcoMedia.mascot()+'<span>모아: '+esc(message)+'</span>'+EcoMedia.reaction(story.grade,bad?'think':'correct');q('#game-feedback').className=bad?'incorrect':'';if(bad)errors++;};
  function finish(result={}){
   if(finished)return;finished=true;
   const stars=result.stars||(errors===0?3:errors<=2?2:1),saved=onComplete(stars);
   q('#game-reward').innerHTML='<div class="game-victory"><span class="stars">'+'★'.repeat(stars)+'☆'.repeat(3-stars)+'</span><h4>배움 미션 완료!</h4>'+EcoMedia.reaction(story.grade,'celebrate')+'<p>'+esc(result.text||game.wrapUp||'선택한 결과를 살펴봤어요. 생활 활동에서도 그 까닭을 설명해 보세요.')+'</p><small>'+(saved?'게임 완료 기록을 이 브라우저에 저장했어요.':'이번 화면에는 기록됐지만 브라우저 저장 공간을 사용할 수 없어요.')+'</small><button class="action game-replay">다시 도전하기 ↻</button></div>';
   const note=typeof context.activityNote==='function'?context.activityNote():'';
   q('.game-victory').insertAdjacentHTML('beforeend','<details class="game-connection"><summary>내 활동과 연결하기</summary><p>'+(note?'게임을 마칠 때 남긴 활동 기록: '+esc(note.slice(0,300))+(note.length>300?'…':''):'그림으로 했거나 나눈 이야기를 떠올려요.')+'</p><p>내 활동과 이번 게임에서 고른 방법은 무엇이 같거나 달랐나요?</p></details>');
   q('.game-replay').onclick=()=>mount(root,story,onComplete,context);
  }
  const ctx={root,story,game,board,q,esc,shuffle,tell,finish,get finished(){return finished}};
  if(engines[game.type])engines[game.type](ctx);else tell('이 게임을 열 수 없어요. 목록에서 다시 열어 주세요.');
 }
 window.MiniGames={register:(name,engine)=>{engines[name]=engine;},mount,engines};
})();
