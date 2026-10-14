async page=>{
 const origin=new URL(page.url()).origin;if(!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))throw Error('Use localhost');
 const check=(ok,msg)=>{if(!ok)throw Error(msg)},results=[];
 for(const width of [360,390,768,1280]){
  const context=await page.context().browser().newContext({viewport:{width,height:900}}),p=await context.newPage();
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin);await p.evaluate(()=>document.fonts.ready);await p.waitForLoadState('networkidle');
  const first=await p.evaluate(()=>performance.getEntriesByType('resource').reduce((sum,r)=>sum+r.encodedBodySize,performance.getEntriesByType('navigation')[0].encodedBodySize));
  check(first<=1.5e6,width+' first page '+first);
  for(let i=0;i<90;i+=6){await p.locator('.card').nth(i).scrollIntoViewIfNeeded();await p.waitForLoadState('networkidle');}
  await p.locator('.card img').last().scrollIntoViewIfNeeded();await p.locator('.card img').evaluateAll(imgs=>Promise.all(imgs.map(img=>{img.loading='eager';return img.decode()})));await p.waitForLoadState('networkidle');
  const images=await p.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.webp')).map(r=>({url:r.name,bytes:r.encodedBodySize})));
  check(images.filter(r=>r.url.includes('/covers/')).length===90,'All covers loaded: '+images.filter(r=>r.url.includes('/covers/')).length+'; '+JSON.stringify(images.map(r=>r.url)));
  check(images.reduce((sum,r)=>sum+r.bytes,0)<=3e6,'Library image budget');
  check(!images.some(r=>/episodes\/.+\.webp/.test(r.url)),'Library should only request covers');
  await p.goto(origin+'/#/g1-01');await p.locator('#panel-0 img').first().evaluate(img=>img.decode());
  check((await p.locator('#panel-0 .episode-art img').getAttribute('srcset')).includes('543w'),'Responsive scenes');
  await p.locator('#nextScene').click();await p.locator('#panel-1 .episode-art img').evaluate(img=>img.decode());
  check(await p.locator('#panel-1 .episode-art img').evaluate(img=>img.naturalWidth>0),'Next scene decoded');
  await p.screenshot({path:'output/playwright/wp8/reader-'+width+'.png'});
  check(!errors.length,errors.join(','));results.push({width,firstBytes:first,libraryImageBytes:images.reduce((s,r)=>s+r.bytes,0)});await context.close();
 }
 return results;
}

