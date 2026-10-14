// Playwright CLI snippet. Uses and resets records only in an isolated localhost session.
async(page)=>{
 const origin=new URL(page.url()).origin;
 if(!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))throw Error('Use a local test server');
 const check=(ok,message)=>{if(!ok)throw Error(message);},errors=[],passed=[];
 page.on('pageerror',e=>errors.push(e.message));
 const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.goto(origin);await page.reload();
 const stories=await page.evaluate(()=>STORIES.map(s=>({id:s.id,grade:s.grade,answer:s.quiz.answer,hintPanel:s.quiz.hintPanel,explain:s.quiz.explain,hint:s.quiz.hint,recap:s.recap,lesson:s.lesson})));
 for(const width of [360,390,768,1280]){
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>{localStorage.removeItem('ecotoon-progress-v3');localStorage.removeItem('ecotoon-progress');});await page.reload();
  for(const story of stories){
   const id=story.id;
   await page.goto(origin+'/#/'+id+'/summary');await settle();
   check(await page.locator('.story-recap li').count()===3,id+' recap count');
   check(await page.locator('.summary-terms dd').count()>=1,id+' vocabulary');
   const geometry=await page.locator('#reader').evaluate(reader=>{
    const failures=[];
    if(reader.scrollWidth>reader.clientWidth)failures.push('reader overflow');
    for(const el of reader.querySelectorAll('.story-recap figcaption,.summary-terms dd,.quiz-question,[data-answer]')){
     const r=el.getBoundingClientRect();
     if(el.scrollWidth>el.clientWidth+1)failures.push('text overflow');
     if(el.matches('button')&&(r.width<44||r.height<44))failures.push('touch size');
    }
    return failures;
   });check(!geometry.length,id+' at '+width+': '+geometry.join(','));
   const historyLength=await page.evaluate(()=>history.length);
   if(story.id.endsWith('-01')){
    await page.screenshot({path:'output/playwright/wp3/summary-'+story.grade+'-'+width+'.png'});
    await page.locator('[data-recap]').nth(1).click();await settle();
    check(await page.locator('#sceneProgress').getAttribute('value')===String(story.recap[1]+1),id+' recap scene');
    await page.locator('#returnToLearning').click();await settle();
    check(new URL(page.url()).hash==='#/'+id+'/summary',id+' return summary');
   }
   await page.locator('#readerSteps [data-stage="quiz"]').click();
   const wrong=(story.answer+1)%3;
   await page.locator('[data-answer="'+wrong+'"]').click();
   check((await page.locator('.feedback').innerText()).includes(story.hint),id+' wrong hint');
   check(await page.evaluate(id=>!JSON.parse(localStorage.getItem('ecotoon-progress-v3')||'{}')[id]?.quiz,id),id+' wrong answer must not complete');
   await page.locator('#quizSceneButton').click();await settle();
   check(new URL(page.url()).hash==='#/'+id,id+' review comic URL');
   check(await page.locator('#sceneProgress').getAttribute('value')===String(story.hintPanel+1),id+' hint scene');
   check(await page.locator('#panel-'+story.hintPanel).isVisible(),id+' target scene visible');
   const clear=await page.locator('#panel-'+story.hintPanel).evaluate(el=>el.getBoundingClientRect().top>=document.querySelector('.reader-toolbar').getBoundingClientRect().bottom-1);
   check(clear,id+' scene not covered by toolbar');
   await page.locator('#returnToLearning').click();await settle();
   check(new URL(page.url()).hash==='#/'+id+'/quiz',id+' return quiz');
   check((await page.locator('[data-answer="'+wrong+'"]').getAttribute('class')).includes('wrong'),id+' retains attempted answer');
   await page.locator('[data-answer="'+story.answer+'"]').click();
   check((await page.locator('.feedback').innerText()).includes(story.explain),id+' correct explanation');
   check(!(await page.locator('#quizSceneButton').isVisible()),id+' no stale hint button');
   check(await page.evaluate(id=>JSON.parse(localStorage.getItem('ecotoon-progress-v3'))[id].quiz===true,id),id+' saves original quiz boolean');
   check(await page.evaluate(()=>history.length)===historyLength,id+' review does not add history entries');
   if(story.id.endsWith('-01'))await page.screenshot({path:'output/playwright/wp3/quiz-'+story.grade+'-'+width+'.png'});
  }
  passed.push(width+'px: 90 summaries, wrong/correct feedback, exact hint scenes, return paths, persistence and layout');
 }
 await page.goto(origin+'/#/g1-01/quiz');await page.reload();
 check(await page.locator('#readerSteps [data-stage="quiz"]').getAttribute('data-complete')==='true','Existing completion retained');
 await page.locator('[data-answer="0"]').click();
 check(await page.locator('#readerSteps [data-stage="quiz"]').getAttribute('data-complete')==='true','Retry wrong answer preserves completed record');
 await page.locator('#readerSteps [data-stage="activity"]').click();await page.locator('#reflection').fill('힌트를 봐도 남는 생각');
 await page.locator('#saveActivity').click();await page.locator('#startGame').click();await page.locator('[data-coin="100"]').click();
 const game=await page.locator('#miniGamePlay').innerHTML();
 await page.locator('#readerSteps [data-stage="quiz"]').click();await page.locator('[data-answer="0"]').click();await page.locator('#quizSceneButton').click();
 await page.locator('#returnToLearning').click();
 check(await page.locator('#miniGamePlay').innerHTML()===game,'Review preserves running game');
 check(await page.locator('#reflection').inputValue()==='힌트를 봐도 남는 생각','Review preserves note');
 await page.goto(origin+'/#/g1-02/quiz');
 check(!(await page.locator('#returnToLearning').isVisible()),'New episode clears return action');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('ecotoon-progress-v3'))['g1-01']);
 check(Object.keys(stored).every(k=>['quiz','read','note','gameDone','gameStars'].includes(k)),'No new progress schema');
 check(!errors.length,errors.join('; '));
 return {passed,compatibility:'Existing quiz records, retries, notes and running game retained',errors};
}
