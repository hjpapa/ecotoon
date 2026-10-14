MiniGames.register('ledger',function(ctx){
 const {game,board,q,esc,tell,finish}=ctx;
 q('#game-rule').textContent=game.mission+' 놀이 돈으로 기록해요. 저축은 내 돈의 위치만 옮겨요.';
 let cash=game.start,savings=game.savings||0;
 const answers=game.rows.map(row=>{cash+=row.in-row.out-(row.save||0);savings+=row.save||0;return {cash,savings};});
 board.innerHTML='<p>처음 가진 돈: '+game.start+'원 · 저축: '+(game.savings||0)+'원</p><div class="ledger-rows">'+game.rows.map((row,i)=>'<fieldset><legend>'+esc(row.memo)+'</legend><p>들어옴 '+row.in+'원 · 소비 '+row.out+'원 · 저축으로 이동 '+(row.save||0)+'원</p><label for="ledger-'+i+'">남은 지갑 돈</label><input type="number" id="ledger-'+i+'" min="0" step="1" inputmode="numeric">'+(game.classify?'<label for="ledger-kind-'+i+'">돈의 흐름</label><select id="ledger-kind-'+i+'"><option value="">골라 주세요</option><option value="in">수입</option><option value="out">소비 지출</option><option value="save">저축 이동</option></select>':'')+'</fieldset>').join('')+'</div><button class="action" id="ledger-check">잔액 확인</button><section id="ledger-reflection" hidden><p id="ledger-total"></p><label for="ledger-next">다음 기록에서 잊지 않을 것은?</label><textarea id="ledger-next" maxlength="300"></textarea><button class="action" id="ledger-finish">기록을 돌아봤어요</button></section>';
 board.querySelectorAll('input,select').forEach(input=>input.addEventListener('input',()=>{q('#ledger-reflection').hidden=true;}));
 q('#ledger-check').onclick=()=>{
  if(ctx.finished)return;
  for(let i=0;i<answers.length;i++){
   if(q('#ledger-'+i).value===''||+q('#ledger-'+i).value!==answers[i].cash){tell((i+1)+'번째 줄: 앞줄 잔액에 들어온 돈을 더하고 소비·저축 이동을 빼요.',true);q('#ledger-'+i).focus();return;}
   if(game.classify&&q('#ledger-kind-'+i).value!==(game.rows[i].save?'save':game.rows[i].in?'in':'out')){tell('저축 이동은 소비와 달리 내 돈의 합계가 줄지 않아요.',true);return;}
  }
  q('#ledger-reflection').hidden=false;q('#ledger-total').textContent='지갑 '+cash+'원 + 저축 '+savings+'원 = 내가 가진 돈 '+(cash+savings)+'원';tell('모든 줄이 맞아요. 다음 기록을 계획해요.');
 };
 q('#ledger-finish').onclick=()=>{if(!q('#ledger-next').value.trim()){tell('다음에 실천할 기록 습관을 적어 주세요.');return;}finish({text:game.wrapUp+' 마지막 지갑 잔액은 '+cash+'원이에요.'});};
});
