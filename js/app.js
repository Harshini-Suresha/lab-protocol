/* LabCheck app: page wiring — simulator display, validator, builder, results, analysis, atlas, navigation. */
function plateHTML(p,extra){let h='';
 for(let c=0;c<12;c++)h+=`<text class="axis" x="${X(c)}" y="22">${c+1}</text>`;
 ROWS.split('').forEach((r,ri)=>{h+=`<text class="axis" x="14" y="${Y(ri)+4}">${r}</text>`;
  for(let c=0;c<12;c++)h+=`<circle class="well" cx="${X(c)}" cy="${Y(ri)}" r="21"/><circle id="${p}-l-${r}${c+1}" cx="${X(c)}" cy="${Y(ri)}" r="19.5" fill="none" class="liq" style="transform:scale(0)"/>`});
 for(const w in CTRL)h+=`<circle class="ctrl" cx="${X(+w.slice(1)-1)}" cy="${Y(0)}" r="25"/>`;
 return h+extra}

const gaugeHTML=p=>Object.keys(S0).map(k=>`<div class="g"><div class="t"><span>${k}</span><span id="${p}-gv-${k}"></span></div><div class="tr"><i id="${p}-gb-${k}" style="background:${CSS[k]};width:100%"></i></div></div>`).join('');

function setGauges(p,st){for(const r in S0){const v=st[r];$('#'+p+'-gb-'+r).style.width=Math.max(0,v/S0[r]*100)+'%';const g=$('#'+p+'-gv-'+r);g.textContent=v<0?`short by ${-v} µL`:`${v} / ${S0[r]} µL`;g.style.color=v<0?'var(--fail)':''}}

function paintWells(p,wells){const red=getComputedStyle(document.documentElement).getPropertyValue('--fail').trim()||'#a3361c';
 for(const r of ROWS)for(let c=1;c<=12;c++){const id=r+c,e=$('#'+p+'-l-'+id),o=wells[id];
  if(o){const over=o.v>DEF.cap;e.style.transform=`scale(${over?1.08:Math.sqrt(o.v/DEF.cap)*.95})`;e.setAttribute('fill',`rgb(${o.c.map(x=>Math.round(x/o.v)).join(',')})`);e.setAttribute('stroke',over?red:'none');e.setAttribute('stroke-width',over?3:0)}
  else{e.style.transform='scale(0)';e.setAttribute('stroke','none')}}}
$('#plate').innerHTML=plateHTML('s',`<circle id="hi" r="25" cx="-50" cy="-50"/><g id="ghost" opacity="0"><circle r="21" fill="none" stroke="var(--fail)" stroke-width="1.5" stroke-dasharray="4 4"/><text class="axis" style="fill:var(--fail);font-size:15px" y="5">✕</text><text id="gt" class="axis" style="fill:var(--fail);font-size:11px" y="40"></text></g><circle id="mc" class="pulse" r="27" fill="none" stroke="var(--warn)" stroke-width="3" cx="-50" cy="-50" opacity="0"/><g id="head" style="transform:translate(-90px,-90px)"><path id="hp" d="M-8 -52h16v26l-5 24h-6l-5-24z" fill="#fff" opacity=".95"/><rect x="-10" y="-58" width="20" height="8" rx="3" fill="#fff" opacity=".5"/></g>`);
$('#gauges').innerHTML=gaugeHTML('s');

let drawTok=0,lastK=-1;

let proto={name:'Example protocol'},R=sim(FIXED),k=-1,timer=null;

function draw(){
 const f=R.frames[k];
 const tok=++drawTok,going=!!f&&k>lastK;lastK=k;
 const head=$('#head');
 if(f){const w=wxy(f.w);head.style.transform=`translate(${X(w.ci)}px,${Y(w.ri)-12}px)`;$('#hp').style.fill=COLHEX[f.r]||'#fff'}else head.style.transform='translate(-90px,-90px)';
 if(going)setTimeout(()=>{if(tok!==drawTok)return;paintWells('s',f.wells);const w=wxy(f.w);splash('#plate',X(w.ci),Y(Math.min(w.ri,8)),COLHEX[f.r]||'#fff',f.errs.length>0)},520);else paintWells('s',f?f.wells:{});
 const hi=$('#hi'),gh=$('#ghost'),mc=$('#mc');gh.setAttribute('opacity',0);hi.setAttribute('cx',-50);mc.setAttribute('opacity',0);
  if(f){const q=wxy(f.w),ci=Math.min(q.ci,12),ri=Math.min(q.ri,8);
   if(f.valid){hi.setAttribute('cx',X(ci));hi.setAttribute('cy',Y(ri))}
  else{gh.setAttribute('transform',`translate(${X(ci)},${Y(Math.min(ri,8))-4})`);gh.setAttribute('opacity',1);$('#gt').textContent=f.w+' not on plate'}}
 const st=f?f.stock:S0;
 setGauges('s',st);
 const done=k===R.frames.length-1;
 let li='';for(let j=0;j<=k;j++){const x=R.frames[j];li+=`<li class="${x.errs.length?'bad':''}">step ${x.i}: ${x.r} → ${x.w}, ${x.v} µL${x.errs.map(e=>`<small>${e[0]}: ${esc(e[1])}</small>`).join('')}</li>`}
 if(done)for(const m of R.miss)li+=`<li class="bad">end of run<small>${m[0]}: ${m[1]}</small></li>`;
 if(k<0)li='<li style="color:var(--mute)">Press Play.</li>';
 $('#log').innerHTML=li;$('#log').scrollTop=1e5;
 if(done&&R.miss.length){const w=R.miss[0][2];mc.setAttribute('cx',X(+w.slice(1)-1));mc.setAttribute('cy',Y(0));mc.setAttribute('opacity',1)}
 const n=R.frames.reduce((a,x)=>a+x.errs.length,0)+R.miss.length,v=$('#verdict');
 const showV=()=>{if(tok!==drawTok)return;v.textContent=!done?'':n?`FAILED: ${n} violation${n>1?'s':''}. Do not run this protocol.`:'PASSED: safe to execute.';v.style.color=n?'var(--fail)':'var(--pass)';if(done)pop(v,n?'fail':'pass')};
 if(going&&done)setTimeout(showV,720);else showV();
 $('#pname').textContent=proto.name}

function stop(){clearInterval(timer);timer=null;$('#play').textContent='Play'}

function adv(){if(k<R.frames.length-1){k++;draw()}if(k>=R.frames.length-1)stop()}
$('#play').onclick=()=>{if(timer)return stop();if(k>=R.frames.length-1)k=-1;$('#play').textContent='Pause';adv();if(k<R.frames.length-1)timer=setInterval(adv,1000)};
$('#stepb').onclick=()=>{stop();if(k>=R.frames.length-1)k=-1;adv()};
$('#reset').onclick=()=>{stop();k=-1;draw()};

function load(name,steps){stop();proto={name};R=sim(steps);k=-1;draw();$('#play').click()}

const P=[{n:'Example',s:()=>FIXED},...TYPES.map(t=>({n:'Inject '+t.toLowerCase().replace('_',' '),s:()=>mutate(t,FIXED,Math.random)}))];
$('#protos').innerHTML=P.map((p,i)=>`<button class="b" data-i="${i}">${p.n}</button>`).join('');
$$('#protos button').forEach(b=>b.onclick=()=>{const p=P[b.dataset.i];load(p.n==='Example'?'Example protocol':'Example + '+p.n.toLowerCase(),p.s())});

/* validator */

const EX_FAULT={plate:96,reagents:{buffer:1000,dye:40,sample:120},pipette:{min:20,max:300},well_capacity:200,controls:{A1:'negative',A12:'positive'},steps:FAULT.map(s=>({from:s[1],to:s[2],ul:s[3]}))};

const EX_FIXED={...EX_FAULT,steps:FIXED.map(s=>({from:s[1],to:s[2],ul:s[3]}))};

const fmt=o=>JSON.stringify(o,null,2).replace(/\{\s+"from": ("[^"]*"),\s+"to": ("[^"]*"),\s+"ul": ([\d.]+)\s+\}/g,'{"from": $1, "to": $2, "ul": $3}');
$('#vin').value=fmt(EX_FIXED);
$('#vfault').onclick=()=>{const t=TYPES[Math.floor(Math.random()*TYPES.length)],o={...EX_FIXED,steps:mutate(t,FIXED,Math.random).map(s=>({from:s[1],to:s[2],ul:s[3]}))};$('#vin').value=fmt(o);vrun()};$('#vfixed').onclick=()=>{$('#vin').value=fmt(EX_FIXED);vrun()};

