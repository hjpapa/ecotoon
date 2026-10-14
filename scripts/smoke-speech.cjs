async page=>{
 const origin=new URL(page.url()).origin;if(!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))throw Error('Use localhost');
 const check=(ok,msg)=>{if(!ok)throw Error(msg)},passed=[],errors=[];
 const make=async(kind,width=390)=>{
  const context=await page.context().browser().newContext({viewport:{width,height:900}});
  await context.addInitScript(kind=>{
   window.speechLog=[];window.voiceList=[];
   if(kind==='missing'){Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});return;}
   const synth=new EventTarget();synth.getVoices=()=>{if(kind==='broken')throw Error('unavailable');return window.voiceList};
   synth.cancel=()=>window.speechLog.push({action:'cancel'});
   synth.speak=u=>{window.lastUtterance=u;window.speechLog.push({action:'speak',text:u.text,lang:u.lang,rate:u.rate,local:u.voice.localService});};
   Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
   Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text}},configurable:true});
  },kind);
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+'/#/g1-01');return{context,p};
 };
 for(const kind of ['missing','broken','empty']){const{context,p}=await make(kind);check(await p.locator('.speech-read:visible').count()===0,kind+' hides speech');await p.locator('#nextScene').click();check(await p.locator('#sceneProgress').getAttribute('value')==='2',kind+' still reads');await context.close();passed.push(kind);}
 for(const width of [360,390,768,1280]){
  const{context,p}=await make('delayed',width);
  await p.evaluate(()=>{voiceList=[{lang:'en-US',localService:true},{lang:'ko-KR',localService:false}];speechSynthesis.dispatchEvent(new Event('voiceschanged'))});check(await p.locator('.speech-read:visible').count()===0,'Foreign/remote voices hidden');
  await p.evaluate(()=>{voiceList=[{lang:'ko-KR',localService:true,default:true}];speechSynthesis.dispatchEvent(new Event('voiceschanged'))});
  const first=()=>p.locator('.integrated-panel:visible .speech-read').first();
  check(await first().isVisible(),'Async Korean voice');await first().click();
  check(await first().getAttribute('aria-pressed')==='true','Playing state');
  const utterance=await p.evaluate(()=>speechLog.find(e=>e.action==='speak'));check(utterance.lang==='ko-KR'&&utterance.local&&utterance.text.includes('놀이 돈'),'Only dialogue is spoken in local Korean');
  await p.locator('.integrated-panel:visible .speech-read').nth(1).click();check(await first().getAttribute('aria-pressed')==='false','Previous voice reset');
  const cancel=()=>p.evaluate(()=>speechLog.filter(e=>e.action==='cancel').length);
  let count=await cancel();await p.locator('#nextScene').click();check(await cancel()>count,'Scene cancels');
  await first().click();count=await cancel();await p.locator('#readingMode').click();check(await cancel()>count,'Mode cancels');
  await p.locator('#panel-0 .speech-read').first().click();count=await cancel();await p.locator('[data-stage="summary"]').click();check(await cancel()>count,'Stage cancels');
  await p.locator('[data-stage="comic"]').click();await p.locator('#sceneMenu').click();await p.locator('[data-jump="7"]').click();
  await p.locator('#panel-7 .speech-read').last().click();const text=await p.locator('#panel-7 .integrated-speech p').last().textContent();check(await p.evaluate(()=>lastUtterance.text)===text,'Term buttons do not add labels to spoken text');count=await cancel();
  await p.locator('#panel-7 [data-term]').first().click();check(await cancel()>count,'Glossary cancels');await p.keyboard.press('Escape');
  await p.locator('#panel-7 .speech-read').last().click();await p.evaluate(()=>lastUtterance.onend());check(await p.locator('#panel-7 .speech-read').last().getAttribute('aria-pressed')==='false','End resets');
  await p.locator('#panel-7 .speech-read').last().click();await p.evaluate(()=>lastUtterance.onerror({error:'synthesis-failed'}));check((await p.locator('#panel-7 .integrated-speech').last().innerText()).includes('사용할 수 없어요'),'Engine error feedback');
  await p.locator('#panel-7 .speech-read').last().click();count=await cancel();await p.evaluate(()=>{voiceList=[];speechSynthesis.dispatchEvent(new Event('voiceschanged'))});check(await cancel()>count&&await p.locator('.speech-read:visible').count()===0,'Voice removed');
  await p.evaluate(()=>{voiceList=[{lang:'ko-KR',localService:true}];speechSynthesis.dispatchEvent(new Event('voiceschanged'))});await p.locator('#panel-7 .speech-read').last().click();count=await cancel();await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));check(await cancel()>count,'Page exit cancels');
  await p.locator('#panel-7 .speech-read').last().click();count=await cancel();await p.locator('#reader .close').click();check(await cancel()>count,'Close cancels');
  await p.goto(origin+'/#/g1-03');check(await p.locator('.speech-read').count()===await p.locator('.integrated-speech').count(),'No stale or duplicate buttons');
  const sizes=await p.locator('.speech-read:visible').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44}));check(sizes,'Speech touch targets');
  await p.screenshot({path:'output/playwright/wp10/speech-'+width+'.png'});await context.close();passed.push(width+'px speech lifecycle');
 }
 const{context,p}=await make('delayed',1920);await p.setViewportSize({width:1920,height:1080});await p.evaluate(()=>{voiceList=[{lang:'ko-KR',localService:true}];speechSynthesis.dispatchEvent(new Event('voiceschanged'))});await p.locator('#boardMode').click();await p.locator('#sceneMenu').click();await p.locator('[data-jump="3"]').click();
 check(await p.locator('#panel-3 .speech-read:visible').count()===0,'Board pending voice buttons hidden');await p.keyboard.press('PageDown');await p.locator('#panel-3 .speech-read:visible').first().click();const before=await p.evaluate(()=>speechLog.length);await p.keyboard.press('PageDown');check(await p.evaluate(()=>speechLog.length)>before,'Board reveal cancels voice');await p.keyboard.press('PageDown');check(await p.locator('#panel-3 .speech-read:visible').count()===3,'Three board voices');
 await p.screenshot({path:'output/playwright/wp10/board-speech.png'});check(await p.locator('#reader').evaluate(el=>el.scrollWidth===el.clientWidth&&el.scrollHeight===el.clientHeight),'Board fits viewport');await context.close();passed.push('1920px board voice lifecycle');
 check(!errors.length,errors.join(','));return{passed,errors};
}
