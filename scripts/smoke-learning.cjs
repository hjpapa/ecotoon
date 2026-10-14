async page=>{
 const origin=new URL(page.url()).origin;if(!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))throw Error('Use localhost');
 const check=(ok,msg)=>{if(!ok)throw Error(msg)},errors=[],passed=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [360,390,768,1280]){
  await page.goto('about:blank');await page.setViewportSize({width,height:900});await page.goto(origin+'/#/g1-01');
  await page.locator('#sceneMenu').click();await page.locator('[data-jump="3"]').click();
  check(await page.locator('.story-pause').isVisible(),'Question after scene 4');
  check(await page.locator('#panel-3 .integrated-speech').count()===3,'Supporting cast');
  await page.locator('[data-pause="1"]').click();check(await page.locator('[data-pause="1"]').getAttribute('aria-pressed')==='true','Selection');
  const choice=await page.locator('[data-pause="1"]').innerText();
  await page.locator('[data-stage="summary"]').click();check((await page.locator('#pauseCompare').innerText()).includes(choice),'Compare prediction');
  await page.locator('[data-stage="comic"]').click();await page.locator('#sceneMenu').click();await page.locator('[data-jump="7"]').click();
  const word=page.locator('#panel-7 [data-term]').first();await word.click();
  check(await page.locator('#termDialog').isVisible(),'Term dialog');check((await page.locator('#termDefinition').innerText()).length>5,'Grade definition');
  await page.keyboard.press('Escape');check(await page.locator('#reader').isVisible(),'Reader stays open');check(await word.evaluate(el=>el===document.activeElement),'Term focus restored');
  await page.locator('[data-stage="activity"]').click();await page.locator('#stage-activity [data-teacher]').click();
  check(await page.locator('.teacher-sheet li').count()===3,'Three teaching prompts');
  check((await page.locator('.teacher-sheet').innerText()).includes('30분'),'Timing');
  await page.evaluate(()=>{window.print=()=>{window.printCalled=document.body.classList.contains('printing-worksheet')}});await page.locator('#printWorksheet').click();check(await page.evaluate(()=>window.printCalled),'Print stylesheet enabled during print');
  await page.emulateMedia({media:'print'});await page.evaluate(()=>document.body.classList.add('printing-worksheet'));
  check(await page.locator('.teacher-sheet').isVisible()&&!(await page.locator('#reader').isVisible()),'Worksheet only in print');
  await page.screenshot({path:'output/playwright/wp9/worksheet-'+width+'.png',fullPage:true});
  await page.evaluate(()=>document.body.classList.remove('printing-worksheet'));await page.emulateMedia({media:'screen'});await page.locator('#info .close').click();
  await page.locator('[data-stage="comic"]').click();await page.locator('#sceneMenu').click();await page.locator('[data-jump="3"]').click();
  await page.screenshot({path:'output/playwright/wp9/pause-'+width+'.png'});
  check(await page.locator('#reader').evaluate(el=>el.scrollWidth<=el.clientWidth),'No overflow');passed.push(width+'px: prediction, glossary, guest dialogue, worksheet print and focus');
 }
 await page.setViewportSize({width:1920,height:1080});await page.goto('about:blank');await page.goto(origin+'/#/g1-01');await page.locator('#boardMode').click();await page.locator('#sceneMenu').click();await page.locator('[data-jump="3"]').click();
 check(!(await page.locator('.story-pause').isVisible()),'Board question waits for dialogue');
 for(let i=0;i<3;i++)await page.keyboard.press('PageDown');
 check(await page.locator('.story-pause').isVisible(),'Board question after 3 lines');await page.locator('[data-pause="0"]').click();
 await page.screenshot({path:'output/playwright/wp9/board-question.png'});
 await page.goto(origin+'/#/g1-03');await page.locator('#sceneMenu').click();await page.locator('[data-jump="3"]').click();check(await page.locator('#panel-3 .integrated-speech').count()===0,'Silent panel');await page.locator('#nextScene').click();check(await page.locator('#sceneProgress').getAttribute('value')==='5','Silent panel advances');
 check(!errors.length,errors.join(','));return{passed,board:'3-line and silent scenes',errors};
}
