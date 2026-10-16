/* LabCheck core: simulator, error injection, benchmark, taxonomy. No DOM. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const COLHEX={buffer:'#40aaff',dye:'#ff468c',sample:'#ffaa32'},COL={buffer:[64,170,255],dye:[255,70,140],sample:[255,170,50]},CSS={buffer:'var(--buf)',dye:'var(--dye)',sample:'var(--sam)'};

const S0={buffer:1000,dye:40,sample:120},CTRL={A1:'negative',A12:'positive'};

const DEF={stock:S0,dead:0,pmin:20,pmax:300,cap:200,rows:'ABCDEFGH',cols:12,ctrl:CTRL};
const ROWS='ABCDEFGH',X=i=>46+i*52,Y=i=>44+i*50;

function sim(steps,cfg=DEF){
 const wellOk=w=>{const m=/^([A-Z])(\d+)$/.exec(String(w));return !!m&&cfg.rows.includes(m[1])&&+m[2]>=1&&+m[2]<=cfg.cols};
 const stock={...cfg.stock},wells={},frames=[];
 for(const [i,r,w,v] of steps){
  const errs=[],valid=wellOk(w);
  if(!(r in stock))errs.push(['UNKNOWN_REAGENT',`${r} is not declared in reagents`]);
  else{stock[r]-=v;if(stock[r]<0)errs.push(['REAGENT_EMPTY',`${r} is short by ${-stock[r]} µL`]);else if(stock[r]<(cfg.dead||0))errs.push(['DEAD_VOLUME',`${r} is left with ${stock[r]} µL, below its ${cfg.dead} µL dead volume`])}
  if(v<cfg.pmin||v>cfg.pmax)errs.push(['PIPETTE_RANGE',`${v} µL is outside the ${cfg.pmin}–${cfg.pmax} µL pipette range`]);
  if(!valid)errs.push(['WELL_MISSING',`${w} does not exist on this plate`]);
  else{const o=wells[w]||(wells[w]={v:0,c:[0,0,0]});o.v+=v;const c=COL[r]||[120,130,140];o.c=o.c.map((x,k)=>x+c[k]*v);if(o.v>cfg.cap)errs.push(['WELL_OVERFLOW',`${w} would hold ${o.v} µL, max ${cfg.cap} µL`])}
  frames.push(cfg.nosnap?{i,r,w,v,errs,valid}:{i,r,w,v,errs,valid,stock:{...stock},wells:JSON.parse(JSON.stringify(wells))});
 }
 const miss=Object.entries(cfg.ctrl).filter(([w])=>!wells[w]).map(([w,t])=>['CONTROL_MISSING',`${t} control ${w} is never dispensed into`,w]);
 return{frames,miss}}

function prng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

const TYPES=['PIPETTE_RANGE','REAGENT_EMPTY','WELL_OVERFLOW','WELL_MISSING','CONTROL_MISSING'];

function mutate(type,base,rnd){
 const s=base.map(x=>x.slice()),pick=a=>a[Math.floor(rnd()*a.length)];
 if(type==='PIPETTE_RANGE'){pick(s)[3]=rnd()<.5?1+Math.floor(rnd()*18):301+Math.floor(rnd()*100)}
 if(type==='REAGENT_EMPTY'){pick(s.filter(y=>y[1]==='dye'))[3]=45+Math.floor(rnd()*250)}
 if(type==='WELL_OVERFLOW'){pick(s.filter(y=>y[1]==='buffer'))[3]=300}
 if(type==='WELL_MISSING'){pick(s)[2]=pick(['I1','A13','J4','H0','K12'])}
 if(type==='CONTROL_MISSING'){const c=pick(['A1','A12']);return s.filter(y=>y[2]!==c)}
 return s}

const codes=st=>{const r=sim(st);return[...r.frames.flatMap(f=>f.errs.map(e=>e[0])),...r.miss.map(e=>e[0])]};
/* plate */

const protoSteps=p=>p.steps.map((s,i)=>[i+1,s.from,String(s.to).toUpperCase(),s.ul]);

const protoCfg=p=>({stock:{...p.reagents},pmin:p.pipette?.min??20,pmax:p.pipette?.max??300,cap:p.well_capacity??200,dead:+(p.dead_volume||0),rows:(p.plate||96)===96?'ABCDEFGH':'ABCDEFGHIJKLMNOP',cols:(p.plate||96)===96?12:24,ctrl:p.controls||{}});

const GCFG={stock:{buffer:4000,sample:800,dye:400},dead:0,pmin:20,pmax:300,cap:200,rows:'ABCDEFGH',cols:12,ctrl:CTRL,nosnap:true},ALLW=[];
for(const r of ROWS)for(let c=1;c<=12;c++)ALLW.push(r+c);

const codesOf=(st,cfg)=>{const r=sim(st,cfg);return[...r.frames.flatMap(f=>f.errs.map(e=>e[0])),...r.miss.map(e=>e[0])]};

