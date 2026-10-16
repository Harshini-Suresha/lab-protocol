/* LabCheck charts: SVG primitives and data figures. */
const fmtp=v=>Math.round(v)+'%';

function lineChart(id,o){const W=560,H=250,L=50,R=14,T=14,B=38,xmin=o.xmin,xmax=o.xmax,ymin=o.ymin,ymax=o.ymax,
 X=v=>L+(v-xmin)/((xmax-xmin)||1)*(W-L-R),Y=v=>H-B-(v-ymin)/((ymax-ymin)||1)*(H-T-B);let h='';
 if(o.band)h+=`<rect x="${L}" width="${W-L-R}" y="${Y(o.band[1])}" height="${Y(o.band[0])-Y(o.band[1])}" style="fill:var(--rule)" opacity=".55"/>`;
 for(const a of o.areas||[])h+=`<polygon points="${[...a.top,...[...a.bottom].reverse()].map(p=>X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join(' ')}" style="fill:${a.color}" opacity=".75"><title>${a.name}</title></polygon>`;
 const yt=[0,1,2,3,4].map(i=>ymin+(ymax-ymin)*i/4),yf=o.yfmt||(v=>+v.toFixed(1));
 for(const t of yt)h+=`<line class="c-grid" x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}"/><text class="c-t" x="${L-6}" y="${Y(t)+3}" text-anchor="end">${yf(t)}</text>`;
 const xt=o.xticks||[0,1,2,3,4].map(i=>xmin+(xmax-xmin)*i/4),xf=o.xfmt||(v=>+v.toFixed(1));
 for(const t of xt)h+=`<text class="c-t" x="${X(t)}" y="${H-B+15}" text-anchor="middle">${xf(t)}</text>`;
 h+=`<line class="c-ax" x1="${L}" x2="${W-R}" y1="${H-B}" y2="${H-B}"/><line class="c-ax" x1="${L}" x2="${L}" y1="${T}" y2="${H-B}"/>`;
 for(const l of o.hlines||[])h+=`<line x1="${L}" x2="${W-R}" y1="${Y(l.y)}" y2="${Y(l.y)}" style="stroke:var(--fail)" stroke-dasharray="4 3"/><text class="c-t" x="${W-R}" y="${Y(l.y)-4}" text-anchor="end" style="fill:var(--fail)">${l.label}</text>`;
 for(const l of o.vlines||[])h+=`<line x1="${X(l.x)}" x2="${X(l.x)}" y1="${T}" y2="${H-B}" style="stroke:var(--fail)" stroke-dasharray="4 3"/><text class="c-t" x="${X(l.x)+4}" y="${T+10}" style="fill:var(--fail)">${l.label}</text>`;
 for(const s of o.series){if(s.line!==false)h+=`<polyline fill="none" style="stroke:${s.color}" stroke-width="2"${s.dash?' stroke-dasharray="4 3"':''} points="${s.pts.map(p=>X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join(' ')}"/>`;
  if(s.dots||s.pts.length<=24)for(const p of s.pts)h+=`<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${s.pts.length>100?2:3}" style="fill:${p[2]||s.color}"/>`}
 if(o.xlab)h+=`<text class="c-l" x="${(L+W-R)/2}" y="${H-4}" text-anchor="middle">${o.xlab}</text>`;
 if(o.ylab)h+=`<text class="c-l" transform="translate(12 ${(T+H-B)/2}) rotate(-90)" text-anchor="middle">${o.ylab}</text>`;
 (o.areas||[]).forEach((a,i)=>h+=`<text class="c-l" x="${L+10+i*72}" y="${T+10}" style="fill:${a.color}">${a.name}</text>`);
 if(o.series.length>1)o.series.forEach((s,i)=>h+=`<text class="c-l" x="${L+10+i*72}" y="${H-B-8}" style="fill:${s.color}">${s.name}</text>`);
 $('#'+id).innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title||'chart')}">${h}</svg>`}

