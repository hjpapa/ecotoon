MiniGames.register('portfolio',function(ctx){
 const {game,board,q,esc,tell,finish}=ctx;
 let allocation=game.assets.map(()=>0),values=[],round=0,started=false,predicted=false,benchmark=game.tokens*100;
 q('#game-rule').textContent='가상 토큰을 나누고 고정된 상황의 결과를 비교해요. 실제 수익 예측이 아니에요.';
 function draw(){
  const allocated=allocation.reduce((a,b)=>a+b,0),total=values.reduce((a,b)=>a+b,0),max=Math.max(total,benchmark,1);
  board.innerHTML='<p>'+esc(game.note)+'</p>'+(!predicted?'<p>한 곳에 모두 놓을 때와 나눠 놓을 때 변화가 같을까요?</p><div class="game-options"><button data-forecast="same">같을 것 같아요</button><button data-forecast="different">다를 것 같아요</button></div>':'')+(predicted?'<div class="game-meter">'+(started?'상황 '+round+' / '+game.rounds.length:'남은 토큰 '+(game.tokens-allocated))+'</div><div class="portfolio-assets">'+game.assets.map((name,i)=>'<div><strong>'+esc(name)+'</strong><span>'+allocation[i]+' 토큰'+(started?' · '+Math.round(values[i])+' 포인트':'')+'</span>'+(!started?'<div><button data-minus="'+i+'" aria-label="'+esc(name)+' 하나 빼기" '+(!allocation[i]?'disabled':'')+'>−</button><button data-plus="'+i+'" aria-label="'+esc(name)+' 하나 넣기" '+(allocated>=game.tokens?'disabled':'')+'>+</button></div>':'')+'</div>').join('')+'</div>'+(started?'<div class="result-row">내 배분 '+Math.round(total)+'<div class="result-bar" style="width:'+total/max*100+'%"></div></div><div class="result-row">전부 A '+Math.round(benchmark)+'<div class="result-bar" style="width:'+benchmark/max*100+'%"></div></div>':'')+'<button class="action" id="portfolio-next" '+((!started&&allocated!==game.tokens)||round===game.rounds.length?'disabled':'')+'>'+(started?'다음 상황 관찰':'배분하고 실험 시작')+'</button>'+(round===game.rounds.length?'<label for="portfolio-reflect">두 배분의 차이와 한계를 적어 볼까요?</label><textarea id="portfolio-reflect" maxlength="300"></textarea><button class="action" id="portfolio-finish">비교 마치기</button>':''):'');
  board.querySelectorAll('[data-forecast]').forEach(b=>b.onclick=()=>{predicted=true;tell('예상은 틀려도 괜찮아요. 결과를 관찰해요.');draw();});
  board.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>{allocation[+b.dataset.plus]++;draw();});
  board.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{allocation[+b.dataset.minus]--;draw();});
  if(!predicted)return;
  q('#portfolio-next').onclick=()=>{if(ctx.finished)return;if(!started){values=allocation.map(n=>n*100);started=true;draw();return;}const changes=game.rounds[round++];values=values.map((v,i)=>v*(1+changes[i]/10));benchmark*=1+changes[0]/10;draw();tell('모의 변화: '+game.assets.map((name,i)=>name+' '+changes[i]*10+'%').join(' · '));};
  if(q('#portfolio-finish'))q('#portfolio-finish').onclick=()=>{if(!q('#portfolio-reflect').value.trim()){tell('결과의 차이와 한계를 짧게 적어 주세요.');return;}finish({stars:3,text:(game.wrapUp||'분산해도 모든 자산이 함께 떨어질 수 있어요.')+' 내 배분 '+Math.round(total)+', 전부 A '+Math.round(benchmark)+' 포인트였어요. 이 결과는 미래 예측이 아니에요.'});};
 }
 draw();
});
