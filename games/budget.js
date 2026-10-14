MiniGames.register('budget',function(ctx){
 const {game,story,board,q,esc,shuffle,tell,finish}=ctx;

      q('#game-rule').textContent='예산 안에서 필요한 항목을 모두 고르세요. 남는 돈을 꼭 다 쓸 필요는 없어요. 단위는 '+(game.unit||'놀이 원')+'입니다.';
      const selected=new Set();
      board.innerHTML='<div class="budget-limit">예산 <strong>'+game.budget.toLocaleString()+'</strong></div><p>'+esc(game.mission||'학습에 필요한 준비물을 골라요.')+'</p><div class="budget-items">'+game.items.map((item,i)=>'<button data-item="'+i+'" aria-pressed="false"><span>'+esc(item[0])+'</span><b>'+item[1].toLocaleString()+'</b></button>').join('')+'</div><div id="budget-total"></div><button class="action" id="budget-check">내 계획 확인 ✓</button>';
      function total(){const used=[...selected].reduce((sum,i)=>sum+game.items[i][1],0);q('#budget-total').textContent='선택 합계 '+used.toLocaleString()+' · 남은 예산 '+(game.budget-used).toLocaleString();return used;}
      total();
      board.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{
        if(ctx.finished)return;const i=+b.dataset.item;if(selected.has(i))selected.delete(i);else selected.add(i);
        b.classList.toggle('picked',selected.has(i));b.setAttribute('aria-pressed',selected.has(i));total();
      });
      q('#budget-check').onclick=()=>{
        if(ctx.finished)return;
        const used=total(),names=[...selected].map(i=>game.items[i][0]);
        if(used>game.budget){tell('예산을 넘었어요. 필수 항목을 남기고 조정해 보세요.',true);return;}
        if(!game.need.every(name=>names.includes(name))){tell('필수 항목이 빠졌어요. 목적에 맞는 선택을 다시 살펴보세요.',true);return;}
        tell('필요한 항목을 모두 담고 예산도 지켰어요!');q('#budget-check').disabled=true;finish();
      };

});
