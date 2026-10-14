MiniGames.register('order',function(ctx){
 const {game,story,board,q,esc,shuffle,tell,finish}=ctx;

      q('#game-rule').textContent = '카드를 눌러 올바른 순서로 길을 이어요. 잘못 골라도 다시 고를 수 있어요.';
      let next = 0;
      const cards = shuffle(game.steps.map((text, i) => ({text, i})));
      board.innerHTML = '<div class="game-meter"></div><div class="order-path" aria-label="완성한 순서"></div><div class="game-options">' + cards.map(c => '<button data-step="' + c.i + '">' + esc(c.text) + '</button>').join('') + '</div>';
      const meter = () => q('.game-meter').textContent = next + ' / ' + game.steps.length + ' 단계';
      meter();
      board.querySelectorAll('[data-step]').forEach(button => button.onclick = () => {
        if (ctx.finished || button.disabled) return;
        if (+button.dataset.step !== next) { tell('이 단계 앞에 무엇이 필요할까요? 다른 카드를 골라 보세요.', true); return; }
        button.disabled = true;
        const step = document.createElement('span'); step.textContent = (next + 1) + '. ' + game.steps[next]; q('.order-path').append(step);
        next++; meter(); tell('좋아요! 다음 단계를 이어 볼까요?');
        if (next === game.steps.length) { tell('순서가 완성됐어요!'); finish(); }
      });

});