function genProto(rnd){const used={},stock={...GCFG.stock},steps=[],names=Object.keys(stock),n=8+Math.floor(rnd()*17);let g=0;
 while(steps.length<n&&g++<600){const w=steps.length<2?['A1','A12'][steps.length]:ALLW[Math.floor(rnd()*ALLW.length)],r=names[Math.floor(rnd()*names.length)],mx=Math.min(120,GCFG.cap-(used[w]||0),stock[r]);
  if(mx<20)continue;const v=20+5*Math.floor(rnd()*((mx-20)/5+1));steps.push([steps.length+1,r,w,v]);used[w]=(used[w]||0)+v;stock[r]-=v}
 return steps}

function inject(type,steps,cfg,rnd,taken){
 const s=steps.map(x=>x.slice()),c2={...cfg,stock:{...cfg.stock}},pick=a=>a[Math.floor(rnd()*a.length)];
 const one=()=>{const a=s.map((_,i)=>i).filter(i=>!taken.has(i)),i=pick(a.length?a:s.map((_,i)=>i));taken.add(i);return s[i]};
 if(type==='PIPETTE_RANGE')one()[3]=rnd()<.5?1+Math.floor(rnd()*18):301+Math.floor(rnd()*100);
 else if(type==='REAGENT_EMPTY'){const u={};s.forEach(x=>u[x[1]]=(u[x[1]]||0)+x[3]);const r=pick(Object.keys(u));c2.stock[r]=Math.max(0,u[r]-1-Math.floor(rnd()*20))}
 else if(type==='WELL_OVERFLOW')one()[3]=300;
 else if(type==='WELL_MISSING')one()[2]=pick(['I1','A13','J4','H0','K12','Z9']);
 else if(type==='CONTROL_MISSING'){const c=pick(['A1','A12']);return{steps:s.filter(y=>y[2]!==c),cfg:c2}}
 else if(type==='WRONG_REAGENT'){const x=one();x[1]=pick(Object.keys(GCFG.stock).filter(q=>q!==x[1]))}
 else if(type==='WRONG_WELL'){const x=one();x[2]=pick(ALLW.filter(w=>w!==x[2]))}
 return{steps:s,cfg:c2}}

const SCOPE=['PIPETTE_RANGE','REAGENT_EMPTY','WELL_OVERFLOW','WELL_MISSING','CONTROL_MISSING'],OUT=['WRONG_REAGENT','WRONG_WELL'];

function wilson(c,n){if(!(n>0))return[0,1];c=Math.min(Math.max(c,0),n);const z=1.96,p=c/n,d=1+z*z/n,m=p+z*z/(2*n),a=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n));return[Math.max(0,(m-a)/d),Math.min(1,(m+a)/d)]}

function bench2(n,seed){
  const bases=[];{const rg=prng(seed);for(let i=0;i<n;i++)bases.push(genProto(rg))}
  const shuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const single=[...SCOPE,...OUT].map((t,ti)=>{let hit=0;const conf={},r=prng(seed*100003+ti*7919+11);
   for(const b of bases){const rj=inject(t,b,GCFG,r,new Set()),cs=new Set(codesOf(rj.steps,rj.cfg));cs.forEach(c=>conf[c]=(conf[c]||0)+1);if(!cs.size)conf.none=(conf.none||0)+1;if(SCOPE.includes(t)?cs.has(t):cs.size)hit++}
   return{t,n,hit,conf,scope:SCOPE.includes(t)}});
  const order=['CONTROL_MISSING','PIPETTE_RANGE','WELL_OVERFLOW','WELL_MISSING','REAGENT_EMPTY'];
  const combos=[2,3].map((k,ki)=>{let hit=0;const r=prng(seed*100003+999*ki+5);for(const b of bases){const ch=shuffle([...order],r).slice(0,k).sort((x,y)=>order.indexOf(x)-order.indexOf(y));let st=b,cfg=GCFG;const tk=new Set();
   for(const t of ch){const rj=inject(t,st,cfg,r,tk);st=rj.steps;cfg=rj.cfg}const cs=new Set(codesOf(st,cfg));if(ch.every(t=>cs.has(t)))hit++}return{k,n,hit}});
 let fp=0,tot=0;const sizes={};for(const b of bases){if(codesOf(b,GCFG).length)fp++;sizes[b.length]=(sizes[b.length]||0)+1;tot+=b.reduce((a,x)=>a+x[3],0)}
 return{single,combos,fp,n,sizes,meanSteps:bases.reduce((a,b)=>a+b.length,0)/n,meanUl:tot/n}}

const wxy=w=>{const m=/^([A-Z])(\d+)$/.exec(String(w||''));if(!m)return{ci:12,ri:8,oob:true};return{ci:Math.min(Math.max(+m[2]-1,0),12),ri:ROWS.includes(m[1])?ROWS.indexOf(m[1]):8,oob:!ROWS.includes(m[1])}};

let sid=0;

