MiniGames.register('match',function(ctx){
 const {game,story,board,q,esc,shuffle,tell,finish}=ctx;

      q('#game-rule').textContent = '왼쪽 카드와 관련된 오른쪽 카드를 하나씩 골라 짝을 연결하세요.';
      let left = null, right = null, matches = 0;
      const column = side => shuffle(game.pairs.map((pair, i) => ({text:pair[side], i}))).map(c => '<button data-side="' + side + '" data-pair="' + c.i + '" aria-pressed="false">' + esc(c.text) + '</button>').join('');
      board.innerHTML = '<div class="game-meter">0 / ' + game.pairs.length + ' 쌍</div><div class="match-columns"><div>' + column(0) + '</div><div>' + column(1) + '</div></div>';
      board.querySelectorAll('[data-pair]').forEach(button => button.onclick = () => {
        if (ctx.finished || button.disabled) return;
        const side = +button.dataset.side;
        board.querySelectorAll('[data-side="' + side + '"]').forEach(b => { b.classList.remove('picked'); b.setAttribute('aria-pressed','false'); });
        button.classList.add('picked'); button.setAttribute('aria-pressed','true');
        if (side === 0) left = button; else right = button;
        if (!left || !right) return;
        if (left.dataset.pair === right.dataset.pair) {
          [left, right].forEach(b => {b.disabled=true; b.classList.remove('picked');b.classList.add('matched');b.setAttribute('aria-pressed','false');});
          matches++; q('.game-meter').textContent = matches + ' / ' + game.pairs.length + ' 쌍'; tell('짝이 연결됐어요!');
          left = right = null; if (matches === game.pairs.length) finish();
        } else {
          tell('두 카드의 뜻을 다시 비교해 보세요.', true);
          [left, right].forEach(b=>{b.classList.remove('picked');b.setAttribute('aria-pressed','false');}); left=right=null;
        }
      });

});