function vrun(){
 const out=$('#vout'),bad=m=>out.innerHTML=`<p class="bad"><b>Could not read the protocol.</b> ${esc(m)}</p>`;
  let j;try{j=JSON.parse($('#vin').value)}catch(e){return bad(e.message)}
  if(!j||typeof j!=='object'||Array.isArray(j))return bad('The protocol must be a JSON object.');
  if(!j.reagents||typeof j.reagents!=='object'||Array.isArray(j.reagents)||!Object.keys(j.reagents).length)return bad('"reagents" must be an object such as {"buffer": 1000}.');
  for(const [k,v] of Object.entries(j.reagents)){if(typeof v!=='number'||!isFinite(v)||v<0)return bad(`Reagent "${k}" must be a starting volume in µL (a number ≥ 0).`)}
  if(!Array.isArray(j.steps)||!j.steps.length)return bad('"steps" must be a non-empty list.');
  if(j.steps.length>10000)return bad('"steps" has more than 10,000 entries; split the protocol before checking.');
  const plate=+(j.plate||96);if(![96,384].includes(plate))return bad('"plate" must be 96 or 384.');
  const pmin=j.pipette?.min??20,pmax=j.pipette?.max??300;
  if(typeof pmin!=='number'||typeof pmax!=='number'||!isFinite(pmin)||!isFinite(pmax)||pmin<0||pmax<=0||pmin>pmax)return bad('"pipette" needs {"min","max"} with 0 ≤ min ≤ max.');
  const cap=j.well_capacity??200,dead=+(j.dead_volume||0);
  if(typeof cap!=='number'||!isFinite(cap)||cap<=0)return bad('"well_capacity" must be a number > 0.');
  if(!isFinite(dead)||dead<0)return bad('"dead_volume" must be a number ≥ 0.');
  if(j.controls!=null&&(typeof j.controls!=='object'||Array.isArray(j.controls)))return bad('"controls" must be an object such as {"A1": "negative"}.');
  const steps=[];for(const [n,s] of j.steps.entries()){if(!s||typeof s.from!=='string'||typeof s.to!=='string'||typeof s.ul!=='number'||!isFinite(s.ul))return bad(`Step ${n+1} needs "from" (text), "to" (text) and "ul" (number).`);if(!s.from.trim()||!s.to.trim())return bad(`Step ${n+1} has an empty "from" or "to".`);if(!(s.ul>0))return bad(`Step ${n+1}: "ul" must be a number > 0 µL (got ${s.ul}).`);if(s.ul>100000)return bad(`Step ${n+1}: "ul" looks unphysical (${s.ul} µL). Check units.`);steps.push([n+1,s.from,s.to.toUpperCase(),s.ul])}
  const cfg={stock:j.reagents,pmin,pmax,cap,dead,rows:plate===96?'ABCDEFGH':'ABCDEFGHIJKLMNOP',cols:plate===96?12:24,ctrl:j.controls||{}};
 const r=sim(steps,cfg),n=r.frames.reduce((a,x)=>a+x.errs.length,0)+r.miss.length;
 let h=`<p class="verdict ${n?'bad':'ok'}" style="margin:0 0 8px">${n?`FAILED: ${n} violation${n>1?'s':''}. Do not run this protocol.`:'PASSED: safe to execute.'}</p><div class="tw"><table><thead><tr><th>Step</th><th>Transfer</th><th>Result</th></tr></thead><tbody>`;
 for(const f of r.frames)h+=`<tr><td>${f.i}</td><td>${esc(f.r)} → ${esc(f.w)}, ${f.v} µL</td><td>${f.errs.length?f.errs.map(e=>`<span class="bad">${e[0]}</span><br>${esc(e[1])}`).join('<br>'):'<span class="ok">pass</span>'}</td></tr>`;
 for(const m of r.miss)h+=`<tr><td>end</td><td>control check</td><td><span class="bad">${m[0]}</span><br>${esc(m[1])}</td></tr>`;
 out.innerHTML=h+'</tbody></table></div>'}
$('#vrun').onclick=vrun;

/* builder */

let bsteps=[],breag='buffer';
$('#bplate').innerHTML=plateHTML('b','<circle id="b-mc" class="pulse" r="27" fill="none" stroke="var(--warn)" stroke-width="3" cx="-50" cy="-50" opacity="0"/>'+ROWS.split('').flatMap((r,ri)=>[...Array(12)].map((_,c)=>`<circle class="hit" data-w="${r}${c+1}" cx="${X(c)}" cy="${Y(ri)}" r="21" fill="transparent" tabindex="0" role="button" aria-label="Dispense into ${r}${c+1}"/>`)).join(''));
$('#bgauges').innerHTML=gaugeHTML('b');
$('#breag').innerHTML=Object.keys(S0).map(k=>`<button class="b" data-r="${k}" aria-pressed="${k===breag}">${k}</button>`).join('');
$$('#breag button').forEach(b=>b.onclick=()=>{breag=b.dataset.r;$$('#breag button').forEach(x=>x.setAttribute('aria-pressed',x===b))});

function badd(w){const v=+$('#bvol').value;if(!(v>0))return;bsteps.push([bsteps.length+1,breag,w,v]);drawBuilder();const q=wxy(w);splash('#bplate',X(q.ci),Y(q.ri),COLHEX[breag],false)}
$$('#bplate .hit').forEach(h=>{h.onclick=()=>badd(h.dataset.w);h.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();badd(h.dataset.w)}}});

function drawBuilder(){
 const r=sim(bsteps),last=r.frames[r.frames.length-1];
 paintWells('b',last?last.wells:{});setGauges('b',last?last.stock:S0);
 const mc=$('#b-mc');mc.setAttribute('opacity',0);
 if(bsteps.length&&r.miss.length){const w=r.miss[0][2];mc.setAttribute('cx',X(+w.slice(1)-1));mc.setAttribute('cy',Y(0));mc.setAttribute('opacity',1)}
 const n=r.frames.reduce((a,x)=>a+x.errs.length,0)+r.miss.length,v=$('#bverdict');
 v.textContent=!bsteps.length?'Click a well to add the first step.':n?`${n} problem${n>1?'s':''} so far.`:'No problems found.';
 v.style.color=!bsteps.length?'var(--mute)':n?'var(--fail)':'var(--pass)';
 let h=r.frames.map((f,i)=>`<tr><td>${f.i}</td><td>${f.r} → ${f.w}, ${f.v} µL${f.errs.map(e=>`<br><span class="bad">${e[0]}</span> ${esc(e[1])}`).join('')}</td><td><button class="x" data-rm="${i}" aria-label="Remove step ${f.i}">✕</button></td></tr>`).join('');
 if(bsteps.length)h+=r.miss.map(m=>`<tr><td>end</td><td><span class="bad">${m[0]}</span> ${esc(m[1])}</td><td></td></tr>`).join('');
 $('#bsteps').innerHTML=h||'<tr><td style="color:var(--mute)">No steps yet.</td></tr>';
 $$('#bsteps [data-rm]').forEach(x=>x.onclick=()=>{bsteps.splice(+x.dataset.rm,1);bsteps.forEach((s,i)=>s[0]=i+1);drawBuilder()})}
$('#bclear').onclick=()=>{bsteps=[];drawBuilder()};
$('#bfix').onclick=()=>{bsteps=FIXED.map(s=>s.slice());drawBuilder()};
$('#bsend').onclick=()=>{const o={...EX_FAULT,steps:bsteps.map(s=>({from:s[1],to:s[2],ul:s[3]}))};$('#vin').value=fmt(o);go('validate');vrun()};
drawBuilder();

/* results */

const isWell=w=>/^[A-H](?:[1-9]|1[0-2])$/.test(w);

function renderRetro(){$('#retrolib').innerHTML=RETRO.map((e,i)=>{const pr=e[3],st=protoSteps(pr),cs=[...new Set(codesOf(st,protoCfg(pr)))],ul=st.reduce((a,x)=>a+x[3],0);
  const caught=e[2]==='miss (no rule)'?!cs.length:cs.includes(e[2]);
  return`<tr><td>H${i+1}</td><td>${e[0]}<br><span style="color:var(--mute)">${e[1]}</span></td><td class="num">${st.length}</td><td class="num">${ul}</td><td><code>${e[2]}</code></td><td class="${cs.length?'bad':'ok'}">${cs.length?cs.join('<br>'):'pass'}</td><td class="${caught?'ok':'bad'}">${caught?(e[2]==='miss (no rule)'?'miss (as scoped)':'caught'):'NOT CAUGHT'}</td><td><button class="b" data-retro="${i}">Open in Try it</button></td></tr>`}).join('');
  $$('#retrolib [data-retro]').forEach(b=>b.onclick=()=>{$('#vin').value=fmt(RETRO[+b.dataset.retro][3]);go('validate');vrun()})}

function renderReal(){$('#reallib').innerHTML=REAL.map((e,i)=>{const pr=e[2],st=protoSteps(pr),cs=[...new Set(codesOf(st,protoCfg(pr)))],ul=st.reduce((a,x)=>a+x[3],0),w=new Set(st.map(x=>x[2])).size;
  return`<tr><td>R${i+1}</td><td>${e[0]}<br><span style="color:var(--mute)">${e[1]}</span></td><td class="num">${st.length}</td><td class="num">${ul}</td><td class="num">${w}</td><td class="${cs.length?'bad':'ok'}">${cs.length?cs.join('<br>'):'pass'}</td><td><button class="b" data-real="${i}">Open in Try it</button></td></tr>`}).join('');
  $$('#reallib [data-real]').forEach(b=>b.onclick=()=>{$('#vin').value=fmt(REAL[+b.dataset.real][2]);go('validate');vrun()})}

function renderLib(){$('#lib').innerHTML=LIB.map(([n,d,st],i)=>{const cs=[...new Set(codesOf(st,DEF))],ul=st.reduce((a,x)=>a+x[3],0),w=new Set(st.map(x=>x[2]).filter(isWell)).size;
 return`<tr><td>${i+1}</td><td>${n}<br><span style="color:var(--mute)">${d}</span></td><td class="num">${st.length}</td><td class="num">${ul}</td><td class="num">${w}</td><td class="${cs.length?'bad':'ok'}">${cs.length?cs.join('<br>'):'pass'}</td><td><button class="b" data-lib="${i}">Open in Build</button></td></tr>`}).join('');
 $$('#lib [data-lib]').forEach(b=>b.onclick=()=>{bsteps=LIB[b.dataset.lib][2].map(x=>x.slice());go('build')})}
