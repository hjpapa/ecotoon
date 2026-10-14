MiniGames.register('simulate',function(ctx){
 const {game,board,q,esc,tell,finish}=ctx;
 let prediction=null,runs=[],values={...game.fixed};game.params.forEach(p=>values[p.key]=p.value??p.min);
 q('#game-rule').textContent=game.mission+' 예상은 틀려도 괜찮아요. 값을 바꿔 두 번 실험하고 결과를 비교해요.';
 board.innerHTML='<section><h4>1. 예상하기</h4><p>'+esc(game.predict.question)+'</p><div class="game-options">'+game.predict.options.map((v,i)=>'<button data-predict="'+i+'" aria-pressed="false">'+esc(v)+'</button>').join('')+'</div></section><section id="experiment" hidden><h4>2. 해 보기</h4>'+game.params.map(p=>'<label class="sim-control" for="param-'+p.key+'">'+esc(p.label)+' <output id="value-'+p.key+'">'+values[p.key]+'</output> '+esc(p.unit)+'<input type="range" id="param-'+p.key+'" data-param="'+p.key+'" min="'+p.min+'" max="'+p.max+'" step="'+p.step+'" value="'+values[p.key]+'"></label>').join('')+'<button class="action" id="simulate-run">이 값으로 실험</button><div id="sim-results" aria-live="polite"></div></section><section id="compare" hidden><h4>3. 비교하기</h4><p>'+esc(game.goal.text)+'</p><label for="sim-reflect">어떤 값을 바꾸자 결과가 어떻게 달라졌나요?</label><textarea id="sim-reflect" maxlength="300"></textarea><button class="action" id="sim-finish">비교를 마쳤어요</button></section>';
 board.querySelectorAll('[data-predict]').forEach(b=>b.onclick=()=>{if(ctx.finished||runs.length)return;prediction=+b.dataset.predict;board.querySelectorAll('[data-predict]').forEach(x=>x.setAttribute('aria-pressed',x===b));q('#experiment').hidden=false;tell('예상을 골랐어요. 이제 직접 확인해요.');});
 board.querySelectorAll('[data-param]').forEach(input=>input.oninput=()=>{values[input.dataset.param]=+input.value;q('#value-'+input.dataset.param).textContent=input.value;});
 q('#simulate-run').onclick=()=>{
  if(ctx.finished||prediction===null)return;
  const snapshot=JSON.stringify(values);if(runs.some(r=>r.snapshot===snapshot)){tell('한 가지 값을 바꿔 다시 실험해 보세요.');return;}
  const result=EcoModels.calculate(game.model,values);runs.push({snapshot,result});
  const recent=runs.slice(-4),max=Math.max(...recent.map(r=>r.result.value),1);
  q('#sim-results').innerHTML=recent.map((r,i)=>'<div class="result-row"><strong>실험 '+(runs.length-recent.length+i+1)+' · '+esc(r.result.label)+': '+Math.round(r.result.value).toLocaleString()+esc(r.result.unit)+'</strong><div class="result-bar" style="width:'+Math.max(2,r.result.value/max*100)+'%"></div><p>'+esc(r.result.detail)+'</p></div>').join('');
  q('#compare').hidden=runs.length<2;tell(runs.length<2?'다른 값으로 한 번 더 실험해요.':'내 예상: '+game.predict.options[prediction]+'. 두 결과를 비교해 보세요.');
 };
 q('#sim-finish').onclick=()=>{if(runs.length<2||ctx.finished)return;if(!q('#sim-reflect').value.trim()){tell('달라진 점을 한 줄로 적어 주세요. 어른과 말로 나눈 뒤 함께 적어도 좋아요.');return;}finish({stars:3,text:game.wrapUp+' 처음 결과 '+Math.round(runs[0].result.value)+', 마지막 결과 '+Math.round(runs.at(-1).result.value)+'. 예상·실험·설명을 모두 마쳤어요.'});};
});