function barChart(id,o){const W=560,H=250,L=50,R=14,T=14,B=36,n=o.bars.length;
 if(!n){$('#'+id).innerHTML='<p class="mono" style="color:var(--mute)">Nothing to plot.</p>';return}
 const ymax=o.ymax||Math.max(1,...o.bars.map(b=>b.v)),bw=(W-L-R)/n,Y=v=>H-B-v/ymax*(H-T-B);let h='';
 for(let i=0;i<=4;i++){const t=ymax*i/4;h+=`<line class="c-grid" x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}"/><text class="c-t" x="${L-6}" y="${Y(t)+3}" text-anchor="end">${Math.round(t)}</text>`}
 o.bars.forEach((b,i)=>{const x=L+i*bw+bw*.12;h+=`<rect x="${x.toFixed(1)}" y="${Y(b.v).toFixed(1)}" width="${(bw*.76).toFixed(1)}" height="${(H-B-Y(b.v)).toFixed(1)}" style="fill:${b.color||'var(--ink)'}"><title>${esc(b.label)}: ${b.v}</title></rect><text class="c-t" x="${(x+bw*.38).toFixed(1)}" y="${H-B+14}" text-anchor="middle">${esc(b.label)}</text>`});
 if(o.hline)h+=`<line x1="${L}" x2="${W-R}" y1="${Y(o.hline.y)}" y2="${Y(o.hline.y)}" style="stroke:var(--fail)" stroke-dasharray="4 3"/><text class="c-t" x="${W-R}" y="${Y(o.hline.y)-4}" text-anchor="end" style="fill:var(--fail)">${o.hline.label}</text>`;
 h+=`<line class="c-ax" x1="${L}" x2="${W-R}" y1="${H-B}" y2="${H-B}"/><line class="c-ax" x1="${L}" x2="${L}" y1="${T}" y2="${H-B}"/>`;
 if(o.ylab)h+=`<text class="c-l" transform="translate(12 ${(T+H-B)/2}) rotate(-90)" text-anchor="middle">${o.ylab}</text>`;
 $('#'+id).innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title||'chart')}">${h}</svg>`}

function heat(id,m,mx){const W=560,H=280,L=24,T=22,cw=(W-L-4)/12,ch=(H-T-4)/8;let h='';
 for(let c=0;c<12;c++)h+=`<text class="c-t" x="${(L+c*cw+cw/2).toFixed(1)}" y="${T-7}" text-anchor="middle">${c+1}</text>`;
 for(let r=0;r<8;r++){h+=`<text class="c-t" x="${L-7}" y="${(T+r*ch+ch/2+3).toFixed(1)}" text-anchor="end">${ROWS[r]}</text>`;
  for(let c=0;c<12;c++){const v=m[r][c],q=Math.min(1,v/mx);h+=`<rect x="${(L+c*cw+1).toFixed(1)}" y="${(T+r*ch+1).toFixed(1)}" width="${(cw-2).toFixed(1)}" height="${(ch-2).toFixed(1)}" style="fill:color-mix(in srgb,var(--ink) ${(q*85).toFixed(0)}%,transparent)"><title>${ROWS[r]}${c+1}: ${v.toFixed(1)} µL average</title></rect><text class="c-t" x="${(L+c*cw+cw/2).toFixed(1)}" y="${(T+r*ch+ch/2+3).toFixed(1)}" text-anchor="middle" style="fill:${q>.5?'var(--paper)':'var(--ink)'}">${Math.round(v)}</text>`}}
 $('#'+id).innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Average volume per well">${h}</svg>`}

const colsR={buffer:'var(--buf)',sample:'var(--sam)',dye:'var(--dye)'},rgbOf=o=>`rgb(${o.c.map(x=>Math.round(x/o.v)).join(',')})`;

function svgOut(id,W,H,h,label){$('#'+id).innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${h}</svg>`}

function boxPlot(id,gs,o){const W=560,H=250,L=50,R=14,T=14,B=36,n=gs.length,bw=(W-L-R)/n,Y=v=>H-B-v/o.ymax*(H-T-B);let h='';
 for(let i=0;i<=4;i++){const t=o.ymax*i/4;h+=`<line class="c-grid" x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}"/><text class="c-t" x="${L-6}" y="${Y(t)+3}" text-anchor="end">${Math.round(t)}</text>`}
 gs.forEach((g,i)=>{const v=[...g.vals].sort((a,b)=>a-b),q=p=>v[Math.floor(p*(v.length-1))],cx=L+i*bw+bw/2,x=cx-bw*.22,w=bw*.44;
  h+=`<line x1="${cx}" x2="${cx}" y1="${Y(q(.9))}" y2="${Y(q(.1))}" style="stroke:var(--ink)"/><rect x="${x}" y="${Y(q(.75))}" width="${w}" height="${Math.max(1,Y(q(.25))-Y(q(.75)))}" style="fill:${g.color}" opacity=".8"/><line x1="${x}" x2="${x+w}" y1="${Y(q(.5))}" y2="${Y(q(.5))}" style="stroke:var(--ink)" stroke-width="2"/><text class="c-t" x="${cx}" y="${H-B+14}" text-anchor="middle">${g.label}</text>`});
 h+=`<line class="c-ax" x1="${L}" x2="${W-R}" y1="${H-B}" y2="${H-B}"/><line class="c-ax" x1="${L}" x2="${L}" y1="${T}" y2="${H-B}"/><text class="c-l" transform="translate(12 ${(T+H-B)/2}) rotate(-90)" text-anchor="middle">${o.ylab}</text>`;
 svgOut(id,W,H,h,'Box plot')}

