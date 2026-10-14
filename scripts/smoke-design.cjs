// Run with Playwright CLI against an isolated localhost session (resets its records).
async (page) => {
 const origin=new URL(page.url()).origin;
 if(!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin))throw Error('Use localhost');
 const check=(ok,message)=>{if(!ok)throw Error(message)};
 const external=[],errors=[],results=[];
 page.on('request',r=>{if(new URL(r.url()).origin!==origin)external.push(r.url())});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin);
 await page.evaluate(()=>localStorage.clear());
 const audit=async label=>{
  await page.evaluate(()=>document.fonts.ready);
  const problems=await page.evaluate(()=>{
   const failures=[];
   const rgba=s=>{const m=s.match(/[\d.]+/g);return m?[+m[0],+m[1],+m[2],m[3]===undefined?1:+m[3]]:[0,0,0,0]};
   const blend=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3])).concat(1);
   const bg=el=>{const c=rgba(getComputedStyle(el).backgroundColor);return c[3]===1?c:blend(c,el.parentElement?bg(el.parentElement):[255,255,255,1])};
   const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
   const dialog=document.querySelector('dialog[open]');
   for(const el of (dialog||document.body).querySelectorAll('*')){
    if(!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})||el.closest('.sr-only,[aria-hidden="true"],svg,script,style'))continue;
    const text=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join('');
    const css=getComputedStyle(el),r=el.getBoundingClientRect();
    if(text){
     if(parseFloat(css.fontSize)<12)failures.push('font '+el.className+' '+css.fontSize);
     const back=bg(el),fore=blend(rgba(css.color),back),l1=lum(fore),l2=lum(back),ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
     if(ratio<4.5)failures.push('contrast '+el.tagName+'.'+el.className+' '+ratio.toFixed(2)+' '+text.slice(0,25));
    }
    if(el.matches('button,a[href],input:not([type=hidden]),textarea')&&!el.closest('.skip-link')&&(r.width<43.9||r.height<43.9))failures.push('target '+el.id+' '+el.className+' '+r.width+'x'+r.height);
   }
   if(document.documentElement.scrollWidth>innerWidth)failures.push('page overflow');
   if(dialog&&dialog.scrollWidth>dialog.clientWidth+1)failures.push('dialog overflow');
   return [...new Set(failures)];
  });
  check(!problems.length,label+': '+problems.join('; '));
  results.push(label);
 };
 for(const width of [360,390,768,1280]){
  await page.setViewportSize({width,height:900});await page.goto(origin);
  await audit(width+' library');
  check(await page.locator('article.card').count()===90,'90 articles');
  check(await page.locator('article.card a').count()===90,'One link per card');
  await page.locator('#library h2').scrollIntoViewIfNeeded();
  await page.locator('.card img').first().evaluate(img=>img.decode());
  await page.screenshot({path:'output/playwright/wp4/library-'+width+'.png'});
  await page.locator('[data-story="g1-01"]').focus();await page.keyboard.press('Enter');
  await page.locator('#reader').waitFor({state:'visible'});await audit(width+' grade1 reader');
  await page.screenshot({path:'output/playwright/wp4/reader-'+width+'.png'});
  for(const key of ['summary','quiz','activity','game']){
   await page.locator('[data-stage="'+key+'"]').click();await audit(width+' '+key);
  }
  await page.locator('#reader .close').click();await page.locator('#reader').waitFor({state:'hidden'});
  check(await page.locator('[data-story="g1-01"]').evaluate(el=>el===document.activeElement),'Restore card focus');
  await page.locator('#activityNav').click();await audit(width+' activity dialog');await page.locator('#info .close').click();
  // Teacher entry is hidden on small screens until WP5; inspect its dialog at every width.
  await page.evaluate(()=>document.querySelector('#guideNav').click());await audit(width+' teacher dialog');await page.locator('#info .close').click();
  const games=await page.evaluate(()=>[...new Set(STORIES.map(s=>s.game.type))].map(type=>STORIES.find(s=>s.game.type===type).id));
  for(const id of games){
   await page.evaluate(id=>localStorage.setItem('ecotoon-progress-v3',JSON.stringify({[id]:{read:true}})),id);
   await page.goto(origin+'/#/'+id+'/game');await page.reload();
   await page.locator('#startGame').click();await audit(width+' game '+id);
   await page.locator('[data-stage="quiz"]').click();
   const answer=await page.evaluate(id=>STORIES.find(s=>s.id===id).quiz.answer,id);
   await page.locator('[data-answer="'+((answer+1)%3)+'"]').click();await audit(width+' wrong '+id);
   await page.locator('[data-answer="'+answer+'"]').click();await audit(width+' correct '+id);
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(origin);
 check(await page.locator('html').evaluate(el=>getComputedStyle(el).scrollBehavior)==='auto','Reduced motion');
 check(await page.locator('.card').first().evaluate(el=>getComputedStyle(el).transitionDuration)==='0s','No card motion');
 const fonts=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.woff2')).map(e=>e.name));
 check(fonts.length===2,'Two locally loaded weights');
 check(external.length===0,'External requests: '+external.join(', '));check(errors.length===0,errors.join('; '));
 return {passed:results,externalRequests:external.length,fonts:fonts.length,errors};
}
