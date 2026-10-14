MiniGames.register('coins',function(ctx){
 const {game,story,board,q,esc,shuffle,tell,finish}=ctx;

      q('#game-rule').textContent = '놀이 돈을 눌러 목표 금액을 만드세요. 넘쳤다면 하나 빼거나 다시 시작할 수 있어요.';
      let round=0, coins=[];
 const target=()=>game.mode==='change'?game.payments[round]-game.targets[round]:game.targets[round];
      function renderCoins() {
        const sum=coins.reduce((a,b)=>a+b,0);
        board.innerHTML=(game.mode==='change'?'<p>물건값 '+game.targets[round]+'원 · 낸 돈 '+game.payments[round]+'원. 거슬러 줄 돈을 만들어요.</p>':'')+'<div class="game-meter">미션 '+(round+1)+' / '+game.targets.length+'</div><div class="coin-target">목표 <strong>'+(game.mode==='change'?'거스름돈을 계산해요':target().toLocaleString()+'원')+'</strong></div><div class="coin-total">지금 '+sum.toLocaleString()+'원</div><div class="coin-tray" aria-label="선택한 놀이 돈">'+coins.map(c=>'<span>'+c+'원</span>').join('')+'</div><div class="coin-options">'+game.coins.map(c=>'<button data-coin="'+c+'">'+c.toLocaleString()+'원</button>').join('')+'</div><div class="game-controls"><button id="coin-undo" '+(!coins.length?'disabled':'')+'>하나 빼기</button><button id="coin-clear">비우기</button><button id="coin-check">금액 확인 ✓</button></div>';
        board.querySelectorAll('[data-coin]').forEach(b=>b.onclick=()=>{if(coins.length>=60){tell('많은 돈 조각이 쌓였어요. 더 큰 금액 조각도 활용해 보세요.',true);return;}coins.push(+b.dataset.coin);renderCoins();});
        q('#coin-undo').onclick=()=>{coins.pop();renderCoins();};
        q('#coin-clear').onclick=()=>{coins=[];renderCoins();};
        q('#coin-check').onclick=()=>{
          if(sum!==target()){tell(sum>target()?'목표보다 많아요. 필요한 만큼 빼 볼까요?':'목표까지 얼마가 더 필요할까요?',true);return;}
          round++;coins=[];tell('정확하게 만들었어요!');
          if(round===game.targets.length){board.innerHTML='<div class="coin-target">모든 목표 금액 완성 ✓</div>';finish();}else renderCoins();
        };
      }
      renderCoins();

});