/* generated benchmark */

function runBench(){const n=+$('#nsel').value||300,b=bench2(n,+$('#seed').value||7),pc=(c,m)=>(100*c/m).toFixed(1)+'%',ci=(c,m)=>{const[l,h]=wilson(c,m);return`${(l*100).toFixed(1)}–${(h*100).toFixed(1)}%`};
 $('#tA').innerHTML=b.single.map(r=>`<tr><td><code class="${r.scope?'k':''}">${r.t}</code></td><td>${r.scope?'rule':'no rule'}</td><td class="num">${r.n}</td><td class="num">${r.hit}</td><td class="num">${pc(r.hit,r.n)}</td><td class="num">${ci(r.hit,r.n)}</td><td><div class="meter"><i style="width:${100*r.hit/r.n}%"></i></div></td></tr>`).join('');
 $('#tB').innerHTML=b.combos.map(r=>`<tr><td>${r.k} different errors</td><td class="num">${r.n}</td><td class="num">${r.hit}</td><td class="num">${pc(r.hit,r.n)}</td><td class="num">${ci(r.hit,r.n)}</td></tr>`).join('');
 $('#tC').innerHTML=b.single.map(r=>`<tr><td><code>${r.t}</code></td>${[...SCOPE,'none'].map(c=>{const v=r.conf[c]||0;return`<td style="background:color-mix(in srgb,var(--ink) ${(v/r.n*34).toFixed(0)}%,transparent);${c===r.t?'font-weight:600':''}">${v}</td>`}).join('')}</tr>`).join('');
 const ks=[...Array(17)].map((_,i)=>8+i),mx=Math.max(...ks.map(x=>b.sizes[x]||0))||1;
 $('#tD').textContent=`${b.n} generated protocols, seed ${+$('#seed').value||7}. Average ${b.meanSteps.toFixed(1)} steps and ${Math.round(b.meanUl)} µL moved. Steps per protocol:`;
 $('#hist').innerHTML=ks.map(x=>`<div style="height:${100*(b.sizes[x]||0)/mx}%" title="${x} steps: ${b.sizes[x]||0}"><span>${x%2?'':x}</span></div>`).join('');
  $('#fp').textContent=`False alarms on the unmodified protocols: ${b.fp} of ${b.n}.`;
  const rq=REAL.map(p=>{const pr=p[2],st=protoSteps(pr),cs=[...new Set(codesOf(st,protoCfg(pr)))];return{n:p[0],s:st.length,cs}});
  $('#tReal').innerHTML=rq.map(r=>`<tr><td>${r.n}</td><td class="num">${r.s}</td><td class="${r.cs.length?'bad':'ok'}">${r.cs.length?r.cs.join('<br>'):'pass'}</td></tr>`).join('');
  $('#realfp').textContent=`False alarms on real transcribed protocols: ${rq.filter(r=>r.cs.length).length} of ${rq.length}.`;
  const rt=RETRO.map(p=>{const pr=p[3],st=protoSteps(pr),cs=[...new Set(codesOf(st,protoCfg(pr)))];return{n:p[0],e:p[2],s:st.length,cs}});
  $('#tRetro').innerHTML=rt.map(r=>{const caught=r.e==='miss (no rule)'?!r.cs.length:r.cs.includes(r.e);
   return`<tr><td>${r.n}</td><td><code>${r.e}</code></td><td class="${r.cs.length?'bad':'ok'}">${r.cs.length?r.cs.join('<br>'):'pass'}</td><td class="${caught?'ok':'bad'}">${caught?(r.e==='miss (no rule)'?'miss (as scoped)':'caught'):'NOT CAUGHT'}</td></tr>`}).join('');
  const scoped=rt.filter(r=>r.e!=='miss (no rule)'),hit=scoped.filter(r=>r.cs.includes(r.e)).length;
  $('#retrofp').textContent=`Library history: ${hit} of ${scoped.length} in-scope real faults caught; ${rt.length-scoped.length} out-of-scope miss (no reservoir rule).`}
$('#go').onclick=runBench;

/* motion */

function aProto(i){if(!i)return{steps:FIXED,cfg:DEF};if(i<=LIB.length)return{steps:LIB[i-1][2],cfg:DEF};const p=REAL[i-1-LIB.length][2];return{steps:protoSteps(p),cfg:protoCfg(p)}}

function renderA(){const ap=aProto(+$('#asel').value),st=ap.steps,cfg=ap.cfg,r=sim(st,cfg),fr=r.frames,n=fr.length,cols={buffer:'var(--buf)',sample:'var(--sam)',dye:'var(--dye)'};
  const ser=Object.keys(cfg.stock).map(k=>({name:k,color:cols[k]||'var(--ink)',pts:[[0,100],...fr.map((f,j)=>[j+1,f.stock[k]/cfg.stock[k]*100])]}));
  const lo=Math.min(0,...ser.flatMap(s=>s.pts.map(p=>p[1])));
  lineChart('c1',{title:'Reagent left after each step',series:ser,xmin:0,xmax:Math.max(n,1),ymin:Math.floor(lo/25)*25,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xticks:n<=12?[...Array(n+1).keys()]:null,hlines:[{y:0,label:'empty'}],xlab:'after step',ylab:'% of starting volume'});
  const last=fr[n-1],ws=Object.entries(last.wells).sort((a,b)=>a[0][0].localeCompare(b[0][0])||(+a[0].slice(1))-(+b[0].slice(1)));
  barChart('c2',{title:'Liquid in each well',bars:ws.map(([w,o])=>({label:w,v:o.v,color:o.v>cfg.cap?'var(--fail)':`rgb(${o.c.map(x=>Math.round(x/o.v)).join(',')})`})),ymax:Math.max(cfg.cap*1.15,...ws.map(x=>x[1].v*1.05)),hline:{y:cfg.cap,label:'well limit'},ylab:'µL'});
  const vmax=Math.max(cfg.pmax*1.1,...fr.map(f=>f.v*1.1));
  lineChart('c3',{title:'Transfer sizes',series:[{color:'var(--ink)',line:false,dots:true,pts:fr.map((f,j)=>[j+1,f.v,(f.v<cfg.pmin||f.v>cfg.pmax)?'var(--fail)':'var(--ink)'])}],xmin:0,xmax:n+1,ymin:0,ymax:vmax,band:[cfg.pmin,cfg.pmax],yfmt:v=>Math.round(v),xfmt:v=>Math.round(v),xticks:n<=12?[...Array(n).keys()].map(x=>x+1):null,xlab:'step',ylab:'µL'})}

function renderB(){const n=+$('#ansel').value||300,seed=+$('#aseed').value||7,rnd=prng(seed),bases=[];for(let i=0;i<n;i++)bases.push(genProto(rnd));
 const m=ROWS.split('').map(()=>Array(12).fill(0)),bins=Array(6).fill(0);
 for(const b of bases)for(const [,,w,v] of b){m[ROWS.indexOf(w[0])][+w.slice(1)-1]+=v/n;bins[Math.min(5,Math.floor((v-20)/20))]++}
 heat('c4',m,Math.max(...m.flat()));
 barChart('c5',{title:'Transfer sizes',bars:bins.map((c,i)=>({label:i===5?'120':`${20+i*20}–${39+i*20}`,v:c})),ylab:'transfers'});
 const caps=[],pm=[1,5,10,15,20,21,25,30,40,50,60];for(let c=60;c<=300;c+=20)caps.push(c);
 const flag=(cfg,code)=>100*bases.filter(b=>codesOf(b,{...GCFG,...cfg}).includes(code)).length/n;
 lineChart('c6',{title:'Flagged vs well limit',series:[{color:'var(--ink)',pts:caps.map(c=>[c,flag({cap:c},'WELL_OVERFLOW')])}],xmin:60,xmax:300,ymin:0,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xticks:caps.filter((c,i)=>i%2===0),vlines:[{x:200,label:'built for 200'}],xlab:'well limit (µL)',ylab:'protocols flagged'});
 lineChart('c7',{title:'Flagged vs pipette minimum',series:[{color:'var(--ink)',pts:pm.map(c=>[c,flag({pmin:c},'PIPETTE_RANGE')])}],xmin:0,xmax:60,ymin:0,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xticks:[0,10,20,30,40,50,60],vlines:[{x:20,label:'built for 20'}],xlab:'pipette minimum (µL)',ylab:'protocols flagged'})}

function renderT(){const sizes=[100,300,1000,3000,10000,30000],cfgT={stock:{buffer:1e15},dead:0,pmin:1,pmax:1e9,cap:1e15,rows:'ABCDEFGH',cols:12,ctrl:{},nosnap:true};
 const pts=sizes.map(n=>{const st=[...Array(n)].map((_,i)=>[i+1,'buffer',ALLW[i%96],20]),ts=[];for(let q=0;q<3;q++){const t0=performance.now();sim(st,cfgT);ts.push(performance.now()-t0)}ts.sort((a,b)=>a-b);return[n,ts[1]]});
 const e=pts[pts.length-1];
 lineChart('c8',{title:'Checking time',series:[{color:'var(--ink)',pts}],xmin:0,xmax:30000,ymin:0,ymax:Math.max(1,e[1]*1.1),yfmt:v=>v.toFixed(v<10?1:0),xfmt:v=>v?(v/1000)+'k':'0',xlab:'steps in the protocol',ylab:'milliseconds'});
 $('#tsum').textContent=`${e[0].toLocaleString()} steps took ${e[1].toFixed(1)} ms, about ${(e[1]/e[0]*1000).toFixed(2)} µs per step. Timed in this browser, so it depends on your machine.`}

