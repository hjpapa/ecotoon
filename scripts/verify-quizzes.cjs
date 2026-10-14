const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const stories=vm.runInNewContext(fs.readFileSync(path.join(root,'catalog.js'),'utf8')+';STORIES');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'glossary.js'),'utf8'),context);
const glossary=context.window.EcoGlossary;
const normalize=text=>text.replace(/[^\p{L}\p{N}]/gu,'');
const length=text=>[...text].length;
function similarity(a,b){
 const grams=text=>new Set([...normalize(text)].slice(1).map((_,i)=>normalize(text).slice(i,i+2)));
 const x=grams(a),y=grams(b),shared=[...x].filter(value=>y.has(value)).length;
 return x.size+y.size?2*shared/(x.size+y.size):0;
}
const questions=new Set();
for(const s of stories){
 const q=s.quiz,label=s.id;
 const limits=s.grade<=2?{question:50,option:18,explain:90,hint:75}:s.grade<=4?{question:65,option:28,explain:120,hint:90}:{question:80,option:38,explain:150,hint:100};
 assert.ok(['story','apply'].includes(q.kind),label+': kind');
 for(const field of ['question','explain','hint']){
  assert.equal(typeof q[field],'string',label+': '+field);
  assert.ok(q[field].trim()&&length(q[field])<=limits[field],label+': '+field+' length');
 }
 assert.ok(!questions.has(normalize(q.question)),label+': duplicate question');questions.add(normalize(q.question));
 assert.equal(q.options.length,3,label+': three options');
 assert.equal(new Set(q.options.map(normalize)).size,3,label+': distinct options');
 assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<3,label+': answer index');
 const sizes=q.options.map(option=>{
  assert.equal(typeof option,'string');assert.ok(option.trim()&&length(option)<=limits.option,label+': option length');return length(option);
 });
 assert.ok(Math.max(...sizes)/Math.min(...sizes)<=1.6,label+': length imbalance');
 const answer=q.options[q.answer],seed=normalize(s.lesson),answerText=normalize(answer);
 assert.ok(!seed.includes(answerText),label+': answer copied from seed');
 assert.ok(similarity(answer,s.lesson)<0.65,label+': seed/answer similarity');
 assert.ok(Number.isInteger(q.hintPanel)&&q.hintPanel>=0&&q.hintPanel<s.panels.length,label+': hint scene');
 assert.equal(s.recap.length,3,label+': recap count');
 assert.equal(new Set(s.recap).size,3,label+': distinct recap scenes');
 assert.ok(s.recap.every((n,i)=>Number.isInteger(n)&&n>=0&&n<s.panels.length&&(!i||n>s.recap[i-1])),label+': chronological recap');
 assert.ok(s.terms.length>=1&&s.terms.length<=2,label+': term count');
 for(const term of s.terms)assert.ok(typeof glossary[s.grade]?.[term]==='string'&&glossary[s.grade][term].trim(),label+': missing definition');
 const sentences=s.lesson.split(/[.!?。！？]+/).filter(v=>v.trim());
 assert.ok(sentences.length<=(s.grade<=2?1:2),label+': seed sentence count');
 if(s.grade<=2)assert.ok(!/아닌|않은|틀린|잘못된|옳지/.test(q.question),label+': negative low-grade question');
}
const distribution=[];
for(let grade=1;grade<=6;grade++){
 const group=stories.filter(s=>s.grade===grade),positions=[0,0,0];
 assert.equal(group.length,15);
 for(const s of group)positions[s.quiz.answer]++;
 assert.ok(positions.every(n=>n===5),'Grade '+grade+': balanced answers');
 const storyCount=group.filter(s=>s.quiz.kind==='story').length;
 assert.ok(storyCount>=5&&storyCount<=10,'Grade '+grade+': mixed story/application questions');
 const longest=group.filter(s=>s.quiz.options.every((o,i)=>i===s.quiz.answer||length(o)<length(s.quiz.options[s.quiz.answer]))).length;
 assert.ok(longest<=8,'Grade '+grade+': longest-answer bias');
 distribution.push({grade,positions,story:storyCount,apply:15-storyCount,uniqueLongest:longest});
}
const escape=text=>String(text).replace(/\|/g,'\\|').replace(/\n/g,'<br>');
const lines=['# WP3 개념 정리·퀴즈 교사 검수표','','자동 검사 통과는 교육적 타당성이나 교사 검수를 대신하지 않습니다. 아래 모든 문항은 **교사 검수 대기**입니다. 장면 번호는 화면과 같은 1부터, 데이터의 인덱스는 0부터 시작합니다.','','검사 기준: 1~2학년 질문 50자·선택지 18자, 3~4학년 65자·28자, 5~6학년 80자·38자 이하(공백 포함). 선택지 최장/최단 비율 1.6 이하, 씨앗-정답 정규화 2글자 묶음 Dice 유사도 0.65 미만, 학년별 정답 위치 5/5/5, 단독 최장 정답 8개 이하. 문장 수·힌트 장면·용어 참조도 검사합니다. 이는 이번 WP의 편집 기준이며 국가 교육과정의 수치 기준을 뜻하지 않습니다.','','재생성: `node scripts/verify-quizzes.cjs --write-review`. 검사만 실행하면 저장된 검수표가 최신인지도 확인합니다.',''];
lines.push('개념 교차 확인(2026-10-14): g3-03의 기회비용은 포기한 대안 중 가장 가치 있는 것이라는 [한국은행 설명](https://www.bok.or.kr/portal/bbs/B0000216/view.do?menuNo=200648&nttId=165599&pageIndex=&type=PEPL)을 참고했습니다. g5-06·g6-06의 계약과 권리는 기준 미달 근로조건의 효력을 정한 [근로기준법 제15조](https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0015&lsiSeq=285279&urlMode=lsScJoRltInfoR)와 대조했습니다. 다른 문항의 근거는 아래에 제시한 기존 웹툰 사건과 모의 조건입니다.','');
for(let grade=1;grade<=6;grade++){
 lines.push('## '+grade+'학년','', '| 편 | 질문 유형·질문 | 선택지 | 정답·해설 | 힌트·근거 장면 | 검수 |','|---|---|---|---|---|---|');
 for(const s of stories.filter(s=>s.grade===grade)){
  const q=s.quiz;
  lines.push('| '+[s.id+' '+s.title,q.kind+' · '+q.question,q.options.map((o,i)=>(i+1)+'. '+o).join('<br>'),(q.answer+1)+'번 · '+q.explain,(q.hintPanel+1)+'장면 · '+q.hint+'<br>근거: '+s.panels[q.hintPanel].lines.join(' / '),'대기'].map(escape).join(' | ')+' |');
 }
 lines.push('','### 정리 화면 검수','', '| 편 | 되짚기: 문제 → 선택 → 결과 | 경제 씨앗 | 핵심 용어 |','|---|---|---|---|');
 for(const s of stories.filter(s=>s.grade===grade))lines.push('| '+[s.id,s.recap.map(n=>(n+1)+'장면: '+s.panels[n].caption).join('<br>'),s.lesson,s.terms.map(t=>t+': '+glossary[grade][t]).join('<br>')].map(escape).join(' | ')+' |');
 lines.push('');
}
const review=lines.join('\n')+'\n',reviewPath=path.join(root,'production/quiz-review.md');
if(process.argv.includes('--write-review'))fs.writeFileSync(reviewPath,review);
else assert.equal(fs.readFileSync(reviewPath,'utf8').replace(/\r\n/g,'\n'),review,'Review table is stale; regenerate with --write-review');
console.log('PASS: 90 unique quizzes, recap/terms, grade length limits, answer/seed separation and position distribution.');
console.table(distribution);
