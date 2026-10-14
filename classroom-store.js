/* Local profiles keep the existing v3 record fields inside one atomic document. */
(function(global){
 'use strict';
 const KEY='ecotoon-classroom-v1',FORMAT='ecotoon-profile',MAX_FILE=4*1024*1024;
 const EMOJIS=['🌱','🐻','🐰','🐱','🐳','⭐'];
 const LEGACY_MAP=[1,9,12,17,21,27,33,36,42,46,54,56,61,69,73,76,83,87,5,7,3,20,21,30,34,36,42,48,54,59,62,66,71,79,83,88];
 const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const copy=v=>JSON.parse(JSON.stringify(v));
 const fail=message=>{throw new Error(message)};
 function name(value){
  if(typeof value!=='string'||!value.trim()||[...value.trim()].length>12||/[\u0000-\u001f\u007f]/.test(value))fail('별명은 1~12자로 적어 주세요.');
  return value.trim();
 }
 function validateRecords(value,ids){
  if(!object(value)||Object.keys(value).length>90)fail('학습 기록 형식이 올바르지 않아요.');
  const result={};
  for(const [id,record] of Object.entries(value)){
   if(!ids.has(id)||!object(record))fail('알 수 없는 이야기나 기록이 있어요.');
   const item={};
   for(const [key,v] of Object.entries(record)){
    if(['read','quiz','gameDone'].includes(key)){if(typeof v!=='boolean')fail('완료 기록은 참/거짓이어야 해요.');}
    else if(key==='note'){if(typeof v!=='string')fail('활동 메모는 글자여야 해요.');}
    else if(key==='gameStars'){if(!Number.isInteger(v)||v<0||v>3)fail('별 기록은 0~3이어야 해요.');}
    else fail('지원하지 않는 기록 항목이 있어요.');
    item[key]=v;
   }
   result[id]=item;
  }
  return result;
 }
 function create(storage,stories){
  const ids=new Set(stories.map(s=>s.id));
  let raw=null,blocked=false,issue='',state;
  const empty=records=>({version:1,activeId:'original',profiles:[{id:'original',name:Object.keys(records).length?'기존 기록':'새싹',emoji:'🌱',records}]});
  try{
   raw=storage.getItem(KEY);
   if(raw!==null){
    state=JSON.parse(raw);
    if(!object(state)||state.version!==1||!Array.isArray(state.profiles)||!state.profiles.length||state.profiles.length>30)fail('프로필 형식 오류');
    const seen=new Set();
    for(const p of state.profiles){
     if(!object(p)||typeof p.id!=='string'||seen.has(p.id)||!EMOJIS.includes(p.emoji))fail('프로필 형식 오류');
     seen.add(p.id);p.name=name(p.name);validateRecords(p.records,ids);
    }
    if(!seen.has(state.activeId))fail('프로필 형식 오류');
   }else{
    let records={};const v3=storage.getItem('ecotoon-progress-v3');
    if(v3!==null)records=validateRecords(JSON.parse(v3),ids);
    else{
     const legacy=JSON.parse(storage.getItem('ecotoon-progress')||'{}');
     if(!object(legacy))fail('이전 기록 형식 오류');
     for(const [index,p] of Object.entries(legacy)){
      const target=stories[LEGACY_MAP[+index]-1];if(!target||!object(p))continue;
      const previous=records[target.id]||{};
      records[target.id]={read:previous.read===true||p.read===true,quiz:previous.quiz===true||p.quiz===true,
       note:[previous.note,typeof p.note==='string'?p.note:null].filter(Boolean).join('\n\n')};
     }
     validateRecords(records,ids);
    }
    state=empty(records);
   }
  }catch(error){
   // Never overwrite unreadable data. A disabled storage API still allows session learning.
   blocked=true;issue='저장된 기록을 읽을 수 없어요. 원본은 그대로 두고 이번 화면에서만 학습합니다.';state=empty({});
  }
  const current=()=>state.profiles.find(p=>p.id===state.activeId);
  function commit(next){
   if(blocked)fail(issue);
   let latest;
   try{latest=storage.getItem(KEY);}catch{fail('브라우저 저장을 사용할 수 없어요. 기록 파일로 저장해 주세요.');}
   if(latest!==raw)fail('다른 탭에서 프로필이나 기록이 바뀌었어요. 지금 기록을 파일로 저장한 뒤 새로고침해 주세요.');
   const serialized=JSON.stringify(next);
   try{storage.setItem(KEY,serialized);}catch{fail('브라우저 저장 공간이 부족하거나 차단되었어요. 기록 파일로 저장해 주세요.');}
   state=next;raw=serialized;issue='';

  }
  function change(fn){const next=copy(state);fn(next);try{commit(next);}catch(e){issue=e.message;throw e;}}
  const uniqueName=nickname=>{if(state.profiles.some(p=>p.name===nickname))fail('이미 있는 별명이에요. 다른 별명을 골라 주세요.');};
  function add(nickname,emoji,records){
   nickname=name(nickname);uniqueName(nickname);
   if(!EMOJIS.includes(emoji))fail('그림을 골라 주세요.');
   if(state.profiles.length>=30)fail('프로필은 30개까지 만들 수 있어요. 필요 없는 프로필을 지워 주세요.');
   const id='p-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
   change(next=>{next.profiles.push({id,name:nickname,emoji,records});next.activeId=id;});
  }
  function eraseLegacy(){try{storage.removeItem('ecotoon-progress-v3');storage.removeItem('ecotoon-progress');}catch{issue='현재 프로필은 지웠지만 이전 기록 복사본을 지우지 못했어요. 브라우저 저장 권한을 확인해 주세요.';}}
  return {
   current:()=>copy(current()),list:()=>state.profiles.map(({id,name,emoji})=>({id,name,emoji})),issue:()=>issue,
   save(records){
    // Preserve unsaved work in this tab so it can be exported after a quota/conflict failure.
    const next=copy(state);next.profiles.find(p=>p.id===state.activeId).records=copy(records);
    try{commit(next);return true;}catch(e){state=next;issue=e.message;return false;}
   },
   add:(nickname,emoji)=>add(nickname,emoji,{}),
   select(id){if(!state.profiles.some(p=>p.id===id))fail('프로필을 찾을 수 없어요.');change(next=>{next.activeId=id;});},
   rename(nickname,emoji){nickname=name(nickname);if(nickname!==current().name)uniqueName(nickname);if(!EMOJIS.includes(emoji))fail('그림을 골라 주세요.');change(next=>Object.assign(next.profiles.find(p=>p.id===next.activeId),{name:nickname,emoji}));},
   clear(){const original=state.activeId==='original';change(next=>{next.profiles.find(p=>p.id===next.activeId).records={};});if(original)eraseLegacy();},
   remove(){const original=state.activeId==='original';if(state.profiles.length===1)fail('마지막 프로필은 지울 수 없어요. 내 기록 지우기를 사용해 주세요.');change(next=>{next.profiles=next.profiles.filter(p=>p.id!==next.activeId);next.activeId=next.profiles[0].id;});if(original)eraseLegacy();},
   export(){return JSON.stringify({format:FORMAT,version:1,profile:{name:current().name,emoji:current().emoji},records:current().records},null,2);},
   parse(text){
    if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_FILE)fail('4MB 이하의 기록 파일을 골라 주세요.');
    let file;try{file=JSON.parse(text.replace(/^\uFEFF/,''));}catch{fail('JSON 기록 파일을 읽을 수 없어요.');}
    if(!object(file)||file.format!==FORMAT||file.version!==1||!object(file.profile))fail('이 앱에서 저장한 버전 1 기록 파일을 골라 주세요.');
    const nickname=name(file.profile.name);if(!EMOJIS.includes(file.profile.emoji))fail('프로필 그림이 올바르지 않아요.');
    return {name:nickname,emoji:file.profile.emoji,records:validateRecords(file.records,ids)};
   },
   import(text,nickname){const file=this.parse(text);add(nickname,file.emoji,file.records);}
  };
 }
 global.ClassroomStorage={create,KEY,EMOJIS,MAX_FILE};
})(typeof window==='undefined'?globalThis:window);
