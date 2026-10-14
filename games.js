(function(){
 const engines={};
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const shuffle=list=>{const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 function mount(root,story,onComplete){
  const game=story.game;let errors=0,finished=false;
  root.dataset.gameType=game.type;
  root.innerHTML='<div class="game-heading"><span>PLAY · 배움을 써 보는 시간</span><h3>'+esc(game.title)+'</h3></div><p id="game-rule"></p><div id="game-board"></div><p id="game-feedback" role="status" aria-live="polite"></p><div id="game-reward"></div>';
  const q=s=>root.querySelector(s),board=q('#game-board');
  root.onclick=event=>{const b=event.target.closest('button');if(!b)return;const attrs=[...b.attributes].filter(a=>a.name==='id'||a.name.startsWith('data-'));queueMicrotask(()=>{if(b.isConnected||!attrs.length)return;const selector='button'+attrs.map(a=>'['+a.name+'="'+CSS.escape(a.value)+'"]').join('');q(selector)?.focus({preventScroll:true});});};
  const tell=(message,bad=false)=>{q('#game-feedback').textContent=message;q('#game-feedback').className=bad?'incorrect':'';if(bad)errors++;};
  function finish(result={}){
   if(finished)return;finished=true;
   const stars=result.stars||(errors===0?3:errors<=2?2:1),saved=onComplete(stars);
   q('#game-reward').innerHTML='<div class="game-victory"><span class="stars">'+'★'.repeat(stars)+'☆'.repeat(3-stars)+'</span><h4>배움 미션 완료!</h4><p>'+esc(result.text||game.wrapUp||'선택한 결과를 살펴봤어요. 생활 활동에서도 그 까닭을 설명해 보세요.')+'</p><small>'+(saved?'게임 완료 기록을 이 브라우저에 저장했어요.':'이번 화면에는 기록됐지만 브라우저 저장 공간을 사용할 수 없어요.')+'</small><button class="action game-replay">다시 도전하기 ↻</button></div>';
   q('.game-replay').onclick=()=>mount(root,story,onComplete);
  }
  const ctx={root,story,game,board,q,esc,shuffle,tell,finish,get finished(){return finished}};
  if(engines[game.type])engines[game.type](ctx);else tell('이 게임을 열 수 없어요. 목록에서 다시 열어 주세요.');
 }
 window.MiniGames={register:(name,engine)=>{engines[name]=engine;},mount,engines};
})();
