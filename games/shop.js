MiniGames.register('shop',function(ctx){
 const {game,board,q,esc,tell,finish}=ctx;let selected=new Set(),eventIndex=-1,budget=game.budget;
 const items=game.items.map(i=>({...i})),events=game.events||[];
 q('#game-rule').textContent=game.mission+' 단위: '+game.unit+'.';
 function draw(){
  board.innerHTML='<p class="budget-limit">예산 <strong>'+budget+'</strong> '+esc(game.unit)+'</p><div class="budget-items">'+items.map((item,i)=>'<button data-item="'+i+'" aria-pressed="'+selected.has(i)+'" class="'+(selected.has(i)?'picked':'')+'"><span>'+esc(item.icon||'◇')+' '+esc(item.name)+'</span><b>'+item.price+' '+esc(game.unit)+'</b><small>'+esc(item.description||'')+'</small></button>').join('')+'</div><p id="shop-total"></p><button class="action" id="shop-check">계획 확인</button><section id="shop-reflection" hidden><p id="shop-forgone"></p><label for="shop-reason">'+esc(game.reflect||'고른 것과 포기한 것의 까닭을 말해 볼까요?')+'</label><textarea id="shop-reason" maxlength="300"></textarea><button class="action" id="shop-finish">선택을 돌아봤어요</button></section>';
  const total=()=>[...selected].reduce((sum,i)=>sum+items[i].price,0);
  q('#shop-total').textContent='합계 '+total()+' · 남는 자원 '+(budget-total())+' '+game.unit;
  board.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{if(ctx.finished)return;const n=+b.dataset.item;if(selected.has(n))selected.delete(n);else selected.add(n);draw();});
  q('#shop-check').onclick=()=>{
   if(ctx.finished)return;
   if(!selected.size||total()>budget){tell('목적에 맞는 물건을 고르고 예산 안으로 조정해요.',true);return;}
   if(!game.requirements.every(req=>[...selected].some(i=>items[i].tag===req))){tell(game.hint||'필요한 쓰임이 빠졌어요. 미션과 물건의 설명을 다시 비교해요.',true);return;}
   if(eventIndex+1<events.length){const event=events[++eventIndex];budget+=event.budgetDelta||0;if(event.item!==undefined)items[event.item].price+=event.priceDelta||0;draw();tell('새 상황: '+event.text+' 계획을 다시 확인해요.');return;}
   q('#shop-reflection').hidden=false;q('#shop-forgone').textContent='남긴 돈: '+(budget-total())+' '+game.unit+' · 고르지 않은 것: '+items.filter((_,i)=>!selected.has(i)).map(i=>i.name).join(', ');tell('예산을 지켰어요. 이제 선택한 까닭을 돌아봐요.');
  };
  q('#shop-finish').onclick=()=>{if(!q('#shop-reason').value.trim()){tell('선택한 까닭을 짧게 적어 주세요.');return;}finish({text:game.wrapUp+' 남긴 자원은 '+(budget-total())+' '+game.unit+'예요.'});};
 }
 draw();
});