function dotPlot(id,rows){const W=560,rh=30,L=130,R=20,T=8,H=rows.length*rh+T+34,X=v=>L+v/100*(W-L-R);let h='';
 for(const t of [0,25,50,75,100])h+=`<line class="c-grid" x1="${X(t)}" x2="${X(t)}" y1="${T}" y2="${H-26}"/><text class="c-t" x="${X(t)}" y="${H-12}" text-anchor="middle">${t}%</text>`;
 rows.forEach((r,i)=>{const y=T+i*rh+rh/2;h+=`<text class="c-t" x="${L-8}" y="${y+3}" text-anchor="end">${r.label}</text><line x1="${X(r.lo)}" x2="${X(r.hi)}" y1="${y}" y2="${y}" style="stroke:${r.color}" stroke-width="2"/><circle cx="${X(r.v)}" cy="${y}" r="4.5" style="fill:${r.color}"><title>${esc(r.label)}: ${r.v.toFixed(1)}%</title></circle>`});
 svgOut(id,W,H,h,'Detection rates')}

function grid(id,o){const W=560,L=o.L||78,T=30,cw=(W-L-6)/o.cl.length,ch=o.ch||32,H=T+ch*o.rl.length+(o.xlab?22:6);let h='';
 o.cl.forEach((c,j)=>h+=`<text class="c-t" x="${(L+j*cw+cw/2).toFixed(1)}" y="${T-9}" text-anchor="middle">${c}</text>`);
 o.rl.forEach((r,i)=>{h+=`<text class="c-t" x="${L-7}" y="${T+i*ch+ch/2+3}" text-anchor="end">${r}</text>`;
  o.cl.forEach((c,j)=>{const v=o.vals[i][j],q=Math.min(1,v/o.max),mk=o.mark&&o.mark[0]===i&&o.mark[1]===j;
   h+=`<rect x="${(L+j*cw+1).toFixed(1)}" y="${T+i*ch+1}" width="${(cw-2).toFixed(1)}" height="${ch-2}" style="fill:color-mix(in srgb,var(--ink) ${(q*85).toFixed(0)}%,transparent)"${mk?' stroke="var(--fail)" stroke-width="2"':''}><title>${esc(r)} / ${esc(c)}: ${v.toFixed(1)}</title></rect><text class="c-t" x="${(L+j*cw+cw/2).toFixed(1)}" y="${T+i*ch+ch/2+3}" text-anchor="middle" style="fill:${q>.5?'var(--paper)':'var(--ink)'}">${o.fmt?o.fmt(v):Math.round(v)}</text>`})});
 if(o.xlab)h+=`<text class="c-l" x="${(L+W)/2}" y="${H-4}" text-anchor="middle">${o.xlab}</text>`;
 if(o.ylab)h+=`<text class="c-l" transform="translate(10 ${(T+H)/2}) rotate(-90)" text-anchor="middle">${o.ylab}</text>`;
 svgOut(id,W,H,h,'Grid')}

