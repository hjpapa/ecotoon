// Run in an isolated localhost Playwright CLI session. Clears only its local test data.
async page=>{
 const origin=new URL(page.url()).origin;
 if(!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))throw Error('Use localhost');
 const check=(v,m)=>{if(!v)throw Error(m)},errors=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));
 const profile=()=>page.locator('#profileNav').click();
 const close=()=>page.locator('#profilesDialog .close').click();
 const choose=async name=>{await page.locator('.profile-list button').filter({hasText:name}).click();};
 const read=async()=>{await page.locator('[data-story="g1-01"]').click();await page.locator('[data-stage="activity"]').click();};
 const create=async name=>{await page.locator('#newNickname').fill(name);await page.locator('#newProfile button').click();};
 for(const width of [360,390,768,1280]){
  await page.setViewportSize({width,height:900});await page.goto(origin);
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('ecotoon-progress-v3',JSON.stringify({'g1-01':{read:true,quiz:true,note:'이전 학생 메모',gameDone:true,gameStars:3}}));});await page.reload();
  check(await page.locator('#guideNav').isVisible(),'Mobile teacher guide '+width);
  await page.locator('#guideNav').click();check(await page.locator('#infoBody').innerText().then(s=>s.includes('별명')),'Teacher classroom instructions');await page.locator('#info .close').click();
  await profile();await create('달토끼');await close();await read();
  check(await page.locator('#reflection').inputValue()==='','New profile blank');check(await page.locator('#startGame').isDisabled(),'New profile game locked');
  await page.locator('#reflection').fill('토끼의 활동 메모');await page.locator('#saveActivity').click();
  await page.locator('[data-stage="quiz"]').click();await page.locator('[data-answer="1"]').click();
  await page.locator('#reader .close').click();await profile();
  const downloadPromise=page.waitForEvent('download');await page.locator('#exportProfile').click();const download=await downloadPromise;
  await download.saveAs('output/playwright/wp5/profile-'+width+'.json');
  const exported=await page.evaluate(()=>classroomStore.export());
  await create('별고래');await close();await read();
  check(await page.locator('#reflection').inputValue()==='','Student records isolated');
  check(await page.locator('#startGame').isDisabled(),'Student game state isolated');await page.locator('#reader .close').click();await profile();
  await choose('달토끼');await close();await read();check(await page.locator('#reflection').inputValue()==='토끼의 활동 메모','Switch restores note');
  check(await page.locator('#startGame').isEnabled(),'Switch restores game unlock');await page.locator('#reader .close').click();await profile();
  await page.locator('#importFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(exported)});
  await page.locator('#importPreview').waitFor({state:'visible'});await page.locator('#confirmImport').click();
  check(await page.locator('#profileMessage').innerText().then(s=>s.includes('이미 있는')),'Duplicate import name rejected');
  await page.locator('#importNickname').fill('다시토끼');await page.locator('#confirmImport').click();
  check(await page.evaluate(()=>classroomStore.current().records['g1-01'].quiz===true),'Import preserves quiz');
  await page.locator('#clearProfile').click();await page.locator('#cancelDelete').click();
  check(await page.evaluate(()=>!!classroomStore.current().records['g1-01']),'Cancel deletion retains record');
  await page.locator('#clearProfile').click();await page.locator('#confirmDelete').click();
  check(await page.evaluate(()=>Object.keys(classroomStore.current().records).length===0),'Clear current records');
  await choose('달토끼');check(await page.evaluate(()=>classroomStore.current().records['g1-01'].note)==='토끼의 활동 메모','Clear leaves other student intact');
  await choose('다시토끼');await page.locator('#deleteProfile').click();await page.locator('#confirmDelete').click();
  check(await page.locator('.profile-list button').count()===3,'Delete profile');
  await page.locator('#importFile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"format":"bad"}')});
  await page.waitForFunction(()=>document.querySelector('#profileMessage').textContent.includes('버전 1'));
  check(await page.locator('#importPreview').isHidden(),'Invalid file not imported');
  await choose('기존 기록');check(await page.evaluate(()=>classroomStore.current().records['g1-01'].note)==='이전 학생 메모','Original v3 preserved');
  await page.locator('#editNickname').fill('숲친구');await page.locator('#editEmoji').selectOption('🐻');await page.locator('#renameProfile button').click();
  await page.locator('#profileBody').evaluate(el=>el.closest('dialog').scrollTo(0,0));
  const dimensions=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,dialog:document.querySelector('#profilesDialog').scrollWidth>document.querySelector('#profilesDialog').clientWidth,small:[...document.querySelectorAll('#profileBody button,#profileBody input,#profileBody select')].filter(e=>e.checkVisibility()).some(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<44;})}));
  check(!dimensions.overflow&&!dimensions.dialog&&!dimensions.small,'Profile geometry '+width+JSON.stringify(dimensions));
  await page.screenshot({path:'output/playwright/wp5/profiles-'+width+'.png'});
  await close();check(await page.locator('#profileNav').evaluate(el=>el===document.activeElement),'Profile close restores focus');
  await page.reload();check(await page.locator('#profileNav').innerText().then(s=>s.includes('숲친구')),'Active profile persists');
  await page.screenshot({path:'output/playwright/wp5/home-'+width+'.png'});
  results.push(width+'px: teacher access, isolation, persistence, export/import, validation, rename, clear/delete and focus');
 }
 // A second tab cannot silently write into a profile selected elsewhere.
 const second=await page.context().newPage();await second.goto(origin+'/#/g1-01/activity');
 await profile();await choose('달토끼');await close();
 await second.locator('#reflection').fill('다른 탭에서 쓴 메모');await second.locator('#saveActivity').click();
 check(await second.evaluate(()=>classroomStore.issue().includes('다른 탭')),'Stale tab conflict');
 check(await second.evaluate(()=>JSON.parse(classroomStore.export()).records['g1-01'].note)==='다른 탭에서 쓴 메모','Unsaved conflict work exportable');
 await second.close();await page.reload();check(await page.locator('#profileNav').innerText().then(s=>s.includes('달토끼')),'Other tab cannot replace active student');
 check(errors.length===0,errors.join('; '));return {passed:results,conflict:'passed',errors};
}
