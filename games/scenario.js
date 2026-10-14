MiniGames.register('scenario',function(ctx){
 const {game,board,q,esc,tell,finish}=ctx;let nodeId=game.start,path=[];
 q('#game-rule').textContent=game.mission+' 선택 뒤의 결과를 읽고 다음 행동을 정해요.';
 function draw(){
  const node=game.nodes[nodeId];board.innerHTML='<p class="scenario-story">'+esc(node.text)+'</p><ol class="scenario-path">'+path.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ol>'+(node.end?'<button class="action" id="scenario-finish">결과를 돌아봤어요</button>':'<div class="game-options">'+node.choices.map((c,i)=>'<button data-choice="'+i+'">'+esc(c.label)+'</button>').join('')+'</div>');
  if(node.end){q('#scenario-finish').onclick=()=>finish({text:game.wrapUp===node.text?node.text:game.wrapUp+' '+node.text});return;}
  board.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
   if(ctx.finished)return;const choice=node.choices[+b.dataset.choice];tell(choice.feedback,choice.retry===true);
   if(choice.retry)return;
   path.push(choice.label+' → '+choice.feedback);nodeId=choice.next;draw();
  });
 }
 draw();
});