function renderFlow(fr){const W=560,H=270,LX=84,RX=W-84,nw=10,rs=Object.keys(S0),link={};let total=0;
 const wo=[...new Set(fr.filter(f=>f.valid).map(f=>f.w))].sort((a,b)=>a[0].localeCompare(b[0])||(+a.slice(1))-(+b.slice(1)));
 for(const f of fr)if(f.valid){const k=f.r+'|'+f.w;link[k]=(link[k]||0)+f.v;total+=f.v}
 if(!total){$('#c9').innerHTML='<p class="mono" style="color:var(--mute)">Nothing to plot.</p>';return}
 const gap=wo.length>8?4:8,sc=(H-20-gap*(Math.max(wo.length,rs.length)-1))/total,ry={},rt={},wy={},wt={};let y=10;
 for(const r of rs){rt[r]=wo.reduce((a,w)=>a+(link[r+'|'+w]||0),0);ry[r]=y;y+=rt[r]*sc+(rt[r]?gap:0)}
 y=10;for(const w of wo){wt[w]=rs.reduce((a,r)=>a+(link[r+'|'+w]||0),0);wy[w]=y;y+=wt[w]*sc+gap}
 const lo={...ry},ro={...wy},xm=(LX+nw+RX)/2;let h='';
 for(const r of rs)for(const w of wo){const v=link[r+'|'+w];if(!v)continue;const hh=v*sc,y0=lo[r],y1=ro[w];lo[r]+=hh;ro[w]+=hh;
   h+=`<path d="M${LX+nw},${y0.toFixed(1)} C${xm},${y0.toFixed(1)} ${xm},${y1.toFixed(1)} ${RX},${y1.toFixed(1)} L${RX},${(y1+hh).toFixed(1)} C${xm},${(y1+hh).toFixed(1)} ${xm},${(y0+hh).toFixed(1)} ${LX+nw},${(y0+hh).toFixed(1)} Z" style="fill:${colsR[r]||'var(--ink)'}" opacity=".55"><title>${r} → ${w}: ${v} µL</title></path>`}
  for(const r of rs)if(rt[r])h+=`<rect x="${LX}" y="${ry[r].toFixed(1)}" width="${nw}" height="${(rt[r]*sc).toFixed(1)}" style="fill:${colsR[r]||'var(--ink)'}"/><text class="c-t" x="${LX-6}" y="${(ry[r]+rt[r]*sc/2+3).toFixed(1)}" text-anchor="end">${r} ${rt[r]}</text>`;
 for(const w of wo)h+=`<rect x="${RX}" y="${wy[w].toFixed(1)}" width="${nw}" height="${(wt[w]*sc).toFixed(1)}" style="fill:var(--ink)"/><text class="c-t" x="${RX+nw+5}" y="${(wy[w]+wt[w]*sc/2+3).toFixed(1)}">${w} ${wt[w]}</text>`;
 svgOut('c9',W,H,h,'Flow from reagents to wells')}

function renderFilm(fr,cap){const n=fr.length,cols=4,tw=126,cell=tw/12,th=22+8*cell,rowsN=Math.ceil(n/cols),H=rowsN*(th+10)+4;let h='';cap=cap||DEF.cap;
 fr.forEach((f,j)=>{const ox=(j%cols)*(tw+14)+6,oy=Math.floor(j/cols)*(th+10)+2,bad=f.errs.length>0;
  h+=`<text class="c-t" x="${ox}" y="${oy+10}" style="fill:${bad?'var(--fail)':'var(--mute)'}">${f.i}: ${f.r} → ${esc(f.w)} ${f.v}</text>`;
  for(let r=0;r<8;r++)for(let c=0;c<12;c++){const o=f.wells[ROWS[r]+(c+1)],cx=(ox+c*cell+cell/2).toFixed(1),cy=(oy+22+r*cell+cell/2).toFixed(1);
    h+=o?`<circle cx="${cx}" cy="${cy}" r="${(cell*.42*Math.sqrt(Math.min(1,o.v/cap))+1).toFixed(1)}" style="fill:${o.v>cap?'var(--fail)':rgbOf(o)}"/>`:`<circle cx="${cx}" cy="${cy}" r="1.4" style="fill:var(--rule)"/>`}
  if(f.valid){const m=wxy(f.w);h+=`<circle cx="${(ox+m.ci*cell+cell/2).toFixed(1)}" cy="${(oy+22+m.ri*cell+cell/2).toFixed(1)}" r="${(cell*.5).toFixed(1)}" fill="none" style="stroke:${bad?'var(--fail)':'var(--ink)'}" stroke-width="1.2"/>`}
  else h+=`<text class="c-t" x="${ox+tw}" y="${oy+10}" text-anchor="end" style="fill:var(--fail)">✕</text>`});
 svgOut('c10',560,H,h,'Plate after each step')}