function splash(sel,x,y,c,bad){const svg=$(sel);if(!svg||!svg.insertAdjacentHTML)return;const id='sp'+(++sid);
 svg.insertAdjacentHTML('beforeend',`<g id="${id}"><circle class="drop" cx="${x}" cy="${y}" r="4.5" fill="${c}"/><circle class="rip" cx="${x}" cy="${y}" r="9" fill="none" stroke="${bad?'#ff7a63':c}" stroke-width="2"/></g>`);
 setTimeout(()=>{const e=document.getElementById(id);e&&e.remove()},1000)}

function pop(el,kind){el.classList.remove('pop-pass','pop-fail');void el.offsetWidth;el.classList.add('pop-'+kind)}
/* analysis */

const TAX=[
 {v:'PIP −1 (19 µL)',d:'one below the 20 µL minimum',e:'PIPETTE_RANGE',f(s,r){s[Math.floor(r()*s.length)][3]=19}},
 {v:'PIP +1 (301 µL)',d:'one above the 300 µL maximum',e:'PIPETTE_RANGE',f(s,r){s[Math.floor(r()*s.length)][3]=301}},
 {v:'Zero volume (0 µL)',d:'a step that moves nothing',e:'PIPETTE_RANGE',f(s,r){s[Math.floor(r()*s.length)][3]=0}},
 {v:'Huge volume (5000 µL)',d:'far above range, stock and well',e:'PIPETTE_RANGE',f(s,r){s[Math.floor(r()*s.length)][3]=5000}},
 {v:'Stock exactly spent',d:'tube ends at 0 µL — must pass',e:'none',f(s,r,cfg){const u={};s.forEach(x=>u[x[1]]=(u[x[1]]||0)+x[3]);const ks=Object.keys(u);const k=ks[Math.floor(r()*ks.length)];cfg.stock[k]=u[k]}},
 {v:'Stock short by 1 µL',d:'one microlitre overdrawn',e:'REAGENT_EMPTY',f(s,r,cfg){const u={};s.forEach(x=>u[x[1]]=(u[x[1]]||0)+x[3]);cfg.stock[Object.keys(u)[0]]=u[Object.keys(u)[0]]-1}},
 {v:'Well exactly at cap',d:'200 µL in one well — must pass',e:'none',f(s,r){const used=new Set(s.map(x=>x[2]));const empt=ALLW.filter(w=>!used.has(w));const w=empt[Math.floor(r()*empt.length)];s.push([s.length+1,'buffer',w,200])}},
 {v:'Well 5 over cap',d:'205 µL in one well',e:'WELL_OVERFLOW',f(s,r){const used=new Set(s.map(x=>x[2]));const empt=ALLW.filter(w=>!used.has(w));const w=empt[Math.floor(r()*empt.length)];s.push([s.length+1,'buffer',w,205])}},
 {v:'Lowercase well (b1)',d:'wrong case in a well name',e:'WELL_MISSING',f(s,r){s[Math.floor(r()*s.length)][2]='b1'}},
 {v:'Column zero (A0)',d:'column 0 does not exist',e:'WELL_MISSING',f(s,r){s[Math.floor(r()*s.length)][2]='A0'}},
 {v:'Both controls dropped',d:'no step targets A1 or A12',e:'CONTROL_MISSING',f(s){return s.filter(y=>y[2]!=='A1'&&y[2]!=='A12')}},
 {v:'Duplicated step',d:'same transfer twice — incidental',e:'any',f(s,r){const x=s[Math.floor(r()*s.length)];s.push([s.length+1,x[1],x[2],x[3]])}},
 {v:'Swapped wells',d:'two steps trade wells — incidental',e:'any',f(s,r){const a=Math.floor(r()*s.length);let b=Math.floor(r()*s.length);if(b===a)b=(b+1)%s.length;const t=s[a][2];s[a][2]=s[b][2];s[b][2]=t}},
 {v:'Dead-volume edge',d:'49 left with dead = 50 (opt-in)',e:'DEAD_VOLUME',f(s,r,cfg){cfg.dead=50;const u=s.filter(x=>x[1]==='buffer').reduce((a,x)=>a+x[3],0);cfg.stock.buffer=u+49}},
 {v:'Dead-volume exact',d:'50 left with dead = 50 — must pass',e:'none',f(s,r,cfg){cfg.dead=50;const u={};s.forEach(x=>u[x[1]]=(u[x[1]]||0)+x[3]);for(const k in u)cfg.stock[k]=u[k]+50}}];

function taxRun(bases,seed){return TAX.map((t,ti)=>{const r=prng(seed*100003+ti*7919+101);let hit=0;const cc={};
  for(const b of bases){const s=b.map(x=>x.slice()),cfg={...GCFG,stock:{...GCFG.stock}};const rep=t.f(s,r,cfg);const cs=new Set(codesOf(rep||s,cfg));
   if(t.e==='none'||t.e==='any'){if(cs.size)hit++}else if(cs.has(t.e))hit++;cs.forEach(c=>cc[c]=(cc[c]||0)+1)}
  return{...t,n:bases.length,hit,cc}})}
