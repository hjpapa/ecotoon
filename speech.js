(function(){
 function attach(reader){
  const noop={stop(){},stopOutside(){},destroy(){}};let synth;
  try{synth=window.speechSynthesis;if(!synth||typeof synth.getVoices!=='function'||typeof synth.speak!=='function'||typeof synth.cancel!=='function'||typeof window.SpeechSynthesisUtterance!=='function')return noop;}catch{return noop;}
  const lifetime=new AbortController(),signal=lifetime.signal,buttons=[];
  let voice=null,current=null,destroyed=false;
  function reset(button){button.textContent='▶ 읽기';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',button.dataset.readLabel);}
  function stop(){
   if(!current)return;
   const old=current;current=null;old.utterance.onend=null;old.utterance.onerror=null;reset(old.button);
   try{synth.cancel();}catch{/* A device can lose its speech service mid-reading. */}
  }
  function refresh(){
   if(destroyed)return;
   try{voice=synth.getVoices().filter(v=>/^ko(?:[-_]|$)/i.test(v.lang)&&v.localService===true).sort((a,b)=>Number(b.default)-Number(a.default))[0]||null;}catch{voice=null;}
   if(!voice)stop();
   buttons.forEach(button=>button.hidden=!voice);
  }
  reader.querySelectorAll('.integrated-speech').forEach(bubble=>{
   const button=document.createElement('button'),speaker=bubble.querySelector('b').textContent.trim();
   button.type='button';button.className='speech-read';button.hidden=true;button.dataset.readLabel=speaker+' 대사 읽어 주기';reset(button);
   const status=document.createElement('span');status.className='sr-only';status.setAttribute('role','status');
   bubble.append(button,status);buttons.push(button);
   button.addEventListener('click',()=>{
    if(current?.button===button){stop();return;}
    stop();refresh();if(!voice||!reader.open||bubble.closest('[hidden]')||bubble.classList.contains('speech-pending'))return;
    try{
     const utterance=new SpeechSynthesisUtterance(bubble.querySelector('p').textContent);
     utterance.lang='ko-KR';utterance.voice=voice;utterance.rate=.9;
     current={button,utterance};status.textContent='';button.textContent='■ 멈추기';button.setAttribute('aria-pressed','true');button.setAttribute('aria-label',speaker+' 읽어 주기 멈추기');
     utterance.onend=()=>{if(current?.utterance===utterance){current=null;reset(button);}};
     utterance.onerror=event=>{if(current?.utterance!==utterance)return;current=null;reset(button);if(!['canceled','interrupted'].includes(event.error))status.textContent='지금은 읽어 주기를 사용할 수 없어요.';};
     synth.speak(utterance);
    }catch{stop();status.textContent='지금은 읽어 주기를 사용할 수 없어요.';}
   },{signal});
  });
  if(typeof synth.addEventListener==='function')synth.addEventListener('voiceschanged',refresh,{signal});
  reader.addEventListener('readinginterrupt',stop,{signal});reader.addEventListener('close',stop,{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()},{signal});window.addEventListener('pagehide',stop,{signal});
  refresh();
  return{stop,stopOutside(panel){if(current&&!panel.contains(current.button))stop()},destroy(){destroyed=true;stop();lifetime.abort();buttons.forEach(b=>{b.nextElementSibling?.remove();b.remove()})}};
 }
 window.EcoSpeech={attach};
})();