function renderCum(fr){const n=fr.length,rs=[...new Set(fr.map(f=>f.r))],cum0={};rs.forEach(k=>cum0[k]=0);const cum=[{...cum0}];
  for(const f of fr){const c={...cum[cum.length-1]};c[f.r]=(c[f.r]||0)+f.v;cum.push(c)}
  const areas=[];let lower=cum.map(()=>0);
  for(const r of rs){const upper=cum.map((c,j)=>lower[j]+(c[r]||0));areas.push({name:r,color:colsR[r]||'var(--ink)',top:upper.map((v,j)=>[j,v]),bottom:lower.map((v,j)=>[j,v])});lower=upper}
 lineChart('c11',{title:'Liquid moved so far',series:[],areas,xmin:0,xmax:Math.max(n,1),ymin:0,ymax:Math.max(1,lower[n]*1.05),yfmt:v=>Math.round(v),xfmt:v=>Math.round(v),xticks:n<=12?[...Array(n+1).keys()]:null,xlab:'after step',ylab:'µL moved'})}

function renderProb(r){const bars=r.frames.map(f=>({label:String(f.i),v:f.errs.length,color:f.errs.length?'var(--fail)':'var(--rule)'}));
 bars.push({label:'end',v:r.miss.length,color:r.miss.length?'var(--fail)':'var(--rule)'});barChart('c12',{title:'Problems per step',bars,ymax:4,ylab:'problems'})}

function renderPipeline(){
  const W=560,H=180,L=40,R=40,T=20,B=20;
  const stages=[{name:'Parse',desc:'Read JSON/YAML\nExtract reagents,\nsteps, labware',color:'var(--buf)'},{name:'Simulate',desc:'Track stock &\nwell volumes\nper step',color:'var(--sam)'},{name:'Check',desc:'Test 6 rules\nafter each step\n+ control check',color:'var(--dye)'},{name:'Report',desc:'List step, rule,\nmessage for each\nviolation',color:'var(--ink)'}];
  const bw=(W-L-R)/stages.length;
  let h='';
  stages.forEach((s,i)=>{const x=L+i*bw+bw/2;
    h+=`<rect x="${L+i*bw+4}" y="${T+4}" width="${bw-8}" height="${H-T-B-40}" rx="6" style="fill:${s.color}" opacity=".15"/>`;
    h+=`<text class="c-t" x="${x}" y="${T+24}" text-anchor="middle" style="font-weight:600;font-size:15px;fill:${s.color}">${s.name}</text>`;
    h+=`<text class="c-t" x="${x}" y="${T+50}" text-anchor="middle" style="font-size:11px">${s.desc.split('\n').map((ln,j)=>`<tspan x="${x}" dy="${j?'1.2em':'0'}">${ln}</tspan>`).join('')}</text>`;
    if(i<stages.length-1){const ax=L+(i+1)*bw;
      h+=`<path d="M${ax-8},${H/2} L${ax+8},${H/2}" style="stroke:var(--ink);stroke-width:2" marker-end="url(#arrow)"/>`;
      h+=`<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 Z" fill="var(--ink)"/></marker></defs>`;
    }
  });
  svgOut('c25',W,H,h,'Validation pipeline');
}