const bset=(n,seed)=>{const rnd=prng(seed),b=[];for(let i=0;i<n;i++)b.push(genProto(rnd));return b};

function renderA2(){const ap=aProto(+$('#asel').value),st=ap.steps,cfg=ap.cfg,r=sim(st,cfg);renderFlow(r.frames);renderFilm(r.frames,cfg.cap);renderCum(r.frames);renderProb(r)}

function renderC(){const n=+$('#ansel').value||300,seed=+$('#aseed').value||7,bases=bset(n,seed),rnd=prng(seed+7);
 const rowT=Array(8).fill(0),colT=Array(12).fill(0),sizes={},pts=[],use={buffer:[],sample:[],dye:[]};
 for(const b of bases){const u={buffer:0,sample:0,dye:0};let tot=0;for(const [,r,w,v] of b){rowT[ROWS.indexOf(w[0])]+=v/n;colT[+w.slice(1)-1]+=v/n;u[r]+=v;tot+=v}
  sizes[b.length]=(sizes[b.length]||0)+1;pts.push([b.length+(rnd()-.5)*.7,tot]);for(const r in u)use[r].push(100*u[r]/GCFG.stock[r])}
 barChart('c13',{title:'Liquid per row',bars:ROWS.split('').map((l,i)=>({label:l,v:Math.round(rowT[i])})),ylab:'µL per protocol'});
 barChart('c14',{title:'Liquid per column',bars:colT.map((v,i)=>({label:String(i+1),v:Math.round(v)})),ylab:'µL per protocol'});
 barChart('c15',{title:'Steps per protocol',bars:[...Array(17)].map((_,i)=>({label:String(8+i),v:sizes[8+i]||0})),ylab:'protocols'});
 lineChart('c16',{title:'Steps against liquid moved',series:[{color:'var(--ink)',line:false,dots:true,pts}],xmin:7,xmax:25,ymin:0,ymax:Math.max(...pts.map(p=>p[1]))*1.08,yfmt:v=>Math.round(v),xfmt:v=>Math.round(v),xticks:[8,12,16,20,24],xlab:'steps',ylab:'µL moved'});
 boxPlot('c17',Object.keys(use).map(r=>({label:r,color:colsR[r],vals:use[r]})),{ymax:100,ylab:'% of stock used'})}

function renderD(){const n=+$('#ansel').value||300,seed=+$('#aseed').value||7,b=bench2(n,seed),bases=bset(n,seed),rnd=prng(seed+101),order=['CONTROL_MISSING','PIPETTE_RANGE','WELL_OVERFLOW','WELL_MISSING','REAGENT_EMPTY'];
 const ci=(c,m)=>wilson(c,m).map(x=>x*100);
 dotPlot('c18',b.single.map(r=>{const [lo,hi]=ci(r.hit,r.n);return{label:r.t,v:100*r.hit/r.n,lo,hi,color:r.scope?'var(--ink)':'var(--fail)'}}));
  const shuffle=(a)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const runK=(base,k)=>{const ch=shuffle([...order]).slice(0,k).sort((x,y)=>order.indexOf(x)-order.indexOf(y));let st=base,cfg=GCFG;const tk=new Set();for(const t of ch){const r=inject(t,st,cfg,rnd,tk);st=r.steps;cfg=r.cfg}const cl=codesOf(st,cfg);return{ch,cl,cs:new Set(cl)}};
 const kp=[],lo=[],hi=[],vc={},co=SCOPE.map(()=>Array(5).fill(0));
 for(let k=1;k<=5;k++){let hit=0;for(const base of bases){const r=runK(base,k);if(r.ch.every(t=>r.cs.has(t)))hit++;
   if(k===3){vc[r.cl.length]=(vc[r.cl.length]||0)+1;SCOPE.forEach((a,i)=>SCOPE.forEach((c,j)=>{if(r.cs.has(a)&&r.cs.has(c))co[i][j]++}))}}
  const [l,h]=ci(hit,n);kp.push([k,100*hit/n]);lo.push([k,l]);hi.push([k,h])}
 lineChart('c19',{title:'Detection against number of errors',series:[{name:'all found',color:'var(--ink)',pts:kp},{name:'',color:'var(--mute)',dash:true,pts:lo},{name:'',color:'var(--mute)',dash:true,pts:hi}],xmin:1,xmax:5,ymin:0,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xticks:[1,2,3,4,5],xlab:'errors injected at once',ylab:'all found'});
 const ks=Object.keys(vc).map(Number).sort((a,b)=>a-b);
 barChart('c20',{title:'Problems reported',bars:ks.map(k=>({label:String(k),v:vc[k]})),ylab:'protocols'});
 const pos=Array(10).fill(0);
 for(const t of ['PIPETTE_RANGE','WELL_OVERFLOW','WELL_MISSING','REAGENT_EMPTY'])for(const base of bases){const r=inject(t,base,GCFG,rnd,new Set()),fr=sim(r.steps,r.cfg).frames,i=fr.findIndex(f=>f.errs.length);if(i>=0)pos[Math.min(9,Math.floor(i/fr.length*10))]++}
 barChart('c21',{title:'Where the first problem appears',bars:pos.map((v,i)=>({label:`${i*10}%`,v})),ylab:'errors'});
 const sh=['PIPETTE','REAGENT','OVERFLOW','MISSING','CONTROL'];
 grid('c22',{rl:sh,cl:sh,vals:SCOPE.map((_,i)=>SCOPE.map((_,j)=>co[i][j])),max:n,ch:34})}

function renderE(){const n=+$('#ansel').value||300,seed=+$('#aseed').value||7,bases=bset(n,seed),caps=[60,100,140,180,200,240,300],mins=[1,10,20,21,30,40,60];
 const vals=caps.map(c=>mins.map(m=>100*bases.filter(b=>{const cs=codesOf(b,{...GCFG,cap:c,pmin:m});return cs.includes('WELL_OVERFLOW')||cs.includes('PIPETTE_RANGE')}).length/n));
 grid('c23',{rl:caps.map(c=>c+' µL'),cl:mins.map(m=>m+' µL'),vals,max:100,fmt:v=>Math.round(v)+'%',mark:[4,2],xlab:'pipette minimum',ylab:'well limit'});
 const stocks=[100,200,300,400,600,800,1000,1500];
 lineChart('c24',{title:'Flagged against tube volume',series:Object.keys(GCFG.stock).map(r=>({name:r,color:colsR[r],pts:stocks.map(s=>[s,100*bases.filter(b=>codesOf(b,{...GCFG,stock:{...GCFG.stock,[r]:s}}).includes('REAGENT_EMPTY')).length/n])})),xmin:100,xmax:1500,ymin:0,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xticks:[100,400,800,1200,1500],xlab:'starting volume of that tube (µL)',ylab:'protocols flagged'})}

function renderWaterfall(){const ap=aProto(+$('#asel').value),st=ap.steps,cfg=ap.cfg,r=sim(st,cfg),fr=r.frames,n=fr.length,rs=Object.keys(cfg.stock);
  const W=560,H=250,L=50,R=30,T=20,B=40,cum={};rs.forEach(k=>cum[k]=0);const steps=[{...cum}];
  for(const f of fr){cum[f.r]=(cum[f.r]||0)+f.v;steps.push({...cum})}
  const ymax=Math.max(1,...Object.values(cum))*1.1,Y=v=>H-B-v/ymax*(H-T-B),X=s=>L+s/n*(W-L-R);
  let h='';
  for(let t=0;t<=4;t++){const v=ymax*t/4;h+=`<line class="c-grid" x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="c-t" x="${L-6}" y="${Y(v)+3}" text-anchor="end">${Math.round(v)}</text>`}
  rs.forEach((r,i)=>{const pts=steps.map((s,j)=>[X(j),Y(s[r]||0)]),color=colsR[r]||'var(--ink)';
    h+=`<polyline fill="none" stroke="${color}" stroke-width="2" points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}"/>`;
    h+=`<rect x="${L-40+i*80}" y="${T}" width="60" height="${Y(0)-Y(steps[n][r]||0)}" style="fill:${color}" opacity=".2"/>`;
    h+=`<text class="c-t" x="${L-10+i*80}" y="${T-6}" text-anchor="end" style="fill:${color};font-weight:600">${r}: ${Math.round(steps[n][r]||0)} µL</text>`;
  });
  h+=`<line class="c-ax" x1="${L}" x2="${W-R}" y1="${H-B}" y2="${H-B}"/><line class="c-ax" x1="${L}" x2="${L}" y1="${T}" y2="${H-B}"/>`;
  h+=`<text class="c-l" x="${(L+W-R)/2}" y="${H-4}" text-anchor="middle">step</text><text class="c-l" transform="translate(12 ${(T+H-B)/2}) rotate(-90)" text-anchor="middle">µL drawn</text>`;
  svgOut('c28',W,H,h,'Reagent waterfall');
}

