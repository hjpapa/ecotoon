
(function () {
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle = list => {
    const result = list.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  function mount(root, story, onComplete) {
    const game = story.game;
    let errors = 0, finished = false;
    root.dataset.gameType = game.type;
    root.innerHTML = '<div class="game-heading"><span>PLAY · 배움을 써 보는 시간</span><h3>' + esc(game.title) + '</h3></div><p id="game-rule"></p><div id="game-board"></div><p id="game-feedback" role="status" aria-live="polite"></p><div id="game-reward"></div>';
    const q = selector => root.querySelector(selector);
    const board = q('#game-board');
    const tell = (message, bad) => {
      q('#game-feedback').textContent = message;
      q('#game-feedback').className = bad ? 'game-feedback incorrect' : 'game-feedback';
      if (bad) errors++;
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      const stars = errors === 0 ? 3 : errors <= 2 ? 2 : 1;
      const saved = onComplete(stars);
      q('#game-reward').innerHTML = '<div class="game-victory"><span class="stars">' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</span><h4>배움 미션 완료!</h4><p>틀린 뒤 다시 해 보는 것도 멋진 배움이에요.</p><p>' + esc(story.lesson) + '</p><small>' + (saved ? '게임 완료 기록을 이 브라우저에 저장했어요.' : '이번 화면에는 기록됐지만 브라우저 저장 공간을 사용할 수 없어요.') + '</small><button class="action game-replay">다시 도전하기 ↻</button></div>';
      q('.game-replay').onclick = () => mount(root, story, onComplete);
    };
    if (game.type === 'order') {
      q('#game-rule').textContent = '카드를 눌러 올바른 순서로 길을 이어요. 잘못 골라도 다시 고를 수 있어요.';
      let next = 0;
      const cards = shuffle(game.steps.map((text, i) => ({text, i})));
      board.innerHTML = '<div class="game-meter"></div><div class="order-path" aria-label="완성한 순서"></div><div class="game-options">' + cards.map(c => '<button data-step="' + c.i + '">' + esc(c.text) + '</button>').join('') + '</div>';
      const meter = () => q('.game-meter').textContent = next + ' / ' + game.steps.length + ' 단계';
      meter();
      board.querySelectorAll('[data-step]').forEach(button => button.onclick = () => {
        if (finished || button.disabled) return;
        if (+button.dataset.step !== next) { tell('이 단계 앞에 무엇이 필요할까요? 다른 카드를 골라 보세요.', true); return; }
        button.disabled = true;
        const step = document.createElement('span'); step.textContent = (next + 1) + '. ' + game.steps[next]; q('.order-path').append(step);
        next++; meter(); tell('좋아요! 다음 단계를 이어 볼까요?');
        if (next === game.steps.length) { tell('순서가 완성됐어요!'); finish(); }
      });
    } else if (game.type === 'match') {
      q('#game-rule').textContent = '왼쪽 카드와 관련된 오른쪽 카드를 하나씩 골라 짝을 연결하세요.';
      let left = null, right = null, matches = 0;
      const column = side => shuffle(game.pairs.map((pair, i) => ({text:pair[side], i}))).map(c => '<button data-side="' + side + '" data-pair="' + c.i + '" aria-pressed="false">' + esc(c.text) + '</button>').join('');
      board.innerHTML = '<div class="game-meter">0 / ' + game.pairs.length + ' 쌍</div><div class="match-columns"><div>' + column(0) + '</div><div>' + column(1) + '</div></div>';
      board.querySelectorAll('[data-pair]').forEach(button => button.onclick = () => {
        if (finished || button.disabled) return;
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
    } else if (game.type === 'sort') {
      q('#game-rule').textContent = '상황 카드를 읽고 알맞은 바구니를 눌러 분류하세요.';
      const cards = shuffle(game.cards);
      let index=0;
      function renderCard() {
        board.innerHTML = '<div class="game-meter">' + index + ' / ' + cards.length + ' 카드</div><div class="sort-card">' + esc(cards[index][0]) + '</div><div class="sort-bins">' + game.bins.map((bin,i)=>'<button data-bin="'+i+'"><span>▱</span>'+esc(bin)+'</button>').join('') + '</div>';
        board.querySelectorAll('[data-bin]').forEach(button=>button.onclick=()=>{
          if (finished) return;
          if (+button.dataset.bin !== cards[index][1]) { tell('이 상황의 뜻을 다시 생각해 볼까요?',true); return; }
          index++; tell('알맞은 바구니에 넣었어요!');
          if(index===cards.length){board.innerHTML='<div class="sort-card">모든 카드를 분류했어요 ✓</div>';finish();}else renderCard();
        });
      }
      renderCard();
    } else if (game.type === 'coins') {
      q('#game-rule').textContent = '놀이 돈을 눌러 목표 금액을 만드세요. 넘쳤다면 하나 빼거나 다시 시작할 수 있어요.';
      let round=0, coins=[];
      function renderCoins() {
        const sum=coins.reduce((a,b)=>a+b,0);
        board.innerHTML='<div class="game-meter">미션 '+(round+1)+' / '+game.targets.length+'</div><div class="coin-target">목표 <strong>'+game.targets[round].toLocaleString()+'원</strong></div><div class="coin-total">지금 '+sum.toLocaleString()+'원</div><div class="coin-tray" aria-label="선택한 놀이 돈">'+coins.map(c=>'<span>'+c+'원</span>').join('')+'</div><div class="coin-options">'+game.coins.map(c=>'<button data-coin="'+c+'">'+c.toLocaleString()+'원</button>').join('')+'</div><div class="game-controls"><button id="coin-undo" '+(!coins.length?'disabled':'')+'>하나 빼기</button><button id="coin-clear">비우기</button><button id="coin-check">금액 확인 ✓</button></div>';
        board.querySelectorAll('[data-coin]').forEach(b=>b.onclick=()=>{if(coins.length>=60){tell('많은 돈 조각이 쌓였어요. 더 큰 금액 조각도 활용해 보세요.',true);return;}coins.push(+b.dataset.coin);renderCoins();});
        q('#coin-undo').onclick=()=>{coins.pop();renderCoins();};
        q('#coin-clear').onclick=()=>{coins=[];renderCoins();};
        q('#coin-check').onclick=()=>{
          if(sum!==game.targets[round]){tell(sum>game.targets[round]?'목표보다 많아요. 필요한 만큼 빼 볼까요?':'목표까지 얼마가 더 필요할까요?',true);return;}
          round++;coins=[];tell('정확하게 만들었어요!');
          if(round===game.targets.length){board.innerHTML='<div class="coin-target">모든 목표 금액 완성 ✓</div>';finish();}else renderCoins();
        };
      }
      renderCoins();
    } else if(game.type==='budget') {
      q('#game-rule').textContent='예산 안에서 필요한 항목을 모두 고르세요. 남는 돈을 꼭 다 쓸 필요는 없어요. 단위는 '+(story.grade===3&&story.number===1?'재료 조각':'놀이 원')+'입니다.';
      const selected=new Set();
      board.innerHTML='<div class="budget-limit">예산 <strong>'+game.budget.toLocaleString()+'</strong></div><p>필수 항목: '+game.need.map(esc).join(' · ')+'</p><div class="budget-items">'+game.items.map((item,i)=>'<button data-item="'+i+'" aria-pressed="false"><span>'+esc(item[0])+'</span><b>'+item[1].toLocaleString()+'</b></button>').join('')+'</div><div id="budget-total"></div><button class="action" id="budget-check">내 계획 확인 ✓</button>';
      function total(){const used=[...selected].reduce((sum,i)=>sum+game.items[i][1],0);q('#budget-total').textContent='선택 합계 '+used.toLocaleString()+' · 남은 예산 '+(game.budget-used).toLocaleString();return used;}
      total();
      board.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{
        if(finished)return;const i=+b.dataset.item;if(selected.has(i))selected.delete(i);else selected.add(i);
        b.classList.toggle('picked',selected.has(i));b.setAttribute('aria-pressed',selected.has(i));total();
      });
      q('#budget-check').onclick=()=>{
        if(finished)return;
        const used=total(),names=[...selected].map(i=>game.items[i][0]);
        if(used>game.budget){tell('예산을 넘었어요. 필수 항목을 남기고 조정해 보세요.',true);return;}
        if(!game.need.every(name=>names.includes(name))){tell('필수 항목이 빠졌어요. 목적에 맞는 선택을 다시 살펴보세요.',true);return;}
        tell('필요한 항목을 모두 담고 예산도 지켰어요!');q('#budget-check').disabled=true;finish();
      };
    } else if(game.type==='portfolio') {
      q('#game-rule').textContent='가상 토큰 '+game.tokens+'개를 나누고 세 가지 고정 상황의 결과를 관찰하세요. 수익 경쟁이 아니라 위험을 알아보는 실험이에요.';
      let allocation=[0,0,0],values=[0,0,0],round=0,started=false,benchmark=game.tokens*100;
      function renderPortfolio(){
        const allocated=allocation.reduce((a,b)=>a+b,0),total=values.reduce((a,b)=>a+b,0);
        board.innerHTML='<p>'+esc(game.note)+'</p><div class="game-meter">'+(started?'상황 '+round+' / '+game.rounds.length:'남은 토큰 '+(game.tokens-allocated))+'</div><div class="portfolio-assets">'+game.assets.map((name,i)=>'<div><strong>'+esc(name)+'</strong><span>'+allocation[i]+' 토큰'+(started?' · '+Math.round(values[i])+' 학습 포인트':'')+'</span>'+(!started?'<div><button data-minus="'+i+'" aria-label="'+esc(name)+' 토큰 하나 빼기" '+(!allocation[i]?'disabled':'')+'>−</button><button data-plus="'+i+'" aria-label="'+esc(name)+' 토큰 하나 넣기" '+(allocated>=game.tokens?'disabled':'')+'>+</button></div>':'')+'</div>').join('')+'</div>'+(started?'<p>내 배분 총값: '+Math.round(total)+' 포인트 · 전부 A에 넣은 비교값: '+Math.round(benchmark)+' 포인트</p>':'')+'<button class="action" id="portfolio-next" '+(!started&&allocated!==game.tokens?'disabled':'')+'>'+(started?'다음 상황 관찰':'배분하고 실험 시작')+'</button>';
        board.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>{allocation[+b.dataset.plus]++;renderPortfolio();});
        board.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{allocation[+b.dataset.minus]--;renderPortfolio();});
        q('#portfolio-next').onclick=()=>{
          if(finished)return;
          if(!started){values=allocation.map(n=>n*100);started=true;renderPortfolio();tell('첫값은 모두 '+game.tokens*100+' 포인트예요. 다음 상황을 관찰하세요.');return;}
          const changes=game.rounds[round];values=values.map((v,i)=>v*(1+changes[i]/10));benchmark*=1+changes[0]/10;round++;renderPortfolio();
          tell('이번 모의 변화: '+game.assets.map((name,i)=>name+' '+(changes[i]>0?'+':'')+changes[i]*10+'%').join(' · '));
          if(round===game.rounds.length){q('#portfolio-next').disabled=true;tell('마지막 상황에서는 모든 자산이 내려갔어요. 분산해도 손실이 날 수 있고 이번 결과는 미래를 예측하지 않아요.');finish();}
        };
      }
      renderPortfolio();
    } else {
      q('#game-rule').textContent='아직 연결되지 않은 미션이에요. 이야기 목록으로 돌아가 주세요.';
    }
  }
  window.MiniGames={mount};
})();
