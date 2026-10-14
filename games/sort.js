MiniGames.register('sort',function(ctx){
 const {game,story,board,q,esc,shuffle,tell,finish}=ctx;

      q('#game-rule').textContent = '상황 카드를 읽고 알맞은 바구니를 눌러 분류하세요.';
      const cards = shuffle(game.cards);
      let index=0;
      function renderCard() {
        board.innerHTML = '<div class="game-meter">' + index + ' / ' + cards.length + ' 카드</div><div class="sort-card">' + esc(cards[index][0]) + '</div><div class="sort-bins">' + game.bins.map((bin,i)=>'<button data-bin="'+i+'"><span>▱</span>'+esc(bin)+'</button>').join('') + '</div>';
        board.querySelectorAll('[data-bin]').forEach(button=>button.onclick=()=>{
          if (ctx.finished) return;
          if (+button.dataset.bin !== cards[index][1]) { tell(cards[index][2]||'이 상황의 뜻을 다시 생각해 볼까요?',true); return; }
          index++; tell('알맞은 바구니에 넣었어요!');
          if(index===cards.length){board.innerHTML='<div class="sort-card">모든 카드를 분류했어요 ✓</div>';finish();}else renderCard();
        });
      }
      renderCard();

});
