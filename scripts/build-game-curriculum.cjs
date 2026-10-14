const fs=require('fs'),vm=require('vm');const s=vm.runInNewContext(fs.readFileSync('catalog.js','utf8')+';STORIES'),examples=JSON.parse(fs.readFileSync('production/game-examples.json','utf8'));const clone=x=>JSON.parse(JSON.stringify(x)),get=id=>s.find(x=>x.id===id);
const source=JSON.parse(fs.readFileSync('production/game-curriculum-source.json','utf8'));s.forEach(story=>story.game=clone(source[story.id]));
const simulations={'g2-12':'savings-goal','g3-12':'loan','g3-14':'interest','g5-01':'price-demand','g5-03':'competition','g5-11':'rate','g5-12':'inflation','g6-01':'trade','g6-03':'exchange'};
for(const [id,model]of Object.entries(simulations))get(id).game=clone(examples.find(g=>g.model===model));
const missions={'g2-05':'두 번의 소풍에서 물을 담아 마실 물병을 준비해요. 튼튼함과 값을 비교해요.','g2-14':'새 공책을 준비하고 목표 저축도 지켜요. 갑작스러운 지출에 대비해요.','g3-01':'종이 10장으로 학급 꾸미기와 감사 인사를 모두 준비해요.','g3-04':'식물의 자람을 오래 기록할 공책을 골라요.','g3-05':'친구들이 먹고 마실 것을 준비하고 예상 밖 지출에 쓸 돈도 남겨요.','g4-15':'준비물과 목표 저축을 챙기고 갑자기 생길 비용에도 대비해요.','g6-08':'비를 피할 우산 대여소를 열어요. 보관·수리·이용 안내까지 계획해요.'};
for(const story of s)if(story.game.type==='budget'){
 const old=story.game;story.game={type:'shop',title:old.title,mission:missions[story.id],unit:story.id==='g3-01'?'종이 장':'놀이 원',budget:old.budget,items:old.items.map(([name,price])=>({name,price,tag:old.need.includes(name)?'need-'+old.need.indexOf(name):'extra',icon:'◇',description:name.includes('저축')?'나중의 목표를 위해 보관':name.includes('여유')?'뜻밖의 지출에 대비':'목적에 맞는 쓰임을 비교해요.'})),requirements:old.need.map((_,i)=>'need-'+i),events:[],wrapUp:'목적에 맞는 쓰임을 채우고 포기한 선택의 가치를 돌아봤어요.'};
 while(story.game.items.length<6)story.game.items.push({name:story.game.items.length===4?'꾸미기 리본':'모형 장식',price:Math.max(1,Math.round(old.budget*.3)),tag:'extra',icon:'🎀',description:'겉모습을 꾸밀 수 있어요.'});
}
get('g2-05').game={type:'shop',title:'물병의 값과 쓰임',mission:missions['g2-05'],unit:'놀이 원',budget:1500,requirements:['bottle'],items:[{name:'튼튼한 물병 한 개',price:1200,tag:'bottle',icon:'💧',description:'오래 씻어서 다시 쓰는 물병'},{name:'얇은 물병 두 개',price:1000,tag:'bottle',icon:'💧',description:'값은 낮지만 쉽게 찌그러질 수 있어요.'},{name:'물병 꾸미기',price:500,tag:'extra',icon:'⭐',description:'물병에 붙일 장식'},{name:'보관 주머니',price:300,tag:'extra',icon:'▣',description:'물병을 담을 주머니'},{name:'간식',price:700,tag:'extra',icon:'🍪',description:'소풍 때 먹을 간식'},{name:'장난감',price:900,tag:'extra',icon:'🧸',description:'놀이에 쓰는 물건'}],events:[],reflect:'값과 오래 쓸 수 있는 정도 중 무엇을 더 살폈나요?',wrapUp:'가장 싼 것만 고르지 않고 쓰임과 품질을 함께 비교했어요.'};
get('g2-14').game.events=[{budgetDelta:-300,text:'예상하지 못한 준비물에 300놀이 원이 들었어요.'}];
get('g4-15').game.events=[{budgetDelta:-2000,text:'운동회 준비에 2000놀이 원을 썼어요.'}];
get('g3-03').game={type:'shop',title:'체험표 한 장의 선택',mission:'표 한 장으로 가장 해 보고 싶은 체험 하나를 골라요.',unit:'체험표',budget:1,requirements:['experience'],items:['그림 그리기','축구 교실','책 만들기','텃밭 가꾸기','악기 체험','과학 놀이'].map((name,i)=>({name,price:1,tag:'experience',icon:['🎨','⚽','📖','🌱','♪','◇'][i],description:'한 장으로 한 가지 체험을 할 수 있어요.'})),events:[],reflect:'고르지 못한 것 중 가장 아쉬운 체험은 무엇이고 왜 그런가요?',wrapUp:'고른 체험을 얻는 대신 다른 체험을 포기했어요. 가장 아쉬운 대안의 가치가 기회비용이에요.'};
for(const [id,rows,extra]of [
 ['g4-11',[['월요일 용돈',3000,0,0],['화요일 간식',0,700,0],['수요일 연필',0,500,0]],{}],
 ['g4-12',[['용돈 받기',2000,0,0],['공책 구입',0,600,0],['저금통에 옮기기',0,0,1000]],{classify:true}],
 ['g4-13',[['월요일 준비물',0,800,0],['기록을 놓친 수요일 간식',0,500,0],['금요일 용돈',1500,0,0]],{}],
 ['g4-14',[['월요일 용돈',3000,0,0],['화요일 간식',0,1200,0],['목요일 책',0,1500,0],['금요일 저축',0,0,1000]],{}]
])get(id).game={type:'ledger',title:get(id).title+' 기록판',mission:'각 날짜의 흐름을 적고 지갑의 잔액을 확인해요.',start:2000,rows:rows.map(([memo,income,out,save])=>({memo,in:income,out,save})),...extra,wrapUp:'기록에서 실제로 쓴 돈을 찾아 다음 주의 선택을 계획했어요.'};
const cases={
 'g4-09':['쉬는 시간이 사라진 가상 일터예요.','일을 멈추고 휴식 약속을 확인한다','참고 쉬지 않는다','피로가 쌓이면 안전하게 일하기 어려워요.','다 함께 지킬 휴식 시간을 의논해요.','정한 시간을 표시하고 실제로 지키는지 살핀다','말로만 약속하고 표시는 지운다','확인할 방법이 있어야 약속을 지키기 쉬워요.','휴식과 안전을 함께 지키는 계획을 만들었어요.'],
 'g5-08':['모의 작업장 통로에 상자가 쌓였어요.','작업을 멈추고 교사에게 알린다','보호 장비만 쓰고 지나간다','장비만으로 막힌 통로의 위험이 사라지지 않아요.','교사가 통로와 도구를 함께 살피자고 해요.','환경을 고치고 안전 절차를 확인한다','빨리 끝내기만 약속한다','위험한 환경을 먼저 고쳐야 해요.','환경·교육·휴식을 함께 살피는 안전 계획을 세웠어요.'],
 'g5-15':['가상 메시지: 비밀로 하고 지금 인증번호를 보내!', '연락을 멈추고 보호자에게 알린다','급하니 번호부터 보낸다','인증번호를 넘기면 내 정보를 지키기 어려워요.','가족을 아는 사람이라고 다시 말해요.','내가 알던 공식 연락처로 따로 확인한다','메시지 속 링크로 들어간다','상대가 준 링크도 가짜일 수 있어요.','멈춤·도움 요청·별도 확인으로 위험을 피했어요.'],
 'g6-06':['모의 계약서에 업무만 있고 시간과 임금은 비어 있어요.','빈 조건을 질문하고 서명을 미룬다','멋진 직함만 보고 서명한다','무엇을 약속하는지 모르면 판단할 수 없어요.','가상 담당자가 나중에 쓰자고 해요.','조건을 적고 이해한 뒤 교사와 검토한다','서명한 뒤 기억에 의존한다','글로 확인할 내용이 있어야 서로 같은 약속을 이해해요.','모르는 조건을 확인하고 충분히 검토하는 선택을 했어요.'],
 'g6-11':['가상 기록판에 지난 상환 약속이 표시돼요.','기한을 지킨 거래 기록을 살핀다','점수로 사람의 착함을 정한다','금융 기록으로 사람 전체의 가치를 정할 수 없어요.','실제로 지킨 약속이 잘못 표시됐어요.','자료를 모아 공식 절차로 오류를 확인한다','틀린 기록을 그대로 받아들인다','정확하지 않은 정보는 확인하고 바로잡아야 해요.','약속 이행과 정보의 정확성을 살폈어요. 사람의 가치는 점수가 아니에요.'],
 'g6-12':['놀이 돈 납부일이 내일인데 달력에 빠져 있어요.','날짜와 금액을 적고 잔액을 확인한다','내일 기억날 거라 믿고 둔다','기억만 믿으면 기한을 놓칠 수 있어요.','준비한 돈이 약속한 금액보다 적어요.','보호자와 담당자에게 미리 도움을 요청한다','아무에게도 말하지 않는다','어려움을 일찍 알리면 해결 방법을 함께 찾을 수 있어요.','기한·금액·준비 상황을 함께 관리했어요.'],
 'g6-14':['가상 제안: 오늘만 가능하고 손해는 절대 없대요.','결정을 멈추고 조건과 근거를 묻는다','놓칠까 봐 바로 약속한다','서두르게 하는 말만으로 안전함을 판단할 수 없어요.','설명자가 비용 질문을 피하고 있어요.','공식 정보와 다른 대안을 비교한다','좋은 말만 믿고 선택한다','비용과 위험을 모르면 비교할 수 없어요.','급한 권유보다 목적·위험·비용·근거를 먼저 확인했어요.']
};
for(const [id,c]of Object.entries(cases))get(id).game={type:'scenario',title:get(id).title+' 선택 연습',mission:'가상 상황에서 다음 행동과 그 결과를 살펴요.',start:'start',nodes:{start:{text:c[0],choices:[{label:c[2],next:'start',retry:true,feedback:c[3]},{label:c[1],next:'next',feedback:'판단에 필요한 확인을 먼저 했어요.'}]},next:{text:c[4],choices:[{label:c[5],next:'end',feedback:c[8]},{label:c[6],next:'next',retry:true,feedback:c[7]}]},end:{text:c[8],end:true}},wrapUp:c[8]};
get('g5-13').game={type:'portfolio',title:'여행 전의 가상 배분',tokens:8,assets:['변화가 작은 A','변화가 큰 B'],rounds:[[0,3],[0,-4],[-1,-2]],note:'곧 쓸 여행 돈이라고 가정해요. 실제 상품과 다른 고정 실험이에요.',wrapUp:'쓸 시점이 가까운 돈은 손실 가능성과 필요한 때를 함께 살펴야 해요.'};
const extraPairs={
 'g4-04':[['상품 정보','고객의 선택을 돕는 설명'],['거래 약속','서로 지킬 조건']],
 'g1-02':[['1000원','천 원'],['5000원','오천 원']], 'g1-04':[['물건 고치기','고장 난 곳을 손봐 사용'],['받기 전 물어보기','상대가 원하는지 확인']],
 'g1-08':[['학교 버스 운전','안전하게 데려다줌'],['보건실 도움','몸이 아플 때 살핌']], 'g1-10':[['잃은 물건 찾아 주기','주인이 다시 쓸 수 있음'],['바닥 물 닦기','미끄러짐을 막음']],
 'g2-06':[['세탁소','옷 세탁 도움'],['서점','읽을 책 판매']], 'g2-07':[['미용','머리 손질 기술'],['요리','재료와 위생 관리']],
 'g2-08':[['간호사','건강 상태 돌보기'],['건축가','건물 설계하기']], 'g2-09':[['합의한 지급일','언제 받을지 정한 날'],['안전한 환경','다치지 않도록 갖춘 조건']],
 'g3-06':[['품질 검사','상품 상태 확인'],['포장 설계','안전하게 담을 방법 마련']], 'g3-10':[['돌봄 시설','서로의 생활을 돌봄'],['대중교통','사람의 이동을 도움']],
 'g3-11':[['수수료','서비스 이용에 드는 비용'],['거래 내역','돈이 드나든 기록']], 'g4-05':[['가격 비교','여러 조건을 함께 살핌'],['상품 설명','품질과 쓰임 정보']],
 'g4-06':[['비용','만들고 파는 데 든 돈'],['손실','매출보다 비용이 큰 경우']], 'g4-10':[['돌봄 노동','서로의 생활 지원'],['교육','배움의 기회 제공']],
 'g5-05':[['소비 감소의 영향','기업의 판매 변화 가능'],['기업의 설비 투자','생산에 쓸 시설 마련']],
 'g6-07':[['사용자 의견','해결이 도움이 되는지 확인'],['책임','안전과 영향을 함께 살핌']], 'g6-13':[['인증정보 보호','비밀번호를 남에게 주지 않음'],['디지털 서비스 비용','수수료와 조건 확인']]
};
const orderAdd={
 'g1-03':['지갑에 넣을 것을 살펴보기','완성한 지갑을 정한 곳에 두기'],'g1-07':['주변에 위험한 것이 없는지 살피기','함께한 어른에게 끝났다고 알리기'],'g1-09':['화분에 필요한 돌봄 관찰하기','다음 차례를 달력에 표시하기'],'g1-12':['모을 돈의 주인을 확인하기','저금통을 안전한 곳에 두기'],'g1-14':['노래할 자리 정리하기','쓴 놀이 동전을 모아 두기'],'g1-15':['왜 모으고 싶은지 생각하기','정한 날에 약속 다시 살피기'],
 'g2-01':['목록을 적을 종이 준비하기','남은 욕구의 순서 정하기'],'g2-10':['내가 즐겼던 경험 떠올리기','친구의 질문 듣고 꿈 보태기'],'g2-15':['기록할 날짜 확인하기','실천표를 정한 곳에 보관하기'],
 'g3-02':['해결할 문제를 한 문장으로 쓰기','다음 선택에 쓸 기준 남기기'],'g3-08':['알고 싶은 직업 정하기','인터뷰 뒤 확인할 질문 점검하기'],'g3-15':['통장에서 읽을 정보 살펴보기','입출금과 합계 다시 대조하기'],
 'g4-01':['필요한 재료와 수량 정하기','완성품 보관 상태 확인하기'],'g4-02':['상품과 목적지 확인하기','받은 뒤 수량과 상태 확인하기'],'g4-08':['배울 직업의 역할 살펴보기','다음 체험에서 고칠 점 정하기'],
 'g5-09':['의견을 낼 안전한 방법 마련하기','다음 점검 시기 함께 정하기'],'g6-04':['알릴 대상과 목적 정하기','받은 질문에 근거로 답하기'],'g6-09':['해결하려는 불편 정리하기','반응을 보고 설명을 개선하기'],'g6-10':['지금까지의 경험 정리하기','다음 탐색 날짜 정하기']
};
for(const story of s){const g=story.game;
 g.unit=g.unit||'놀이 단위';
 g.wrapUp=g.wrapUp||('「'+story.subtitle+'」의 문제를 새 선택에 적용했어요.');
 if(g.type==='match'){g.pairs.push(...extraPairs[story.id]);g.pairs=g.pairs.map(([a,b])=>[a,b,a+'의 뜻·쓰임은 '+b+'와 연결돼요.']);}
 if(g.type==='order'){const [before,after]=orderAdd[story.id];g.steps=[before,...g.steps,after];g.why=g.steps.map((step,i)=>i===0?'먼저 '+step+'부터 시작해야 다음 선택의 기준이 생겨요.':'이 단계 전에는 '+g.steps[i-1]+'가 먼저 필요해요.');}
 if(g.type==='sort'){
  if(story.grade>=5&&g.bins.length<3){g.bins.push(story.id==='g6-02'?'국내 거래':'추가 확인이 필요한 정보');g.cards.push(...(story.id==='g6-02'?[['국내 빵집이 국내 이웃에게 빵 판매',2],['국내 농가가 국내 가게에 채소 판매',2]]:[['한 사람의 이야기만 듣고 전체를 판단하려 함',2],['출처와 날짜가 빠진 자료를 전달받음',2]]));}
  g.cards=g.cards.map(([text,bin])=>[text,bin,bin===2&&g.bins[2]==='추가 확인이 필요한 정보'?'근거가 충분하지 않아 출처와 다른 자료를 더 살펴야 해요.':text+'은(는) '+g.bins[bin]+'의 기준에 해당해요.']);
 }
 if(g.type==='order')g.wrapUp=g.steps.length+'단계를 이어 준비부터 점검까지 완성했어요. '+g.steps[0]+'가 다음 행동의 출발점이었어요.';
 if(g.type==='match')g.wrapUp=g.pairs.length+'쌍의 뜻과 쓰임을 연결했어요. '+g.pairs[0][0]+'을(를) '+g.pairs[0][1]+'와 연결한 까닭을 활동에서도 설명해 보세요.';
 if(g.type==='sort')g.wrapUp=g.cards.length+'개 상황을 '+g.bins.join(' / ')+' 기준으로 나눴어요. 생활에서 비슷한 사례를 찾아봐요.';
 if(g.type==='coins'){g.mode='make';g.unit='놀이 원';g.wrapUp='서로 다른 놀이 돈 조각도 합계가 같으면 같은 값을 만들어요.';}
}
get('g1-13').game.mode='change';get('g1-13').game.payments=[500,500,500];
fs.writeFileSync('catalog.js','const STORIES = '+JSON.stringify(s,null,2)+';\n');
fs.writeFileSync('production/game-review.md','# 게임 교사 검수표\n\n자동 검사는 풀이 가능성만 확인합니다. 난도·표현·모형의 한계는 교사 검수 대기입니다.\n\n| 편 | 게임 | 유형 | 미션/결과 연결 | 검수 |\n|---|---|---|---|---|\n'+s.map(x=>'| '+x.id+' | '+x.game.title+' | '+x.game.type+(x.game.model?' / '+x.game.model:'')+' | '+x.game.wrapUp+' | 대기 |').join('\n')+'\n');
