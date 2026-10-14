const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const css=read('design.css');
const tokens=Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[a-f\d]{6})/gi)].map(m=>[m[1],m[2]]));
const luminance=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const pairs=[['ink','cream'],['muted','cream'],['ink','jiwoo'],['ink','harin'],...['economy','labor','finance','correct','wrong','locked','hint'].map(name=>[name,name+'-bg'])];
tokens.white='#ffffff';pairs.push(['white','brand']);
for(const [fg,bg] of pairs){const a=luminance(tokens[fg]),b=luminance(tokens[bg]);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,fg+'/'+bg);}
for(const file of ['style.css','growth.css','reader.css','design.css','classroom.css']){
 const source=read(file);
 assert.ok(!/@import|https?:\/\//.test(source),'No external CSS/font requests: '+file);
 for(const m of source.matchAll(/font-size:\s*(\d+)px/g))assert.ok(+m[1]>=12,'Small font: '+file);
}
for(const weight of [400,700]){
 const name='assets/fonts/noto-sans-kr-'+weight+'.woff2';
 const bytes=fs.readFileSync(path.join(root,name));
 assert.equal(bytes.toString('ascii',0,4),'wOF2');assert.equal(bytes.readUInt32BE(8),bytes.length);
 assert.ok(css.includes(name));assert.ok(bytes.length<300000,'Keep font subset small');
}
assert.ok(read('assets/fonts/OFL.txt').includes('SIL OPEN FONT LICENSE'));
assert.ok(read('index.html').includes('href="assets/fonts/OFL.txt"'));
console.log('PASS: 12 text/background token pairs ≥4.5:1, CSS ≥12px, no external styles, two local WOFF2 weights and OFL license.');
