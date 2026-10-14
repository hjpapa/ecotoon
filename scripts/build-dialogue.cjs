const fs=require('node:fs'),vm=require('node:vm');
const stories=vm.runInNewContext(fs.readFileSync('catalog.js','utf8')+';STORIES');
const source='production/dialogue-source.json';
if(!fs.existsSync(source))fs.writeFileSync(source,JSON.stringify(stories.map(s=>({id:s.id,panels:s.panels})),null,2)+'\n');
const originals=JSON.parse(fs.readFileSync(source,'utf8'));
const pauses=Object.fromEntries(fs.readFileSync('production/pause-prompts.txt','utf8').trim().split(/\r?\n/).map(line=>{const[id,question,...options]=line.split('|');return[id,{after:3,question,options,answer:null}]}));
const replacements={
 'g1-08:2:0':'지우: 고맙다는 말 뒤에는 뭘 쓸까?',
 'g1-15:5:1':'하린: 네가 지킨 첫 약속이라 멋진걸!',
 'g2-07:0:0':'지우: 바람만 넣으면 바로 탈 수 없을까?',
 'g1-03:7:1':'하린: 쓰고 나면 내 돈이 잘 있나 보자.',
 'g1-04:7:1':'하린: 쓰던 물건도 새 친구가 되네.',
 'g2-07:7:0':'지우: 천천히 살펴야 안전해지는구나.',
 'g2-08:3:1':'하린: 요리는 여자도 남자도 할 수 있잖아.',
 'g2-08:7:1':'하린: 누구나 여러 가지 일을 할 수 있어.',
 'g2-11:2:1':'하린: 나는 갑자기 필요한 물건에 쓰려고.',
 'g2-11:6:1':'하린: 모은 돈을 쓸 까닭도 중요하네.',
 'g2-14:7:1':'하린: 놀이에서 배워 계획을 고쳐 보자.',
 'g4-06:4:1':'하린: 월급은 임금의 한 형태이고 소득의 한 종류야.'
};
const guests={
 'g1-01':[3,'엄마: 돈의 숫자를 함께 읽어 보렴.'],
 'g1-04':[4,'엄마: 서로 바꾸어도 좋은지 물어보렴.'],
 'g1-12':[4,'보호자: 날카로운 곳은 내가 다듬을게.'],
 'g2-06':[3,'가게 주인: 궁금한 일을 하나씩 물어보렴.'],
 'g2-09':[3,'선생님: 일마다 필요한 수고가 다르단다.'],
 'g2-13':[3,'보호자: 잃어버리지 않을 곳을 함께 찾자.'],
 'g3-08':[5,'가게 주인: 먼저 내 대답을 끝까지 들어 주렴.'],
 'g4-02':[3,'선생님: 기다리는 동안 다른 준비도 확인하자.'],
 'g4-08':[3,'친구: 계산한 과정을 같이 살펴볼래?'],
 'g5-09':[3,'선생님: 서로의 요구를 듣는 과정도 중요해.'],
 'g5-15':[3,'보호자: 혼자 결정하지 말고 함께 확인하자.'],
 'g6-01':[3,'교환 친구: 우리에게 필요한 양도 말해 볼게.']
};
for(const s of stories){
 s.panels=JSON.parse(JSON.stringify(originals.find(x=>x.id===s.id).panels));
 s.panels.forEach((p,i)=>p.lines=p.lines.map((line,j)=>{
  let result=replacements[s.id+':'+i+':'+j]||line;
  // Keep one short spoken sentence: brief interjections become a comma clause.
  if(s.grade<=2)result=result.replace(/[.!?]\s+(?=\S)/g,', ');
  return result;
 }));
 if(s.id==='g1-03')s.panels[3].lines=[]; // The caption and fallen paper convey this silent beat.
 if(s.id==='g1-09')s.panels[0].lines=s.panels[0].lines.slice(0,1);
 if(guests[s.id]){const[i,line]=guests[s.id];s.panels[i].lines.push(line);}
 s.panels[7].lines.push('모아: '+s.terms[0]+', 어디에 써 볼까?');
 s.pause=pauses[s.id];
 s.teacher={minutes:30,objective:s.lesson,prompts:[s.pause.question,'이야기 속 '+s.terms[0]+'을 보여 주는 장면과 까닭은 무엇인가요?','생활에서 해 볼 작은 실천은 무엇인가요?']};
}
fs.writeFileSync('catalog.js','const STORIES = '+JSON.stringify(stories,null,2)+';\n');
fs.writeFileSync('production/dialogue-review.md','# 대사·멈춤 질문 교사 검수표\n\n모든 편은 교사 검수 대기입니다. 원본 스토리보드는 삽화 생성 당시 자료로 보존하며, 이 표가 현재 웹 대사를 기록합니다. 저학년 24자 이하 한 문장(20자 안팎), 중학년 30자, 고학년 35자 기준입니다. 질문은 정답을 매기지 않으며 이번 읽기 안에서만 선택을 유지합니다.\n\n'+stories.map(s=>'## '+s.id+' '+s.subtitle+'\n\n멈춤: '+s.pause.question+' / '+s.pause.options.join(' · ')+'\n\n'+s.panels.map((p,i)=>(i+1)+'. '+p.caption+'\n   '+(p.lines.join(' / ')||'(침묵)')).join('\n')+'\n\n검수: 대기\n').join('\n'));
