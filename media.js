(function(){
 const avatar=(grade,person)=>'<img class="speaker-avatar" src="assets/ui/'+person+'-'+grade+'.webp" width="40" height="40" alt="" loading="lazy" decoding="async">';
 const reaction=(grade,state)=>'<div class="character-reaction" data-reaction="'+state+'">'+avatar(grade,'jiwoo')+avatar(grade,'harin')+'<span>'+({celebrate:'우리가 해냈어!',think:'까닭을 함께 생각해 보자.',cheer:'한 번 더 해 볼까?',correct:'알아냈구나!'}[state]||'함께 해 보자!')+'</span></div>';
 const mascot=()=>'<img class="mascot-avatar" src="assets/ui/moa.webp" width="48" height="48" alt="경제 탐험 안내자 모아" loading="lazy" decoding="async">';
 const money=value=>'<svg class="play-money" viewBox="0 0 100 72" aria-hidden="true" focusable="false"><rect x="3" y="3" width="94" height="66" rx="'+(value<1000?32:8)+'" fill="#fff4c4" stroke="#77501b" stroke-width="3"/><path d="M12 36h9m58 0h9" stroke="#77501b" stroke-width="3"/><text x="50" y="30" text-anchor="middle" fill="#493316" font-size="13">놀이 돈</text><text x="50" y="52" text-anchor="middle" fill="#493316" font-size="18" font-weight="700">'+value.toLocaleString()+'</text></svg>';
 window.EcoMedia={avatar,reaction,mascot,money};
})();