function renderUtilization(){const ap=aProto(+$('#asel').value),st=ap.steps,cfg=ap.cfg,r=sim(st,cfg),last=r.frames[r.frames.length-1];
  const W=560,H=300,L=24,T=30,cw=(W-L-4)/12,ch=(H-T-4)/8;
  let h='';
  for(let c=0;c<12;c++)h+=`<text class="c-t" x="${(L+c*cw+cw/2).toFixed(1)}" y="${T-7}" text-anchor="middle">${c+1}</text>`;
  for(let r=0;r<8;r++){h+=`<text class="c-t" x="${L-7}" y="${(T+r*ch+ch/2+3).toFixed(1)}" text-anchor="end">${ROWS[r]}</text>`;
   for(let c=0;c<12;c++){const w=ROWS[r]+(c+1),o=last.wells[w],pct=o?o.v/cfg.cap*100:0,over=o&&o.v>cfg.cap,q=Math.min(1,pct/100);
      const fill=over?'var(--fail)':`color-mix(in srgb,var(--ink) ${(q*85).toFixed(0)}%,transparent)`;
      h+=`<rect x="${(L+c*cw+1).toFixed(1)}" y="${(T+r*ch+1).toFixed(1)}" width="${(cw-2).toFixed(1)}" height="${(ch-2).toFixed(1)}" style="fill:${fill}"><title>${w}: ${pct.toFixed(1)}%${over?' (OVER)':''}</title></rect>`;
      h+=`<text class="c-t" x="${(L+c*cw+cw/2).toFixed(1)}" y="${(T+r*ch+ch/2+3).toFixed(1)}" text-anchor="middle" style="fill:${q>.5||over?'var(--paper)':'var(--ink)'};font-size:10px">${over?'!':Math.round(pct)}</text>`;
    }}
  svgOut('c29',W,H,h,'Well utilization');
}

function renderTimeline(){const ap=aProto(+$('#asel').value),st=ap.steps,cfg=ap.cfg,r=sim(st,cfg),fr=r.frames,n=fr.length;
  const W=560,H=200,L=50,R=30,T=20,B=40,vmax=Math.max(cfg.pmax*1.1,...fr.map(f=>f.v*1.1));
  const X=s=>L+s/(n+1)*(W-L-R),Y=v=>H-B-v/vmax*(H-T-B);
  let h='';
  for(const t of [cfg.pmin,cfg.pmax])h+=`<line class="c-grid" x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}" style="stroke:var(--rule)" stroke-dasharray="2 2"/>`;
  h+=`<rect x="${L}" y="${Y(cfg.pmax)}" width="${W-L-R}" height="${Y(cfg.pmin)-Y(cfg.pmax)}" style="fill:var(--rule)" opacity=".15"/>`;
  fr.forEach((f,j)=>{const x=X(j+1),y=Y(f.v),color=colsR[f.r]||'var(--ink)',bad=f.v<cfg.pmin||f.v>cfg.pmax;
    h+=`<line x1="${x}" x2="${x}" y1="${Y(0)}" y2="${y}" style="stroke:${color}" stroke-width="3"/>`;
    h+=`<circle cx="${x}" cy="${y}" r="${bad?5:3}" style="fill:${bad?'var(--fail)':color}"><title>Step ${f.i}: ${f.r} → ${f.w} ${f.v} µL${bad?' (OUT OF RANGE)':''}</title></circle>`;
  });
  for(let t=0;t<=4;t++){const v=vmax*t/4;h+=`<line class="c-grid" x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="c-t" x="${L-6}" y="${Y(v)+3}" text-anchor="end">${Math.round(v)}</text>}`}
  for(let j=0;j<n;j+=Math.max(1,Math.floor(n/10)))h+=`<text class="c-t" x="${X(j+1)}" y="${H-B+14}" text-anchor="middle">${j+1}</text>`;
  h+=`<line class="c-ax" x1="${L}" x2="${W-R}" y1="${H-B}" y2="${H-B}"/><line class="c-ax" x1="${L}" x2="${L}" y1="${T}" y2="${H-B}"/>`;
  h+=`<text class="c-l" x="${(L+W-R)/2}" y="${H-4}" text-anchor="middle">step</text><text class="c-l" transform="translate(12 ${(T+H-B)/2}) rotate(-90)" text-anchor="middle">µL</text>`;
  svgOut('c30',W,H,h,'Step volume timeline');
}

function renderCooccurrence(){const n=+$('#ansel').value||300,seed=+$('#aseed').value||7,b=bset(n,seed),rnd=prng(seed+101),order=['CONTROL_MISSING','PIPETTE_RANGE','WELL_OVERFLOW','WELL_MISSING','REAGENT_EMPTY'];
  const shuffle=(a)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const co=SCOPE.map(()=>Array(5).fill(0)),marg=Array(5).fill(0);
  for(let k=3;k<=3;k++){for(const base of b){const ch=shuffle([...order]).slice(0,k).sort((x,y)=>order.indexOf(x)-order.indexOf(y));let st=base,cfg=GCFG;const tk=new Set();
    for(const t of ch){const r=inject(t,st,cfg,rnd,tk);st=r.steps;cfg=r.cfg}
    const cs=new Set(codesOf(st,cfg));SCOPE.forEach((a,i)=>{if(cs.has(a)){marg[i]++;SCOPE.forEach((c,j)=>{if(cs.has(c))co[i][j]++})}})}}
  const W=560,H=300,L=100,T=30,ch=40;
  let h=`<text class="c-t" x="${L+200}" y="${T-10}" text-anchor="middle" style="font-weight:600;font-size:14px">Error co-occurrence (3 errors injected)</text>`;
  for(let i=0;i<5;i++){h+=`<text class="c-t" x="${L-8}" y="${T+i*ch+ch/2+3}" text-anchor="end" style="font-size:11px">${SCOPE[i].replace('_','\n')}</text>`;
    h+=`<text class="c-t" x="${L+50+i*ch}" y="${T-6}" text-anchor="middle" style="font-size:11px">${SCOPE[i].replace('_','\n')}</text>`;}
  for(let i=0;i<5;i++)for(let j=0;j<5;j++){const v=marg[i]?co[i][j]/marg[i]:0,q=Math.min(1,v);
    h+=`<rect x="${L+j*ch}" y="${T+i*ch}" width="${ch}" height="${ch}" style="fill:color-mix(in srgb,var(--ink) ${(q*85).toFixed(0)}%,transparent)"><title>${SCOPE[i]} & ${SCOPE[j]}: ${(v*100).toFixed(1)}%</title></rect>`;
    h+=`<text class="c-t" x="${L+j*ch+ch/2}" y="${T+i*ch+ch/2+3}" text-anchor="middle" style="fill:${q>.5?'var(--paper)':'var(--ink)'};font-size:11px">${i===j?(marg[i]/n*100).toFixed(1)+'%':(v*100).toFixed(1)+'%'}</text>`;
  }
  svgOut('c31',W,H,h,'Error co-occurrence');
}

function renderSimilarity(){const n=Math.min(50,+$('#ansel').value||300),seed=+$('#aseed').value||7,bases=bset(n,seed);
  const sig=bases.map(s=>new Set(s.map(([,r,w,v])=>`${r}:${w}:${Math.floor(v/20)}`)));
  const sim=sig.map((_,i)=>sig.map((_,j)=>i===j?1:jaccard(sig[i],sig[j])));
  const W=560,H=560,L=40,T=40,cw=(W-L-4)/n;
  let h='';
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){const v=sim[i][j],q=v;
    h+=`<rect x="${L+j*cw}" y="${T+i*cw}" width="${cw}" height="${cw}" style="fill:color-mix(in srgb,var(--buf) ${(q*80).toFixed(0)}%,transparent)"></rect>`;
  }
  svgOut('c32',W,H,h,'Protocol similarity');
}

function renderAnalysis(){const sel=$('#asel');if(!sel.innerHTML)sel.innerHTML=['Example protocol',...LIB.map(l=>l[0]),...REAL.map(r=>'Real: '+r[0])].map((n,i)=>`<option value="${i}">${n}</option>`).join('');
  const pa=()=>{renderA();renderA2();renderWaterfall();renderUtilization();renderTimeline()},gen=()=>{setTimeout(renderB,0);setTimeout(renderC,15);setTimeout(renderD,30);setTimeout(renderE,45);setTimeout(renderPipeline,60);setTimeout(renderRules,75);setTimeout(renderSchema,90);setTimeout(renderCooccurrence,105);setTimeout(renderSimilarity,120)};
  sel.onchange=pa;$('#ago').onclick=gen;$('#atime').onclick=renderT;pa();gen();setTimeout(renderT,60);setTimeout(renderPipeline,120);setTimeout(renderRules,135);setTimeout(renderSchema,150);setTimeout(renderCooccurrence,165);setTimeout(renderSimilarity,180)}

/* atlas */

