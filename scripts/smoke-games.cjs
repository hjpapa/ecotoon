// Local isolated session. Tests engines with both live stories and development examples.
async page=>{
 const origin=new URL(page.url()).origin;if(!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin))throw Error('Use localhost');
 const check=(ok,m)=>{if(!ok)throw Error(m)},errors=[],passed=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin);const stories=await page.evaluate(()=>STORIES.map(s=>({id:s.id,game:s.game}))),examples=await (await page.request.get(origin+'/production/game-examples.json')).json();
 const types=[...new Set(stories.map(s=>s.game.type))];
 const fixtures=[...stories.map(s=>({label:s.id,game:s.game})),...examples.filter(g=>g.type==='simulate').map(g=>({label:g.model,game:g})),{label:'change',game:{type:'coins',title:'거스름돈',mode:'change',targets:[350],payments:[500],coins:[10,50,100]}}];
 for(const width of [360,390,768,1280]){
  await page.setViewportSize({width,height:900});await page.goto(origin+'/#/g1-01/game');
  for(const fixture of fixtures){
   const g=fixture.game;
   await page.evaluate(g=>{const root=document.querySelector('#miniGamePlay');root.hidden=false;window.testStars=0;MiniGames.mount(root,{...STORIES[0],game:g},stars=>{window.testStars=stars;return true;});},g);
   if(g.type==='order')for(let i=0;i<g.steps.length;i++)await page.locator('[data-step="'+i+'"]').press('Enter');
   if(g.type==='match')for(let i=0;i<g.pairs.length;i++){await page.locator('[data-side="0"][data-pair="'+i+'"]').click();await page.locator('[data-side="1"][data-pair="'+i+'"]').click();}
   if(g.type==='sort')for(let i=0;i<g.cards.length;i++){const text=await page.locator('.sort-card').innerText();await page.locator('[data-bin="'+g.cards.find(c=>c[0]===text)[1]+'"]').click();}
   if(g.type==='coins')for(let i=0;i<g.targets.length;i++){let n=g.mode==='change'?g.payments[i]-g.targets[i]:g.targets[i];for(const c of [...g.coins].sort((a,b)=>b-a))while(n>=c){await page.locator('[data-coin="'+c+'"]').press('Enter');n-=c;}await page.locator('#coin-check').click();}
   if(g.type==='budget'){for(let i=0;i<g.items.length;i++)if(g.need.includes(g.items[i][0]))await page.locator('[data-item="'+i+'"]').click();await page.locator('#budget-check').click();}
   if(g.type==='shop'){
    for(let step=0;step<=(g.events||[]).length;step++){
     const prices=g.items.map(i=>i.price);let budget=g.budget;for(const e of (g.events||[]).slice(0,step)){budget+=e.budgetDelta||0;if(e.item!==undefined)prices[e.item]+=e.priceDelta||0;}
     const solution=Array.from({length:2**g.items.length},(_,mask)=>g.items.map((_,i)=>i).filter(i=>mask&(1<<i))).find(p=>p.length&&p.reduce((s,i)=>s+prices[i],0)<=budget&&g.requirements.every(r=>p.some(i=>g.items[i].tag===r)));
     for(let i=0;i<g.items.length;i++)if((await page.locator('[data-item="'+i+'"]').getAttribute('aria-pressed')==='true')!==solution.includes(i))await page.locator('[data-item="'+i+'"]').click();await page.locator('#shop-check').click();
    }
    await page.locator('#shop-reason').fill('필요한 쓰임과 남는 돈을 비교했어요.');await page.locator('#shop-finish').click();
   }
   if(g.type==='simulate'){await page.locator('[data-predict="0"]').press('Enter');await page.locator('#simulate-run').click();await page.locator('[data-param]').first().press('End');await page.locator('#simulate-run').click();await page.locator('#sim-reflect').fill('값을 바꾸고 두 결과의 차이를 확인했어요.');await page.locator('#sim-finish').click();}
   if(g.type==='ledger'){let cash=g.start;for(let i=0;i<g.rows.length;i++){const r=g.rows[i];cash+=r.in-r.out-(r.save||0);await page.locator('#ledger-'+i).fill(String(cash));if(g.classify)await page.locator('#ledger-kind-'+i).selectOption(r.save?'save':r.in?'in':'out');}await page.locator('#ledger-check').click();await page.locator('#ledger-next').fill('쓴 날에 기록할래요.');await page.locator('#ledger-finish').click();}
   if(g.type==='scenario'){let id=g.start;while(!g.nodes[id].end){const choices=g.nodes[id].choices,i=choices.findIndex(c=>!c.retry);await page.locator('[data-choice="'+i+'"]').press('Enter');id=choices[i].next;}await page.locator('#scenario-finish').click();}
   if(g.type==='portfolio'){await page.locator('[data-forecast]').first().click();for(let i=0;i<g.tokens;i++)await page.locator('[data-plus="'+i%g.assets.length+'"]').click();await page.locator('#portfolio-next').click();for(const _ of g.rounds)await page.locator('#portfolio-next').click();await page.locator('#portfolio-reflect').fill('나눠도 모두 떨어지는 경우가 있었어요.');await page.locator('#portfolio-finish').click();}
   check(await page.evaluate(()=>window.testStars)===3,width+' '+fixture.label+' completion');
   const geometry=await page.locator('#miniGamePlay').evaluate(root=>({overflow:root.scrollWidth>root.clientWidth+1,small:[...root.querySelectorAll('button,input,select')].filter(e=>e.checkVisibility()).some(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<44;})}));check(!geometry.overflow&&!geometry.small,width+' '+fixture.label+' '+JSON.stringify(geometry));
   await page.locator('#game-reward').scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/wp6/'+width+'-'+fixture.label+'.png'});passed.push(width+' '+fixture.label);
  }
 }
 check(!errors.length,errors.join(';'));return {passed,errors};
}
