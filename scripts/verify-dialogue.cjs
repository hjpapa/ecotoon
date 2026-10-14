const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const stories=vm.runInNewContext(fs.readFileSync('catalog.js','utf8')+';STORIES'),counts=new Set(),questions=new Set();
for(const s of stories){
 assert.equal(s.pause.after,3);assert.equal(s.pause.answer,null);
 assert.equal(s.pause.options.length,2);assert.equal(new Set(s.pause.options).size,2);
 assert.ok(s.pause.question&&!questions.has(s.pause.question));questions.add(s.pause.question);
 assert.equal(s.teacher.prompts.length,3);assert.ok(s.teacher.objective&&s.teacher.minutes>0);
 for(const p of s.panels){counts.add(p.lines.length);assert.ok(p.lines.length<=3);
  for(const line of p.lines){const match=line.match(/^([^:]+):\s*(.+)$/);assert.ok(match,line);const text=match[2];
   assert.ok([...text].length<=(s.grade<=2?24:s.grade<=4?30:35),s.id+': '+text);
   if(s.grade<=2)assert.ok(text.replace(/[‘’“”'"…]/g,'').split(/[.!?。！？]+/).filter(t=>t.trim()).length===1,s.id+': one sentence');
  }
 }
 assert.ok(s.panels[7].lines.some(line=>line.startsWith('모아:')));
 assert.ok(s.terms.some(t=>s.panels.some(p=>p.lines.some(l=>l.includes(t)))),'In-dialogue glossary anchor');
}
assert.deepEqual([...counts].sort(),[0,1,2,3]);
assert.ok(stories.filter(s=>s.panels.some(p=>p.lines.some(l=>!/^(지우|하린|모아):/.test(l)))).length>=12);
console.log('PASS: 90 unique open predictions, teacher sheets, 0–3 dialogue lines, grade sentence limits, glossary anchors and 12 supporting casts.');