function renderRules(){
  const rules=[
    {code:'PIPETTE_RANGE',cond:'step.ul < pipette.min ∨ step.ul > pipette.max',when:'During step',color:'var(--buf)'},
    {code:'REAGENT_EMPTY',cond:'stock[step.from] < 0',when:'During step',color:'var(--dye)'},
    {code:'WELL_OVERFLOW',cond:'wells[step.to] > well_capacity',when:'During step',color:'var(--sam)'},
    {code:'WELL_MISSING',cond:'step.to ∉ plate grid',when:'During step',color:'var(--warn)'},
    {code:'CONTROL_MISSING',cond:'∃ control well: wells[w] = 0',when:'After all steps',color:'var(--fail)'},
    {code:'DEAD_VOLUME',cond:'0 ≤ stock[r] < dead_volume (only if not already empty)',when:'During step (opt-in)',color:'var(--mute)'},
  ];
  const W=560,H=280,L=100,T=30,B=30,rh=34;
  let h=`<text class="c-t" x="${W/2}" y="${T-10}" text-anchor="middle" style="font-weight:600;font-size:14px">Rule trigger conditions</text>`;
  h+=`<line class="c-ax" x1="${L}" x2="${W-30}" y1="${T+rh*6+4}" y2="${T+rh*6+4}"/>`;
  h+=`<line class="c-ax" x1="${L}" x2="${L}" y1="${T}" y2="${T+rh*6+4}"/>`;
  h+=`<text class="c-t" x="${L-8}" y="${T-4}" text-anchor="end" style="font-weight:500">Code</text>`;
  h+=`<text class="c-t" x="${L+120}" y="${T-4}" text-anchor="middle" style="font-weight:500">Condition</text>`;
  h+=`<text class="c-t" x="${W-40}" y="${T-4}" text-anchor="end" style="font-weight:500">When</text>`;
  rules.forEach((r,i)=>{const y=T+i*rh+rh/2;
    h+=`<rect x="${L-4}" y="${T+i*rh}" width="${W-L-26}" height="${rh-2}" style="fill:${r.color}" opacity=".08"/>`;
    h+=`<text class="mono" x="${L}" y="${y+4}" style="fill:${r.color};font-weight:500">${r.code}</text>`;
    h+=`<text class="mono" x="${L+120}" y="${y+4}" text-anchor="middle" style="font-size:11px">${r.cond}</text>`;
    h+=`<text class="c-t" x="${W-40}" y="${y+4}" text-anchor="end" style="font-size:11px;color:var(--mute)">${r.when}</text>`;
  });
  svgOut('c26',W,H,h,'Rule trigger conditions');
}

function renderSchema(){
  const W=560,H=220,L=40,R=40,T=20,B=20;
  const fields=[
    {name:'plate',type:'96 | 384',req:true,desc:'Well grid & default capacity'},
    {name:'reagents',type:'{name: µL}',req:true,desc:'Starting volume per reagent'},
    {name:'pipette',type:'{min,max} µL',req:false,desc:'Default 20–300 (P300)'},
    {name:'well_capacity',type:'µL',req:false,desc:'Default 200'},
    {name:'dead_volume',type:'µL',req:false,desc:'Default 0 (opt-in rule)'},
    {name:'controls',type:'{well: "neg"|"pos"}',req:false,desc:'Default A1 neg, A12 pos'},
    {name:'steps',type:'[{from,to,ul}]',req:true,desc:'Ordered transfers'},
  ];
  const rh=24;
  let h=`<text class="c-t" x="${W/2}" y="${T-8}" text-anchor="middle" style="font-weight:600;font-size:14px">LabCheck protocol schema (JSON)</text>`;
  fields.forEach((f,i)=>{const y=T+i*rh+rh/2;
    h+=`<rect x="${L}" y="${T+i*rh}" width="${W-L-R}" height="${rh-2}" rx="3" style="fill:${f.req?'var(--buf)':'var(--sam)'}" opacity=".1"/>`;
    h+=`<text class="mono" x="${L+8}" y="${y+3}" style="fill:${f.req?'var(--buf)':'var(--ink)'};font-weight:${f.req?'600':'400'}">${f.name}${f.req?' *' : ''}</text>`;
    h+=`<text class="mono" x="${L+140}" y="${y+3}" style="color:var(--mute);font-size:11px">${f.type}</text>`;
    h+=`<text class="c-t" x="${W-R-8}" y="${y+3}" text-anchor="end" style="font-size:11px;color:var(--mute)">${f.desc}</text>`;
  });
  h+=`<text class="c-t" x="${W/2}" y="${H-6}" text-anchor="middle" style="font-size:11px;color:var(--mute)">* required field</text>`;
  svgOut('c27',W,H,h,'Protocol schema');
}

function jaccard(a,b){const u=[...a].filter(x=>b.has(x)).length;return u/(a.size+b.size-u)||0}

function atlasSafe(id,fn){try{fn()}catch(e){const el=document.getElementById(id);if(el)el.innerHTML='<p class="mono" style="color:var(--fail)">Chart failed: '+esc(String((e&&e.message)||e))+'</p>'}}

function atlasHist(vals,bins,lo,hi){const c=Array(bins).fill(0);for(const v of vals)c[Math.min(bins-1,Math.max(0,Math.floor((v-lo)/(hi-lo)*bins)))]++;return c}
