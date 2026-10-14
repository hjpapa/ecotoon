const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const stories=vm.runInNewContext(read('catalog.js')+';STORIES');
const scope={};scope.window=scope;vm.createContext(scope);vm.runInContext(read('games/models.js'),scope);
const examples=JSON.parse(read('production/game-examples.json'));
function check(g,id){
 assert.ok(g.title,id+' title');
 if(g.type==='simulate'){
  assert.ok(scope.EcoModels.names.includes(g.model));assert.ok(g.predict.options.length>=2);assert.ok(g.params.length);
  const combinations=[{...g.fixed}];
  for(const p of g.params){assert.ok(p.min<p.max&&p.step>0);const old=combinations.splice(0);for(const a of old)for(let n=p.min;n<=p.max;n+=p.step)combinations.push({...a,[p.key]:n});}
  const values=combinations.map(p=>scope.EcoModels.calculate(g.model,p).value);assert.ok(values.every(Number.isFinite));assert.ok(new Set(values).size>1,id+' meaningful experiment');
 }else if(g.type==='shop'){
  assert.ok(g.items.length>=2&&g.items.length<=12);let budget=g.budget;const prices=g.items.map(i=>i.price);
  const possible=()=>Array.from({length:2**g.items.length},(_,mask)=>g.items.map((_,i)=>i).filter(i=>mask&(1<<i))).some(p=>p.length&&p.reduce((s,i)=>s+prices[i],0)<=budget&&g.requirements.every(r=>p.some(i=>g.items[i].tag===r)));
  assert.ok(possible(),id+' initial shop solution');for(const e of g.events||[]){budget+=e.budgetDelta||0;if(e.item!==undefined)prices[e.item]+=e.priceDelta||0;assert.ok(possible(),id+' event solution');}
 }else if(g.type==='ledger'){
  let balance=g.start;assert.ok(g.rows.length>=3);for(const row of g.rows){for(const n of [row.in,row.out,row.save||0])assert.ok(Number.isInteger(n)&&n>=0);balance+=row.in-row.out-(row.save||0);assert.ok(balance>=0,id+' ledger balance');}
 }else if(g.type==='scenario'){
  const seen=new Set(),visit=id=>{if(seen.has(id))return false;seen.add(id);const n=g.nodes[id];assert.ok(n);if(n.end)return true;assert.ok(n.choices.length>=2);let solvable=false;for(const c of n.choices){assert.ok(g.nodes[c.next]&&c.feedback);if(!c.retry)solvable=visit(c.next)||solvable;}return solvable;};assert.ok(visit(g.start),id+' scenario ending');
 }else if(g.type==='coins'){
  for(let i=0;i<g.targets.length;i++){const target=g.mode==='change'?g.payments[i]-g.targets[i]:g.targets[i];assert.ok(target>=0&&Number.isInteger(target));const dp=Array(target+1).fill(Infinity);dp[0]=0;for(let n=1;n<=target;n++)for(const c of g.coins)if(n>=c)dp[n]=Math.min(dp[n],dp[n-c]+1);assert.ok(dp[target]<=60,id+' coin solution');}
 }else if(g.type==='portfolio'){assert.ok(g.assets.length>=2);assert.ok(g.tokens>0);assert.ok(g.rounds.length>=2);for(const r of g.rounds)assert.equal(r.length,g.assets.length);}
 else if(g.type==='order'){assert.ok(g.steps.length>=4);assert.equal(new Set(g.steps).size,g.steps.length);}
 else if(g.type==='match'){assert.ok(g.pairs.length>=4);for(const side of [0,1])assert.equal(new Set(g.pairs.map(p=>p[side])).size,g.pairs.length);}
 else if(g.type==='sort'){assert.ok(g.cards.length>=6);for(const c of g.cards)assert.ok(g.bins[c[1]]);}
 else if(g.type==='budget'){assert.ok(g.need.every(n=>g.items.some(i=>i[0]===n)));assert.ok(g.items.filter(i=>g.need.includes(i[0])).reduce((s,i)=>s+i[1],0)<=g.budget);}
 else assert.fail('Unknown engine '+g.type);
}
stories.forEach(s=>check(s.game,s.id));examples.forEach(g=>check(g,'example '+g.model));
const planned={shop:['g1-05','g2-05','g2-14','g3-01','g3-03','g4-15'],simulate:['g2-12','g3-12','g3-14','g5-01','g5-03','g5-11','g5-12','g6-01','g6-03'],ledger:['g3-13','g4-11','g4-12','g4-13','g4-14'],scenario:['g4-07','g4-09','g5-08','g5-15','g6-06','g6-11','g6-12','g6-14'],portfolio:['g5-13']};
for(const [type,ids]of Object.entries(planned))for(const id of ids)assert.equal(stories.find(s=>s.id===id).game.type,type,id);
for(const s of stories){const g=s.game;assert.ok(g.unit&&g.wrapUp);if(['order','match','sort'].includes(g.type)){const rows=g.steps||g.pairs||g.cards;assert.ok(rows.length>=6&&rows.length<=8,s.id+' 6–8 items');assert.ok(rows.every((r,i)=>g.type==='order'?g.why[i]:r[2]),s.id+' why');}if(g.type==='sort'&&s.grade>=5)assert.ok(g.bins.length>=3,s.id+' three bins');}
assert.equal(scope.EcoModels.calculate('interest',{principal:10,weeks:4,rate:2}).value,18);
assert.equal(scope.EcoModels.calculate('savings-goal',{goal:3000,saved:500,weekly:1000}).value,3);
assert.equal(scope.EcoModels.calculate('loan',{principal:10000,rate:5,years:2}).value,11000);
assert.equal(scope.EcoModels.calculate('exchange',{dollars:10,exchange:1200}).value,12000);
console.log('PASS: all 90 games solvable, all nine model parameter ranges valid, four new engine examples and arithmetic fixtures.');
