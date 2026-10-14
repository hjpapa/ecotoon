(function(){
 const prefix='ecotoon-library-v1:',memory=new Map();
 function read(id){
  if(memory.has(id))return memory.get(id);
  let p={};try{p=JSON.parse(localStorage.getItem(prefix+id))||{}}catch{}
  if(!p||typeof p!=='object')p={};
  return {grade:Number.isInteger(p.grade)&&p.grade>=0&&p.grade<=6?p.grade:0,last:typeof p.last==='string'&&/^#\/g[1-6]-\d{2}(?:\/(?:comic|summary|quiz|activity|game))?$/.test(p.last)?p.last:null};
 }
 function save(id,patch){const p={...read(id),...patch};memory.set(id,p);try{localStorage.setItem(prefix+id,JSON.stringify(p))}catch{}return p;}
 function clear(id){memory.set(id,{grade:0,last:null});try{localStorage.removeItem(prefix+id)}catch{}}
 window.EcoLibrary={read,save,clear};
})();
