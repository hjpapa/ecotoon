(function(){
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const complete=p=>p?.read===true&&p?.quiz===true&&p?.gameDone===true;
 const areaKey=area=>({'경제':'economy','노동':'labor','금융':'finance'}[area]);
 function summarize(stories,records){
  return [1,2,3,4,5,6].map(grade=>{
   const group=stories.filter(s=>s.grade===grade).sort((a,b)=>a.number-b.number),done=group.filter(s=>complete(records[s.id]));
   return{grade,total:group.length,completed:done.length,earned:group.length===15&&done.length===15,
    domains:['경제','노동','금융'].map(area=>({area,count:done.filter(s=>s.area===area).length,earned:group.filter(s=>s.area===area).length===5&&done.filter(s=>s.area===area).length===5})),
    stamps:group.map(s=>({id:s.id,number:s.number,title:s.subtitle,area:s.area,done:complete(records[s.id])}))};
  });
 }
 function emblem(earned){return '<svg class="reward-emblem" viewBox="0 0 64 72" aria-hidden="true" focusable="false"><path d="M17 42 12 68 32 58 52 68 47 42" fill="currentColor" opacity=".2"/><circle cx="32" cy="29" r="25" fill="none" stroke="currentColor" stroke-width="3"/><path d="m32 12 5 11 12 1-9 9 3 12-11-6-11 6 3-12-9-9 12-1Z" fill="'+(earned?'currentColor':'none')+'" stroke="currentColor" stroke-width="2"/></svg>';}
 function render(stories,records,onlyGrade){
  return '<section class="reward-board" aria-label="나의 학년별 스탬프판"><h2>차곡차곡 배움 스탬프</h2><p>읽기·퀴즈·활동·게임을 마치면 한 칸을 찍어요. 영역별 다섯 칸과 학년별 열다섯 칸을 모아 배지를 받아요.</p>'+summarize(stories,records).filter(g=>!onlyGrade||g.grade===onlyGrade).map(g=>'<section class="grade-stamps" data-stamp-grade="'+g.grade+'"><div class="stamp-heading"><h3>'+g.grade+'학년 · '+g.completed+' / '+g.total+'편</h3><span class="grade-badge" data-earned="'+g.earned+'">'+emblem(g.earned)+(g.earned?'학년 완주 배지':'완주 배지까지 '+(g.total-g.completed)+'편')+'</span></div><div class="domain-badges">'+g.domains.map(d=>'<span class="domain-badge '+areaKey(d.area)+'" data-earned="'+d.earned+'">'+(d.earned?'★ ':'')+d.area+' '+d.count+'/5'+(d.earned?' · 배지 획득':'')+'</span>').join('')+'</div><ol class="stamp-grid">'+g.stamps.map(s=>'<li><button type="button" class="stamp '+areaKey(s.area)+'" data-stamp="'+s.id+'" data-complete="'+s.done+'" aria-label="'+s.number+'편 '+esc(s.title)+' · '+s.area+' · '+(s.done?'완료':'미완료')+'"><span aria-hidden="true">'+(s.done?'✓':s.number)+'</span><small>'+s.area+'</small></button></li>').join('')+'</ol></section>').join('')+'</section>';
 }
 window.EcoRewards={complete,summarize,render};
})();
