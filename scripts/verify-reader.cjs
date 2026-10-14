const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..'), context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'reader.js'),'utf8'),context);
const reader = context.window.ComicReader;
const stories = vm.runInNewContext(fs.readFileSync(path.join(root,'catalog.js'),'utf8')+';STORIES');
for (const story of stories) {
  assert.equal(reader.defaultMode(story.grade),story.grade <= 2 ? 'paged' : 'scroll');
  const counts = story.panels.map(panel=>panel.lines.length);
  for (const mode of ['paged','board']) {
    let frame={index:0,revealed:0,done:false}, turns=0;
    while (!frame.done && turns++ < 100) frame=reader.advance(mode,frame.index,frame.revealed,counts);
    assert.equal(frame.done,true,story.id+' reaches summary');
    assert.equal(frame.index,7);
    assert.equal(turns,8+(mode==='board'?counts.reduce((a,b)=>a+b,0):0));
  }
}
// Silence, one, two and three lines all support forward/backward presentation.
const counts=[0,1,2,3];
let frame={index:0,revealed:0};
for(let i=0;i<9;i++)frame=reader.advance('board',frame.index,frame.revealed,counts);
assert.equal(frame.index,3);assert.equal(frame.revealed,3);
for(let i=0;i<9;i++)frame=reader.retreat('board',frame.index,frame.revealed,counts);
assert.equal(frame.index,0);assert.equal(frame.revealed,0);
assert.equal(reader.swipeDirection(-100,10),1);
assert.equal(reader.swipeDirection(100,10),-1);
for(const [dx,dy] of [[59,0],[100,100],[0,100],[60,30]])assert.equal(reader.swipeDirection(dx,dy),0);
console.log('PASS: 90 reader defaults and complete paging/presentation paths, 0–3 lines, backward steps and swipe thresholds.');
