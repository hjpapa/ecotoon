/* Profile management is available from the library, outside an active lesson. */
(function(){
 const $=s=>document.querySelector(s),store=window.classroomStore;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dialog=$('#profilesDialog'),body=$('#profileBody');
 let pending=null,importText=null,readSequence=0;
 const message=text=>{$('#profileMessage').textContent=text;};
 function sync(){
  window.applyClassroomProfile();const p=store.current();
  $('#profileNav').textContent=p.emoji+' '+p.name+' · 바꾸기';
  $('#profileStatus').textContent=store.issue()||'현재 '+p.emoji+' '+p.name+'의 기록입니다. 공용 기기에서는 내 별명을 선택하세요.';
 }
 function run(action,success){try{action();sync();render();message(store.issue()||success);body.querySelector('[aria-pressed="true"]').focus();}catch(e){message(e.message);}}
 function emojiOptions(selected){return ClassroomStorage.EMOJIS.map(e=>'<option'+(e===selected?' selected':'')+'>'+e+'</option>').join('');}
 function render(){
  pending=null;importText=null;readSequence++;
  const p=store.current();
  body.innerHTML='<p>실명 대신 별명과 그림을 골라 주세요. 모든 프로필은 이 기기를 쓰는 사람이 볼 수 있어요.</p>'+
   '<div class="profile-list" role="group" aria-label="프로필 선택">'+store.list().map(item=>'<button type="button" data-profile="'+escape(item.id)+'" aria-pressed="'+(item.id===p.id)+'">'+escape(item.emoji+' '+item.name)+'</button>').join('')+'</div>'+
   '<form id="newProfile"><h3>새 별명 만들기</h3><label for="newNickname">별명 (실명 금지, 12자 이하)</label><input id="newNickname" maxlength="24" required autocomplete="off"><label for="newEmoji">내 그림</label><select id="newEmoji">'+emojiOptions('🌱')+'</select><button class="action" type="submit">새 프로필 만들기</button></form>'+
   '<form id="renameProfile"><h3>지금 별명 바꾸기</h3><label for="editNickname">별명</label><input id="editNickname" maxlength="24" required autocomplete="off" value="'+escape(p.name)+'"><label for="editEmoji">내 그림</label><select id="editEmoji">'+emojiOptions(p.emoji)+'</select><button type="submit">별명과 그림 저장</button></form>'+
   '<section><h3>내 기록 옮기기</h3><p>파일에는 지금 프로필의 별명과 활동 메모가 들어갑니다. 공용 기기에서 내려받은 파일은 사용 후 직접 지워 주세요.</p><button id="exportProfile" type="button">내 기록 파일로 저장 (JSON)</button><label for="importFile">기록 불러오기 (JSON, 4MB 이하)</label><input type="file" id="importFile" accept=".json,application/json"><div id="importPreview" hidden><p id="importSummary"></p><label for="importNickname">새 프로필 별명</label><input id="importNickname" maxlength="24" autocomplete="off"><button id="confirmImport" type="button">새 프로필로 불러오기</button><button id="cancelImport" type="button">불러오기 취소</button></div></section>'+
   '<section><h3>내 기록 지우기</h3><p>다른 프로필의 기록은 유지합니다. 지운 기록은 되돌릴 수 없으니 필요하면 먼저 파일로 저장하세요.</p><button id="clearProfile" type="button">현재 프로필의 학습 기록 지우기</button><button id="deleteProfile" type="button"'+(store.list().length===1?' disabled':'')+'>현재 프로필 삭제</button><div id="deleteConfirm" hidden><p id="deletePrompt"></p><button id="confirmDelete" type="button" class="danger">확인하고 지우기</button><button id="cancelDelete" type="button">취소</button></div></section>'+
   '<p id="profileMessage" role="status" aria-live="polite"></p>';
  body.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>run(()=>store.select(b.dataset.profile),'프로필을 바꿨어요.'));
  $('#newProfile').onsubmit=e=>{e.preventDefault();run(()=>store.add($('#newNickname').value,$('#newEmoji').value),'새 프로필을 선택했어요.');};
  $('#renameProfile').onsubmit=e=>{e.preventDefault();run(()=>store.rename($('#editNickname').value,$('#editEmoji').value),'별명과 그림을 저장했어요.');};
  $('#exportProfile').onclick=()=>{
   const url=URL.createObjectURL(new Blob([store.export()],{type:'application/json;charset=utf-8'}));
   const a=document.createElement('a');a.href=url;a.download='ecotoon-records-'+new Date().toISOString().slice(0,10)+'.json';a.click();
   setTimeout(()=>URL.revokeObjectURL(url),1000);message('기록 파일을 저장했어요. 다운로드 폴더를 확인하세요.');
  };
  $('#importFile').onchange=async event=>{
   const sequence=++readSequence,file=event.target.files[0];importText=null;$('#importPreview').hidden=true;
   if(!file)return;
   try{
    if(file.size>ClassroomStorage.MAX_FILE)throw Error('4MB 이하의 기록 파일을 골라 주세요.');
    const text=await file.text();if(sequence!==readSequence||!dialog.open)return;
    const incoming=store.parse(text);importText=text;
    $('#importSummary').textContent=incoming.emoji+' '+incoming.name+' · '+Object.keys(incoming.records).length+'편의 기록을 새 프로필로 가져옵니다.';
    $('#importNickname').value=incoming.name;$('#importPreview').hidden=false;$('#importNickname').focus();message('내용과 별명을 확인한 뒤 불러오세요.');
   }catch(e){if(sequence===readSequence)message(e.message);}
  };
  $('#confirmImport').onclick=()=>{if(importText!==null)run(()=>store.import(importText,$('#importNickname').value),'새 프로필로 기록을 불러왔어요.');};
  $('#cancelImport').onclick=()=>{readSequence++;importText=null;$('#importPreview').hidden=true;$('#importFile').value='';message('불러오기를 취소했어요.');};
  function confirm(kind){pending=kind;$('#deletePrompt').textContent=p.emoji+' '+p.name+(kind==='clear'?'의 모든 학습 기록을 지울까요?':' 프로필과 모든 학습 기록을 삭제할까요?');$('#deleteConfirm').hidden=false;$('#cancelDelete').focus();}
  $('#clearProfile').onclick=()=>confirm('clear');$('#deleteProfile').onclick=()=>confirm('remove');
  $('#cancelDelete').onclick=()=>{pending=null;$('#deleteConfirm').hidden=true;$('#clearProfile').focus();};
  $('#confirmDelete').onclick=()=>{if(pending)run(()=>store[pending](),'지웠어요. 다른 프로필의 기록은 그대로예요.');};
 }
 $('#profileNav').onclick=()=>{render();dialog.showModal();document.body.classList.add('modal-open');};
 dialog.addEventListener('close',()=>{readSequence++;pending=null;importText=null;$('#profileNav').focus();});
 window.addEventListener('storage',e=>{if(e.key===ClassroomStorage.KEY||e.key===null){$('#profileStatus').textContent='다른 탭의 기록이 바뀌었어요. 기록을 파일로 저장한 뒤 새로고침해 주세요.';}});
 window.refreshClassroomStatus=()=>{$('#profileStatus').textContent=store.issue()||'현재 '+store.current().emoji+' '+store.current().name+'의 기록입니다.';};
 sync();
})();
