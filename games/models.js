// Simplified classroom models; no live prices or forecasts.
(function(){
 const models={
  interest:p=>({value:p.principal+p.weeks*p.rate,label:'사탕 합계',unit:'개',detail:'원래 사탕 '+p.principal+'개 + 매주 '+p.rate+'개 × '+p.weeks+'주'}),
  'savings-goal':p=>({value:Math.ceil(Math.max(0,p.goal-p.saved)/p.weekly),label:'목표까지 필요한 기간',unit:'주',detail:'목표에서 모은 돈을 빼고, 주마다 모을 돈으로 나눠 올림해요.'}),
  loan:p=>({value:p.principal*(1+p.rate/100*p.years),label:'갚을 놀이 돈',unit:'원',detail:'원금 '+p.principal+'원 + 단리 이자 '+Math.round(p.principal*p.rate/100*p.years)+'원. 수수료 없는 가정이에요.'}),
  'price-demand':p=>{const customers=Math.max(0,Math.round(p.demand-p.price/p.sensitivity));return {value:p.price*customers,label:'판매액',unit:'원',detail:'가상의 손님 '+customers+'명 × 가격 '+p.price+'원. 판매액은 비용을 빼기 전이에요.'};},
  competition:p=>({value:Math.max(p.cost,p.base-p.shops*p.discount),label:'가상 시장 가격',unit:'원',detail:'경쟁 가게 '+p.shops+'개일 때의 단순 가정이에요. 실제 가격은 품질·비용 등에도 달려요.'}),
  rate:p=>({value:p.loan*p.rate/100,label:'대출의 연 이자',unit:'원',detail:'같은 금리에서 저축의 연 이자는 '+Math.round(p.savings*p.rate/100)+'원이에요. 이자가 붙는 방향을 비교해요.'}),
  inflation:p=>({value:Math.floor(p.budget/(p.price*(1+p.inflation/100))),label:'살 수 있는 수',unit:'개',detail:'물건 한 개의 값은 '+Math.round(p.price*(1+p.inflation/100))+'원이에요. 같은 예산으로 비교해요.'}),
  exchange:p=>({value:p.dollars*p.exchange,label:'원화로 바꾼 가격',unit:'원',detail:p.dollars+'놀이 달러 × 1달러당 '+p.exchange+'원. 수수료 없는 가정이에요.'}),
  trade:p=>({value:Math.min(p.apples-p.exchange,p.exchange*p.ratio)+Math.min(p.pears-p.exchange*p.ratio,p.exchange),label:'두 마을의 과일 꾸러미 합계',unit:'묶음',detail:'한 묶음은 사과 1개와 배 1개예요. A마을: 사과 '+(p.apples-p.exchange)+'·배 '+p.exchange*p.ratio+', B마을: 사과 '+p.exchange+'·배 '+(p.pears-p.exchange*p.ratio)+'. 교환 전에는 각 마을에 한 종류만 있어요.'})
 };
 window.EcoModels={calculate:(name,params)=>{if(!models[name])throw Error('Unknown model');const r=models[name](params);if(!Number.isFinite(r.value)||r.value<0)throw Error('Invalid model input');return r;},names:Object.keys(models)};
})();