function renderAtlas(){
 const seed=+($('#tseed')&&$('#tseed').value)||7,n=Math.min(300,(+($('#tsel')&&$('#tsel').value)||100));
 const bases=bset(n,seed),R=()=>prng(seed*7+3);
 const shuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const vols={buffer:[],sample:[],dye:[]};for(const b of bases)for(const [,r,,v] of b)if(vols[r])vols[r].push(v);
 const wellsOf=b=>{const m={};for(const [,,w,v] of b)m[w]=(m[w]||0)+v;return m};
 /* A volumes */
 atlasSafe('c33',()=>{const c=atlasHist(vols.buffer,6,20,121);barChart('c33',{title:'Buffer sizes',bars:c.map((v,i)=>({label:i===5?'120':(20+i*20)+'–'+(39+i*20),v})),ylab:'transfers'})});
 atlasSafe('c34',()=>{const c=atlasHist(vols.sample,6,20,121);barChart('c34',{title:'Sample sizes',bars:c.map((v,i)=>({label:i===5?'120':(20+i*20)+'–'+(39+i*20),v})),ylab:'transfers'})});
 atlasSafe('c35',()=>{const c=atlasHist(vols.dye,6,20,121);barChart('c35',{title:'Dye sizes',bars:c.map((v,i)=>({label:i===5?'120':(20+i*20)+'–'+(39+i*20),v})),ylab:'transfers'})});
 atlasSafe('c36',()=>{let cv=0,cn=0,ov=0,on=0;for(const b of bases){const m=wellsOf(b);for(const w in m){if(w==='A1'||w==='A12'){cv+=m[w];cn++}else{ov+=m[w];on++}}}barChart('c36',{title:'Control vs regular',bars:[{label:'control',v:Math.round(cv/Math.max(1,cn))},{label:'regular',v:Math.round(ov/Math.max(1,on))}],ylab:'mean µL per well'})});
 atlasSafe('c37',()=>{let a=0,b2=0,c3=0;for(const b of bases){const dose={};for(const [,,w] of b)dose[w]=(dose[w]||0)+1;for(const w in dose){if(dose[w]===1)a++;else if(dose[w]===2)b2++;else c3++}}barChart('c37',{title:'Well reuse',bars:[{label:'1×',v:Math.round(a/n)},{label:'2×',v:Math.round(b2/n)},{label:'3×+',v:Math.round(c3/n)}],ylab:'wells per protocol'})});
 atlasSafe('c38',()=>{const pct=bases.map(b=>{const m=wellsOf(b);return Math.max(...Object.values(m))/200*100});const c=atlasHist(pct,10,0,101);barChart('c38',{title:'Fullest well',bars:c.map((v,i)=>({label:(i*10)+'%',v})),ylab:'protocols'})});
 /* C boundaries (cheap, sync) */
 atlasSafe('c45',()=>{const ms=[1,5,10,15,20,21,25,30,40,50,60];lineChart('c45',{title:'Pipette minimum sweep',series:[{color:'var(--ink)',pts:ms.map(m=>[m,100*bases.filter(b=>codesOf(b,{...GCFG,pmin:m}).includes('PIPETTE_RANGE')).length/n])}],xmin:1,xmax:60,ymin:0,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xlab:'pipette minimum (µL)',ylab:'flagged'})});
 atlasSafe('c46',()=>{const cs=[];for(let c=60;c<=300;c+=20)cs.push(c);lineChart('c46',{title:'Well limit sweep',series:[{color:'var(--ink)',pts:cs.map(c=>[c,100*bases.filter(b=>codesOf(b,{...GCFG,cap:c}).includes('WELL_OVERFLOW')).length/n])}],xmin:60,xmax:300,ymin:0,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xlab:'well limit (µL)',ylab:'flagged'})});
 atlasSafe('c47',()=>{const ds=[];for(let d=0;d<=100;d+=10)ds.push(d);const proto=bases[0].map(x=>x.slice());const u={};proto.forEach(x=>u[x[1]]=(u[x[1]]||0)+x[3]);lineChart('c47',{title:'Dead volume sweep',series:[{color:'var(--ink)',pts:ds.map(d=>[d,100*bases.filter(b=>{const uu={};b.forEach(x=>uu[x[1]]=(uu[x[1]]||0)+x[3]);const st={...GCFG.stock};for(const k in uu)st[k]=uu[k]+50;return codesOf(b,{...GCFG,dead:d,stock:st}).includes('DEAD_VOLUME')}).length/n])}],xmin:0,xmax:100,ymin:0,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xlab:'dead volume (µL)',ylab:'flagged'})});
 const bin=(id,title,xs,f)=>atlasSafe(id,()=>barChart(id,{title,bars:xs.map(x=>({label:String(x),v:f(x)?1:0})),ymax:1,ylab:'flagged'}));
 bin('c48','Pipette boundary',[15,17,19,20,21,23,25],v=>codesOf([[1,'buffer','A1',100],[2,'sample','A12',50],[3,'dye','B1',v]],DEF).includes('PIPETTE_RANGE'));
 bin('c49','Capacity boundary',[190,195,200,205,210],v=>codesOf([[1,'buffer','A1',100],[2,'sample','A12',50],[3,'buffer','E5',v]],DEF).includes('WELL_OVERFLOW'));
 bin('c50','Stock boundary',[100,110,120,121,130],v=>codesOf([[1,'buffer','A1',100],[2,'sample','A12',50],[3,'dye','F1',v]],{...DEF,stock:{buffer:1000,dye:120,sample:120}}).includes('REAGENT_EMPTY'));
 /* F reagents */
 atlasSafe('c61',()=>{const c=atlasHist(bases.map(b=>100*b.reduce((a,[,r,,v])=>a+(r==='buffer'?v:0),0)/GCFG.stock.buffer),10,0,51);barChart('c61',{title:'Buffer used',bars:c.map((v,i)=>({label:(i*5)+'%',v})),ylab:'protocols'})});
 atlasSafe('c62',()=>{const c=atlasHist(bases.map(b=>100*b.reduce((a,[,r,,v])=>a+(r==='sample'?v:0),0)/GCFG.stock.sample),10,0,101);barChart('c62',{title:'Sample used',bars:c.map((v,i)=>({label:(i*10)+'%',v})),ylab:'protocols'})});
 atlasSafe('c63',()=>{const c=atlasHist(bases.map(b=>100*b.reduce((a,[,r,,v])=>a+(r==='dye'?v:0),0)/GCFG.stock.dye),10,0,101);barChart('c63',{title:'Dye used',bars:c.map((v,i)=>({label:(i*10)+'%',v})),ylab:'protocols'})});
 atlasSafe('c64',()=>{const ss=[500,1000,1500,2000,2500,3000,4000];lineChart('c64',{title:'Buffer stock size',series:[{color:'var(--buf)',pts:ss.map(s=>[s,100*bases.filter(b=>codesOf(b,{...GCFG,stock:{...GCFG.stock,buffer:s}}).includes('REAGENT_EMPTY')).length/n])}],xmin:500,xmax:4000,ymin:0,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xlab:'starting buffer (µL)',ylab:'flagged'})});
 atlasSafe('c65',()=>{const ss=[100,200,300,400,600,800];lineChart('c65',{title:'Sample stock size',series:[{color:'var(--sam)',pts:ss.map(s=>[s,100*bases.filter(b=>codesOf(b,{...GCFG,stock:{...GCFG.stock,sample:s}}).includes('REAGENT_EMPTY')).length/n])}],xmin:100,xmax:800,ymin:0,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xlab:'starting sample (µL)',ylab:'flagged'})});
 atlasSafe('c66',()=>{const ss=[50,100,150,200,300,400];lineChart('c66',{title:'Dye stock size',series:[{color:'var(--dye)',pts:ss.map(s=>[s,100*bases.filter(b=>codesOf(b,{...GCFG,stock:{...GCFG.stock,dye:s}}).includes('REAGENT_EMPTY')).length/n])}],xmin:50,xmax:400,ymin:0,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xlab:'starting dye (µL)',ylab:'flagged'})});
 /* G wells */
 atlasSafe('c67',()=>{let co=0,cn=0,ed=0,en=0,ce=0,ceN=0;for(const b of bases){const m=wellsOf(b);for(const w in m){const r=w[0],c=+w.slice(1),corner=(('AD'.includes(r))&&['1','12'].includes(String(c)))||((r==='A'||r==='H')&&(c===1||c===12));const edge=r==='A'||r==='H'||c===1||c===12;if(r==='A'&&c===1||r==='A'&&c===12||r==='H'&&c===1||r==='H'&&c===12){co+=m[w];cn++}else if(edge){ed+=m[w];en++}else{ce+=m[w];ceN++}}}barChart('c67',{title:'Plate position',bars:[{label:'corner',v:Math.round(co/Math.max(1,cn))},{label:'edge',v:Math.round(ed/Math.max(1,en))},{label:'centre',v:Math.round(ce/Math.max(1,ceN))}],ylab:'mean µL'})});
 atlasSafe('c68',()=>{const c=atlasHist(bases.map(b=>Object.keys(wellsOf(b)).length),10,5,26);barChart('c68',{title:'Wells used',bars:c.map((v,i)=>({label:String(5+i*2),v})),ylab:'protocols'})});
 atlasSafe('c69',()=>{const c=atlasHist(bases.map(b=>{const d={};for(const [,,w] of b)d[w]=(d[w]||0)+1;return Object.values(d).filter(x=>x>1).length}),6,0,7);barChart('c69',{title:'Multi-dose wells',bars:c.map((v,i)=>({label:String(i),v})),ylab:'protocols'})});
 atlasSafe('c70',()=>{const c=atlasHist(bases.map(b=>Object.values(wellsOf(b)).filter(v=>v>=180).length),6,0,7);barChart('c70',{title:'Near-limit wells',bars:c.map((v,i)=>({label:String(i),v})),ylab:'protocols'})});
 atlasSafe('c71',()=>{const c=atlasHist(bases.map(b=>96-Object.keys(wellsOf(b)).length),10,70,97);barChart('c71',{title:'Unused wells',bars:c.map((v,i)=>({label:String(70+i*3),v})),ylab:'protocols'})});
 atlasSafe('c72',()=>{const s1=[];const s2=[];const s3=[];for(const b of bases){const m=wellsOf(b),d={};for(const [,,w] of b)d[w]=(d[w]||0)+1;for(const w in m){if(d[w]===1)s1.push(m[w]);else if(d[w]===2)s2.push(m[w]);else s3.push(m[w])}}const avg=a=>Math.round(a.reduce((x,y)=>x+y,0)/Math.max(1,a.length));barChart('c72',{title:'Volume by dose count',bars:[{label:'1×',v:avg(s1)},{label:'2×',v:avg(s2)},{label:'3×+',v:avg(s3)}],ylab:'mean µL'})});
 /* static tables */
 $('#tG').innerHTML=[['Parse','O(S)','O(S)','one pass to read steps'],['Simulate','O(S)','O(W + R)','two counters per well and stock'],['Check (6 rules)','O(S)','O(1)','constant tests per step'],['Report','O(F)','O(F)','F = violations found'],['Total','O(S)','O(W + R + F)','S steps, W filled wells, R reagents']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td style="color:var(--mute)">${r[3]}</td></tr>`).join('');
 $('#tH').innerHTML=[['Pipette 20–300 µL','Opentrons P300 single-channel range'],['Well limit 200 µL','conservative vs ~360 µL 96-well datasheets'],['Plate 96 (A–H × 1–12)','384 (A–P × 1–24) accepted in Try it; drawings show 96'],['Reagents buffer 4000 / sample 800 / dye 400 µL','benchmark generator only; Try it accepts any'],['Dead volume 0 (off)','opt-in; enable per protocol'],['Controls A1 negative, A12 positive','lab convention for this assay']].map(r=>`<tr><td>${r[0]}</td><td style="color:var(--mute)">${r[1]}</td></tr>`).join('');
  $('#atlasCount').textContent='48 charts · 4 tables · 15 fault variants · '+(LIB.length+REAL.length)+' protocols · '+$$('#glossary, section[data-p="glossary"] dt').length+' glossary terms.';
 /* heavy: B stability, D patterns, E taxonomy, H figures — staggered */
 setTimeout(()=>{
  atlasSafe('c39',()=>{const seeds=[7,8,9,10,11],per=seeds.map(s=>bench2(100,s));dotPlot('c39',SCOPE.map(t=>{const vs=per.map(b=>100*b.single.find(r=>r.t===t).hit/100);return{label:t,v:vs.reduce((a,x)=>a+x,0)/5,lo:Math.min(...vs),hi:Math.max(...vs),color:'var(--ink)'}}))});
  atlasSafe('c40',()=>{const ns=[50,100,200],all=ns.map(x=>bench2(x,seed));lineChart('c40',{title:'Rate vs set size',series:SCOPE.map((t,i)=>({name:['PIP','EMPTY','OVFLW','MISS','CTRL'][i],color:['var(--buf)','var(--dye)','var(--sam)','var(--warn)','var(--fail)'][i],pts:ns.map((x,j)=>[x,100*all[j].single.find(r=>r.t===t).hit/x])})),xmin:50,xmax:200,ymin:0,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xlab:'protocols',ylab:'caught'})});
 },10);
 setTimeout(()=>{
  atlasSafe('c41',()=>{const ns=[50,100,200],all=ns.map(x=>bench2(x,seed));lineChart('c41',{title:'False alarms vs size',series:[{color:'var(--ink)',pts:ns.map((x,j)=>[x,all[j].fp])}],xmin:50,xmax:200,ymin:0,ymax:Math.max(2,...all.map(b=>b.fp+1)),yfmt:v=>Math.round(v),xfmt:v=>Math.round(v),xlab:'protocols',ylab:'false alarms'})});
  atlasSafe('c42',()=>{const r=R(),order=['CONTROL_MISSING','PIPETTE_RANGE','WELL_OVERFLOW','WELL_MISSING','REAGENT_EMPTY'];const any=[],allf=[];for(let k=1;k<=5;k++){let aHit=0,fHit=0;for(const b of bases){const ch=shuffle([...order],r).slice(0,k);let st=b,cfg=GCFG;const tk=new Set();for(const t of ch){const rj=inject(t,st,cfg,r,tk);st=rj.steps;cfg=rj.cfg}const cs=new Set(codesOf(st,cfg));if(ch.some(t=>cs.has(t)))aHit++;if(ch.every(t=>cs.has(t)))fHit++}any.push([k,100*aHit/n]);allf.push([k,100*fHit/n])}lineChart('c42',{title:'Any vs all found',series:[{name:'any found',color:'var(--ink)',pts:any},{name:'all found',color:'var(--mute)',dash:true,pts:allf}],xmin:1,xmax:5,ymin:0,ymax:100,yfmt:fmtp,xfmt:v=>Math.round(v),xticks:[1,2,3,4,5],xlab:'errors injected',ylab:'protocols'})});
  atlasSafe('c44',()=>{const sizes=[100,500,1000,2000],cfgT={stock:{buffer:1e15},dead:0,pmin:1,pmax:1e9,cap:1e15,rows:'ABCDEFGH',cols:12,ctrl:{},nosnap:true};const pts=sizes.map(s=>{const st=[...Array(s)].map((_,i)=>[i+1,'buffer',ALLW[i%96],20]);const ts=[];for(let q=0;q<5;q++){const t0=performance.now();sim(st,cfgT);ts.push(performance.now()-t0)}ts.sort((a,b)=>a-b);return[s,ts[2]]});lineChart('c44',{title:'Check time',series:[{color:'var(--ink)',pts}],xmin:100,xmax:2000,ymin:0,ymax:Math.max(1,...pts.map(p=>p[1]))*1.1,yfmt:v=>v.toFixed(1),xfmt:v=>v>=1000?(v/1000)+'k':v,xlab:'steps',ylab:'ms (median of 5)'})});
 },30);
 setTimeout(()=>{
  const bb=bench2(n,seed);
  atlasSafe('c51',()=>{grid('c51',{rl:SCOPE.map(s=>s.split('_')[0]),cl:SCOPE.map(s=>s.split('_')[0]),vals:bb.single.slice(0,5).map(r=>SCOPE.map(c=>100*(r.conf[c]||0)/r.n)),max:100,fmt:v=>Math.round(v)+'%'})});
  atlasSafe('c52',()=>{const r=R();const med=SCOPE.map(t=>{const ps=[];for(const b of bases){const rj=inject(t,b,GCFG,r,new Set());const fr=sim(rj.steps,rj.cfg).frames;const i=fr.findIndex(f=>f.errs.length);if(i>=0)ps.push(100*i/Math.max(1,fr.length))}ps.sort((a,b)=>a-b);return ps.length?ps[Math.floor(ps.length/2)]:0});barChart('c52',{title:'First report position',bars:SCOPE.map((t,i)=>({label:t.split('_')[0],v:Math.round(med[i])})),ymax:100,ylab:'median % into run'})});
  atlasSafe('c53',()=>{const r=R(),order=['CONTROL_MISSING','PIPETTE_RANGE','WELL_OVERFLOW','WELL_MISSING','REAGENT_EMPTY'],vc={};for(const b of bases){const ch=shuffle([...order],r).slice(0,2);let st=b,cfg=GCFG;const tk=new Set();for(const t of ch){const rj=inject(t,st,cfg,r,tk);st=rj.steps;cfg=rj.cfg}const L=codesOf(st,cfg).length;vc[L]=(vc[L]||0)+1}const ks=Object.keys(vc).map(Number).sort((a,b)=>a-b);barChart('c53',{title:'Reports with 2 errors',bars:ks.map(k=>({label:String(k),v:vc[k]})),ylab:'protocols'})});
  atlasSafe('c80',()=>{dotPlot('c80',bb.single.slice(0,5).map(r=>{const[l,h]=wilson(r.hit,r.n);return{label:r.t,v:100*r.hit/r.n,lo:l*100,hi:h*100,color:'var(--ink)'}}))});
 },60);
 setTimeout(()=>{
  atlasSafe('c54',()=>{const sub=bases.slice(0,50),sig=sub.map(s=>new Set(s.map(([,r,w,v])=>r+':'+w+':'+Math.floor(v/20))));const jac=(a,b)=>{let u=0;for(const x of a)if(b.has(x))u++;return u/(a.size+b.size-u)};const vals=[];for(let i=0;i<sub.length;i++)for(let j=i+1;j<sub.length;j++)vals.push(jac(sig[i],sig[j]));const c=atlasHist(vals,10,0,1.01);barChart('c54',{title:'Similarity distribution',bars:c.map((v,i)=>({label:(i/10).toFixed(1),v})),ylab:'pairs'})});
  atlasSafe('c55',()=>{const pts=bases.map(b=>[b.length*1.0+0,b.reduce((a,[,r,,v])=>a+(r==='buffer'?v:0),0)]);const xs=bases.map(b=>[b.reduce((a,[,r,,v])=>a+(r==='sample'?v:0),0),b.reduce((a,[,r,,v])=>a+(r==='buffer'?v:0),0)]);lineChart('c55',{title:'Buffer vs sample',series:[{color:'var(--ink)',line:false,dots:true,pts:xs}],xmin:0,xmax:800,ymin:0,ymax:2500,yfmt:v=>Math.round(v),xfmt:v=>Math.round(v),xlab:'sample µL',ylab:'buffer µL'})});
  atlasSafe('c56',()=>{const pts=bases.map(b=>[Object.keys(wellsOf(b)).length,b.length]);lineChart('c56',{title:'Steps vs wells',series:[{color:'var(--ink)',line:false,dots:true,pts}],xmin:5,xmax:25,ymin:8,ymax:24,yfmt:v=>Math.round(v),xfmt:v=>Math.round(v),xlab:'wells used',ylab:'steps'})});
  atlasSafe('c43',()=>{const vc={};for(const b of bases){const L=codesOf(b,GCFG).length;vc[L]=(vc[L]||0)+1}const r=R(),order=['CONTROL_MISSING','PIPETTE_RANGE','WELL_OVERFLOW','WELL_MISSING','REAGENT_EMPTY'],vi={};for(const b of bases){const ch=shuffle([...order],r).slice(0,3);let st=b,cfg=GCFG;const tk=new Set();for(const t of ch){const rj=inject(t,st,cfg,r,tk);st=rj.steps;cfg=rj.cfg}const L=codesOf(st,cfg).length;vi[L]=(vi[L]||0)+1}const ks=[...new Set([...Object.keys(vc),...Object.keys(vi)].map(Number))].sort((a,b)=>a-b);const W2=560;let h='';const mx=Math.max(1,...ks.map(k=>Math.max(vc[k]||0,vi[k]||0)));const bw=(W2-120)/ks.length;ks.forEach((k,i)=>{const x=60+i*bw;h+=`<rect x="${x}" y="${200-(vc[k]||0)/mx*170}" width="${bw/2-2}" height="${((vc[k]||0)/mx*170).toFixed(1)}" style="fill:var(--pass)"><title>clean ${k}: ${vc[k]||0}</title></rect><rect x="${x+bw/2}" y="${200-(vi[k]||0)/mx*170}" width="${bw/2-2}" height="${((vi[k]||0)/mx*170).toFixed(1)}" style="fill:var(--fail)"><title>injected ${k}: ${vi[k]||0}</title></rect><text class="c-t" x="${x+bw/2}" y="214" text-anchor="middle">${k}</text>`});h+=`<text class="c-l" x="80" y="20" style="fill:var(--pass)">clean</text><text class="c-l" x="150" y="20" style="fill:var(--fail)">3 errors</text>`;svgOut('c43',W2,230,h,'Reports clean vs injected')});
 },90);
 setTimeout(()=>{
  const tx=taxRun(bases,seed);
  $('#tE').innerHTML=tx.map((r,i)=>`<tr><td>${i+1}</td><td>${r.v}</td><td style="color:var(--mute)">${r.d}</td><td><code class="${r.e!=='none'&&r.e!=='any'?'k':''}">${r.e}</code></td><td class="num">${r.n}</td><td class="num">${r.hit}</td><td class="num">${(100*r.hit/r.n).toFixed(1)}%</td></tr>`).join('');
  atlasSafe('c57',()=>barChart('c57',{title:'Flag rate per variant',bars:tx.map((r,i)=>({label:String(i+1),v:100*r.hit/r.n,color:r.e==='none'?'var(--warn)':r.e==='any'?'var(--mute)':'var(--ink)'})),ymax:100,ylab:'% flagged'}));
  atlasSafe('c58',()=>{const g=i=>100*tx[i].hit/tx[i].n;barChart('c58',{title:'Boundary pairs',bars:[{label:'19 pass?no',v:g(0),color:'var(--fail)'},{label:'exact 0?',v:g(4),color:'var(--pass)'},{label:'cap exact',v:g(6),color:'var(--pass)'},{label:'cap +5',v:g(7),color:'var(--fail)'},{label:'dead exact',v:g(14),color:'var(--pass)'},{label:'dead edge',v:g(13),color:'var(--fail)'}],ymax:100,ylab:'% flagged'})});
  atlasSafe('c59',()=>{const idx=[11,12];barChart('c59',{title:'No-rule faults',bars:idx.map(i=>({label:tx[i].v.split(' ')[0],v:100*tx[i].hit/tx[i].n})),ymax:100,ylab:'% flagged (any code)'})});
  atlasSafe('c60',()=>{const agg={};for(const i of [3,11,12])for(const c in tx[i].cc)agg[c]=(agg[c]||0)+tx[i].cc[c];const ks=Object.keys(agg);barChart('c60',{title:'Codes from rule-less faults',bars:ks.map(k=>({label:k.split('_')[0],v:agg[k]})),ylab:'reports'})});
  /* tF seed table */
  $('#tF').innerHTML=[7,8,9,10,11].map(s=>{const bs=bset(n,s);let fp=0,tot=0;for(const b of bs){if(codesOf(b,GCFG).length)fp++;tot+=b.reduce((a,x)=>a+x[3],0)}return`<tr><td>${s}</td><td class="num">${n}</td><td class="num">${(bs.reduce((a,b)=>a+b.length,0)/n).toFixed(1)}</td><td class="num">${Math.round(tot/n)}</td><td class="num">${fp}</td></tr>`}).join('');
 },120);
 setTimeout(()=>{
  /* H figures */
  atlasSafe('c73',()=>{const steps=['volume in range?','stock left?','well fits?','well exists?','+ controls at end'];let h='';steps.forEach((s,i)=>{const y=14+i*30;h+=`<rect x="150" y="${y}" width="260" height="22" rx="4" style="fill:var(--ink)" opacity=".12"/><text class="c-t" x="280" y="${y+15}" text-anchor="middle">${s}</text>`;if(i<4)h+=`<line x1="280" x2="280" y1="${y+22}" y2="${y+30}" style="stroke:var(--ink)"/>`});svgOut('c73',560,170,h,'Rule order')});
  atlasSafe('c74',()=>{let h=`<text class="c-t" x="20" y="20">stock[buffer] 1000 → 900 → 800</text><rect x="20" y="28" width="300" height="14" style="fill:var(--rule)"/><rect x="20" y="28" width="240" height="14" style="fill:var(--buf)"/><text class="c-t" x="20" y="62">wells[B1] 0 → 100 → 100</text><rect x="20" y="70" width="300" height="14" style="fill:var(--rule)"/><rect x="20" y="70" width="150" height="14" style="fill:var(--sam)"/><text class="c-t" x="20" y="110" style="fill:var(--mute)">two counters per entity, updated every step</text>`;svgOut('c74',560,130,h,'Simulator state')});
  atlasSafe('c75',()=>{const sizes=[100,500,1000,2000],cfgT={stock:{buffer:1e15},dead:0,pmin:1,pmax:1e9,cap:1e15,rows:'ABCDEFGH',cols:12,ctrl:{},nosnap:true};const pts=sizes.map(s=>{const st=[...Array(s)].map((_,i)=>[i+1,'buffer',ALLW[i%96],20]);const ts=[];for(let q=0;q<3;q++){const t0=performance.now();sim(st,cfgT);ts.push(performance.now()-t0)}ts.sort((a,b)=>a-b);return[s,ts[1]/s*1000]});lineChart('c75',{title:'Cost per step',series:[{color:'var(--ink)',pts}],xmin:100,xmax:2000,ymin:0,ymax:Math.max(1,...pts.map(p=>p[1]))*1.2,yfmt:v=>v.toFixed(2),xfmt:v=>v>=1000?(v/1000)+'k':v,xlab:'steps',ylab:'µs per step'})});
  atlasSafe('c76',()=>{const means=[0,1,2,3].map(k=>{if(!k)return 0;const r=R(),order=['CONTROL_MISSING','PIPETTE_RANGE','WELL_OVERFLOW','WELL_MISSING','REAGENT_EMPTY'];let tot=0;for(const b of bases){const ch=shuffle([...order],r).slice(0,k);let st=b,cfg=GCFG;const tk=new Set();for(const t of ch){const rj=inject(t,st,cfg,r,tk);st=rj.steps;cfg=rj.cfg}tot+=codesOf(st,cfg).length}return tot/n});barChart('c76',{title:'Reports vs faults',bars:means.map((v,k)=>({label:String(k),v:+v.toFixed(1)})),ylab:'mean reports'})});
  bin('c77','Distance outside range',[1,5,10,19,50,200],d=>codesOf([[1,'buffer','A1',100],[2,'sample','A12',50],[3,'dye','B1',20-d]],DEF).length>0);
  bin('c78','Over the well limit',[1,5,10,50,100],d=>codesOf([[1,'buffer','A1',100],[2,'sample','A12',50],[3,'buffer','E5',200+d]],DEF).length>0);
  bin('c79','Short by µL',[1,2,5,10,20],d=>{const u=120;return codesOf([[1,'buffer','A1',100],[2,'sample','A12',50],[3,'dye','F1',u+d]],{...DEF,stock:{buffer:1000,dye:2*u,sample:120}}).length>0});
 },150);
 $('#tgo').onclick=renderAtlas;
}

/* navigation */

function go(id){
 $$('section[data-p]').forEach(s=>s.classList.toggle('on',s.dataset.p===id));
 $$('#nav button').forEach(b=>b.dataset.go===id?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'));
 if(id==='results')runBench();if(id==='build')drawBuilder();if(id==='validate'&&$('#vout').textContent.startsWith('Results appear'))vrun();
  if(id==='data'){renderLib();renderReal();renderRetro()}if(id==='analysis')renderAnalysis();if(id==='atlas')renderAtlas();
  try{if(history.replaceState)history.replaceState(null,'','#/'+id)}catch(e){}
  window.scrollTo(0,0)}
$$('[data-go]').forEach(e=>e.addEventListener('click',ev=>{ev.preventDefault();go(e.dataset.go)}));

const VALID=['home','build','validate','data','analysis','atlas','method','results','report','glossary'];

let startPage='home';try{const h=(location.hash||'').replace(/^#\/?/,'');if(VALID.includes(h))startPage=h}catch(e){}
draw();go(startPage);
