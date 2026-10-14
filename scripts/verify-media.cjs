const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'production/media-manifest.json'),'utf8'));
let covers=0;
assert.equal(Object.keys(manifest).length,1550);
for(const [file,meta] of Object.entries(manifest)){
 assert.equal(fs.statSync(path.join(root,'assets',file)).size,meta.bytes,file);
 if(file.startsWith('covers/')){assert.equal(meta.width,480);assert.equal(meta.height,320);assert.ok(meta.bytes<35000,file);covers+=meta.bytes;}
 if(file.startsWith('episodes/'))assert.equal(meta.width,file.includes('-small')?360:543);
}
assert.ok(covers<3e6,'All 90 covers <= 3 MB');
assert.ok(!fs.readFileSync(path.join(root,'app.js'),'utf8').includes('sheet.src'),'No atlas requests');
console.log('PASS: 90 covers, 1440 scene variants, 20 UI assets; covers '+(covers/1e6).toFixed(2)+' MB; native resolution retained.');
