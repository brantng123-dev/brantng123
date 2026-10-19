/* =====================================================================
   Scheme Generator v2
   Input (4 steps) → compile into the geometry engine → evaluate every
   scheme family with the answer-template rules → scheme catalogue and
   template-style framing plans.
   ===================================================================== */

/* ---------- Settings and rules (Answer_Template_v1 / BN_PrelimDetail_Check) ---------- */
const DEF_SET = {
  tol:15, step:250, minSize:500,
  slabRC:150, slabComp:125, sdSlab:26, sdSec:23, sdMain:26, sdCant:7, cantRC:5, cantSt:7,
  kRC:20, kSt:17.8, ef:1.25, tf:1.5, nRC:27.7, nComp:39.95, fcuB:45, py:355, sdPT:20, plateRatio:6, wallRatio:6, inclMax:0.25,
  slenderBraced:15, maxGrad:6, maxStopFloors:2, colGroups:4, colPrefRC:1000, colPrefSt:750, zoneOffset:1, layouts:1, cantGrid:2.5, cantRef:0, spRound:0.25, spanRC:12, spanSt:18, maxLayouts:30, maxBay:20, sdFlat:26, vcFlat:0.6
};
const SET_LABELS = {
  tol:'"Slightly off" tolerance (%)', step:'Size step (mm)', minSize:'Min. column size (mm)',
  slabRC:'RC slab thickness (mm)', slabComp:'Composite slab thickness (mm)', sdSlab:'Slab S/D limit', sdSec:'Secondary beam S/D (×10/L if L>10)', sdMain:'Main / transfer beam S/D (×10/L if L>10)', sdCant:'Cantilever S/D limit',
  cantRC:'RC cantilever max. span (m)', cantSt:'Steel cantilever max. span (m)',
  kRC:'RC load per floor (kPa)', kSt:'Steel WULS per floor (kPa)', ef:'Elastic factor (columns)', tf:'Transfer factor', nRC:'RC column N/Ac (fcu60, 2%)', nComp:'Composite column N/Ac', fcuB:'Beam fcu (MPa)', py:'Steel py (MPa)',
  sdPT:'PT girder S/D (not in template)', plateRatio:'Transfer plate span/thickness', wallRatio:'Storey-deep wall span/height limit', inclMax:'Inclined column max. offset/height', slenderBraced:'Column slenderness limit (braced)', maxGrad:'Ramp: max. gradient 1 : n (default n)', maxStopFloors:'Max. floors on long-span beams above a restricted zone (else transfer)', layouts:'Generate column layouts (1 = yes, 0 = only the architectural grid)', spanRC:'RC: max. column spacing on the typical grid (m)', spanSt:'Steel: max. column spacing on the typical grid (m)', cantGrid:'Generated grids: max. end cantilever (m, 0 = none)', cantRef:'End cantilever measured from: 0 = column centre, 1 = column face', spRound:'Round column spacing to (m, 0 = exact division)', maxLayouts:'Max. column layouts fully checked', maxBay:'Max. column spacing tried (m)', sdFlat:'Flat slab span / eff. depth (with drops)', vcFlat:'Flat slab vc for punching (MPa)', zoneOffset:'Columns at restricted-zone edge: 1 = offset outside (face on zone edge), 0 = keep on grid', colGroups:'Column types: 4 = two sizes (preferred size + one larger), 1 = uniform, 2 = interior / edge, 3 = + transfer support, 0 = each column', colPrefRC:'RC preferred column size (mm)', colPrefSt:'Steel (encased) preferred column size (mm)'
};
const KINDS = [
  ['core','Core wall (rigid support)'],
  ['colfree','Column-free zone'],
  ['periph','No internal column — columns only on the periphery (e.g. guest rooms + corridor)'],
  ['nocol','No column / protection zone (e.g. MTR)'],
  ['void','Atrium / void (no slab, no column)'],
  ['dbl','Double height (no slab, columns kept)'],
  ['ramp','Sloped slab / ramp (floors = low~top)'],
  ['spacing','Min. column spacing zone (overrides the floor type)'],
  ['outside','No building'],
  ['keep','Columns must continue (transfer them)'],
  ['wall','Wall row (e.g. tower cross walls)']
];
const KIND_NAME = Object.fromEntries(KINDS);
const UB355 = __UB355__;
const UC355 = __UC355__;
const UC_AREA = [['UC 305x305x118',150],['UC 305x305x137',174],['UC 356x368x153',195],['UC 305x305x158',201],['UC 356x368x177',226],['UC 305x305x198',252],['UC 356x368x202',257],['UC 356x406x235',299],['UC 305x305x240',306],['UC 356x406x287',366],['UC 356x406x340',433],['UC 356x406x393',501],['UC 356x406x467',595],['UC 356x406x551',702],['UC 356x406x634',808]];
const IMPOSED = {OFFICE:3,SHOP:5,RETAIL:5,'MAIN LOBBY':5,'E&M':7,'REFUGE FLOOR':5,ROOF:2,GUESTROOM:2,PLANTROOM:7.5,CINEMA:5,BALLROOM:5,STADIUM:5,LIBRARY:5,'STORAGE ROOM':5,CARPARK:3};

/* ---------- Examples ---------- */
const EX_Q2 = {
  title:'2012 Q2 Shopping Mall',
  floors:{basements:3,ground:'G/F',top:6,skip:'',roof:'R/F',h:5,hr:3.8,sv:0.3,use:'SHOP',ll:5},
  exc:[
    {floors:'B3/F~B2/F',h:4,hr:2.7,sv:0.3,use:'CARPARK',ll:3,free:true},
    {floors:'B1/F',h:6.5,hr:5.0,sv:0.3,use:'CARPARK',ll:3,free:true},
    {floors:'G/F',h:6,hr:4.5,sv:0.3,use:'SHOP',ll:5,free:false},
    {floors:'5/F',h:7.5,hr:6.0,sv:0.3,use:'CINEMA',ll:5,free:false},
    {floors:'6/F',h:5,hr:3.5,sv:0.3,use:'PLANTROOM',ll:7.5,free:true}],
  grid:{xl:'1-8',xs:'10,10,10,10,10,10,10',yl:'A-E',ys:'10,10,10,10'},
  grid2:{on:false,name:'T',xl:'',xs:'',yl:'',ys:'',ox:0,oy:0,floors:'',cols:false},
  types:[
    {name:'Basement car park',floors:'B3/F~B1/F',x:'',y:'',minSp:'',spType:'c',noWall:false},
    {name:'G/F shops',floors:'G/F',x:'',y:'',minSp:8,spType:'c',noWall:true},
    {name:'1/F~4/F shops',floors:'1/F~4/F',x:'1~6',y:'',minSp:8,spType:'c',noWall:true},
    {name:'5/F cinema',floors:'5/F',x:'1~6',y:'',minSp:8,spType:'c',noWall:true},
    {name:'6/F plant floor',floors:'6/F',x:'1~6',y:'',minSp:'',spType:'c',noWall:false}],
  cons:[
    {kind:'core',name:'Service core',x:'1~2',y:'B~D',floors:'',head:'',svc:'',n:'',dx:'',dy:''},
    {kind:'void',name:'Atrium',x:'3~5',y:'B~D',floors:'1/F~4/F',head:17,svc:'',n:'',dx:'',dy:''},
    {kind:'colfree',name:'Cinema 15x15 column-free',x:'3+5~5',y:'B+5~D',floors:'5/F',head:'',svc:'',n:'',dx:'',dy:''}],
  site:{ground:6.0,gwl:5.0,rock:-14,raft:1.5,adjacent:true},
  set:{...DEF_SET}
};
const EX_BLANK = {
  title:'New question',
  floors:{basements:0,ground:'G/F',top:3,skip:'',roof:'R/F',h:4,hr:3,sv:0.3,use:'OFFICE',ll:3},
  exc:[], grid:{xl:'1-4',xs:'9,9,9',yl:'A-C',ys:'9,9'}, grid2:{on:false,name:'T',xl:'',xs:'',yl:'',ys:'',ox:0,oy:0,floors:'',cols:false},
  types:[{name:'Typical',floors:'',x:'',y:'',minSp:'',spType:'c',noWall:false}], cons:[], mylays:[], site:{ground:5,gwl:2,rock:-20,raft:1.0,adjacent:false}, set:{...DEF_SET}
};

let W;
try { W=JSON.parse(localStorage.getItem('schemeGen.v2')); } catch(e){ W=null; }
W = normW(W&&W.floors?W:EX_Q2);
function normW(d){ const w={...clone(EX_BLANK),...clone(d)}; w.set={...DEF_SET,...(d.set||{})}; ['exc','types','cons','mylays'].forEach(k=>{ if(!Array.isArray(w[k])) w[k]=[]; }); w.grid2={...EX_BLANK.grid2,...(d.grid2||{})}; w.site={...EX_BLANK.site,...(d.site||{})}; return w; }
function saveW(){ try{ localStorage.setItem('schemeGen.v2',JSON.stringify(W)); }catch(e){} }

/* ---------- Parsers ---------- */
const normF=s=>String(s??'').toUpperCase().replace(/[\s\/]/g,'').replace(/F$/,'');
function genFloors(F){
  const out=[]; const nb=Math.max(0,Math.round(num(F.basements)||0)), top=Math.max(0,Math.round(num(F.top)||0));
  const skip=new Set(String(F.skip||'').split(/[,\s]+/).map(s=>s.trim()).filter(Boolean).map(Number));
  for (let i=nb;i>=1;i--) out.push(`B${i}/F`);
  out.push(String(F.ground||'G/F').trim()||'G/F');
  for (let i=1;i<=top;i++) if(!skip.has(i)) out.push(`${i}/F`);
  return {storeys:out, roof:String(F.roof||'R/F').trim()||'R/F'};
}
function floorSet(spec,names,typeMap){
  const set=new Set(), bad=[]; const idx=n=>names.findIndex(x=>normF(x)===normF(n));
  String(spec??'').split(/[,;]+/).map(t=>t.trim()).filter(Boolean).forEach(tok=>{
    if (typeMap&&typeMap.has(tok)){ typeMap.get(tok).forEach(i=>set.add(i)); return; }
    const parts=tok.split(/\s*(?:~|–|—|\bto\b)\s*/i);
    if (parts.length===1&&/^[^\/]+\/?F?-[^\/]+/.test(tok)&&tok.includes('-')&&idx(tok)<0){ const p=tok.split('-'); if(p.length===2){ parts.length=0; parts.push(...p); } }
    if (parts.length===2){ const a=idx(parts[0]),b=idx(parts[1]); if(a<0||b<0){bad.push(tok);return;} for(let i=Math.min(a,b);i<=Math.max(a,b);i++) set.add(i); }
    else { const a=idx(parts[0]); if(a<0){bad.push(tok);return;} set.add(a); }
  });
  return {set,bad};
}
function genLabels(spec){
  const s=String(spec??'').trim(); const m=s.match(/^\s*([A-Za-z]|\d+)\s*-\s*([A-Za-z]|\d+)\s*$/);
  if (m){
    if (/\d/.test(m[1])){ const a=+m[1],b=+m[2]; const r=[]; for(let i=a;i<=b;i++) r.push(String(i)); return r; }
    const r=[]; let c=m[1].toUpperCase().charCodeAt(0); const e=m[2].toUpperCase().charCodeAt(0);
    for(;c<=e;c++){ const ch=String.fromCharCode(c); if(ch!=='I'&&ch!=='O') r.push(ch); } return r;
  }
  return s.split(/[,\s]+/).filter(Boolean);
}
// spacing tokens: number = centre to centre; e = clear (face to face); f / f< = centre to far face; n / n< = centre to near face; b = boundary to column face (ends only)
function parseSpacing(spec){
  const toks=String(spec??'').split(/[,\s]+/).filter(Boolean); const out={start:null,end:null,bays:[],err:[]};
  toks.forEach((t,i)=>{ const m=t.match(/^([a-zA-Z]?)(<?)(\d+(?:\.\d+)?)$/); if(!m){out.err.push(t);return;}
    const k=(m[1]||'c').toLowerCase(), v=+m[3];
    if (k==='b'){ if(i===0) out.start=v; else if(i===toks.length-1) out.end=v; else out.err.push(t); return; }
    if (!['c','e','f','n'].includes(k)){ out.err.push(t); return; }
    out.bays.push({k,rev:m[2]==='<',v}); });
  return out;
}
function positions(sp,w){ // w: column widths (m) per grid line
  const pos=[]; let x=sp.start!==null?sp.start+w[0]/2:0; pos.push(x);
  sp.bays.forEach((b,i)=>{ const wa=w[i]||0, wb=w[i+1]||0; let d=b.v;
    if (b.k==='e') d=b.v+wa/2+wb/2;
    else if (b.k==='f') d=b.rev?b.v-wa/2:b.v-wb/2;
    else if (b.k==='n') d=b.rev?b.v+wa/2:b.v+wb/2;
    x+=d; pos.push(x); });
  const lo=sp.start!==null?0:pos[0], hi=sp.end!==null?pos.at(-1)+w[w.length-1]/2+sp.end:pos.at(-1);
  return {pos,lo,hi};
}
const roundUp=(x,step)=>Math.ceil(x/step-1e-9)*step;
const lsr=(base,L)=>base*Math.min(1,10/L);
const verdictOf=(ratio,tol)=>ratio<=1+1e-9?'pass':ratio<=1+tol/100+1e-9?'marg':'fail';
const V_ICON={pass:'✅',marg:'⚠️',fail:'❌'}, V_TXT={pass:'PASS',marg:'SLIGHTLY OFF',fail:'NOT FEASIBLE'}, V_RANK={pass:0,marg:1,fail:2};

/* ---------- Compile W into the geometry engine's data ---------- */
function compile(W, wx, wy, lay){
  const err=[]; const G=genFloors(W.floors); const names=G.storeys; const ns=names.length;
  const lv=names.map(n=>({name:n,h:num(W.floors.h),head:num(W.floors.hr),svc:num(W.floors.sv)??0,free:false,use:W.floors.use||'',ll:num(W.floors.ll)}));
  (W.exc||[]).forEach((e,i)=>{ const r=floorSet(e.floors,names); r.bad.forEach(b=>err.push(`Exception row ${i+1}: floor "${b}" not found`));
    r.set.forEach(s=>{ const L=lv[s]; ['h','hr','sv','ll'].forEach(k=>{ const v=num(e[k]); if(v!==null){ if(k==='hr') L.head=v; else if(k==='sv') L.svc=v; else L[k]=v; } }); if(e.use) L.use=e.use; L.free=!!e.free; }); });
  const levels=[...lv.map(l=>({name:l.name,h:l.h,head:l.head,svc:l.svc,free:l.free,use:l.use})),{name:G.roof,h:'',head:'',svc:'',free:false,use:'ROOF'}];
  const xl=genLabels(W.grid.xl), yl=genLabels(W.grid.yl);
  const sx=parseSpacing(W.grid.xs), sy=parseSpacing(W.grid.ys);
  if (sx.err.length) err.push(`X spacing: cannot read "${sx.err.join(', ')}"`); if (sy.err.length) err.push(`Y spacing: cannot read "${sy.err.join(', ')}"`);
  if (sx.bays.length!==xl.length-1) err.push(`X: ${xl.length} grid lines need ${xl.length-1} spacings (found ${sx.bays.length})`);
  if (sy.bays.length!==yl.length-1) err.push(`Y: ${yl.length} grid lines need ${yl.length-1} spacings (found ${sy.bays.length})`);
  const px=positions(sx,wx||xl.map(()=>0)), py=positions(sy,wy||yl.map(()=>0));
  const dpos=a=>a.pos.slice(1).map((p,i)=>+(p-a.pos[i]).toFixed(4)).join(',');
  const grids=[{name:'M',xLabels:xl.join(','),xSp:dpos(px),yLabels:yl.join(','),ySp:dpos(py),ox:px.pos[0],oy:py.pos[0],s1:'',s2:'',cols:true}];
  if (W.grid2&&W.grid2.on){ const g=W.grid2; const r=floorSet(g.floors,names); const ids=[...r.set].sort((a,b)=>a-b);
    grids.push({name:g.name||'T',xLabels:genLabels(g.xl).join(','),xSp:g.xs,yLabels:genLabels(g.yl).join(','),ySp:g.ys,ox:num(g.ox)||0,oy:num(g.oy)||0,s1:ids.length?names[ids[0]]:'',s2:ids.length?names[ids.at(-1)]:'',cols:!!g.cols}); }
  // floor types
  const typeOf=names.map(()=>0); const typeMap=new Map();
  (W.types||[]).forEach((t,ti)=>{ const r=floorSet(t.floors,names); r.bad.forEach(b=>err.push(`Floor type "${t.name}": floor "${b}" not found`)); r.set.forEach(s=>typeOf[s]=ti); });
  (W.types||[]).forEach((t,ti)=>typeMap.set(t.name,names.map((n,i)=>i).filter(i=>typeOf[i]===ti)));
  const runs=ids=>{ const r=[]; let a=null,p=null; [...ids].sort((x,y)=>x-y).forEach(i=>{ if(a===null){a=i;p=i;} else if(i===p+1) p=i; else {r.push([a,p]);a=i;p=i;} }); if(a!==null) r.push([a,p]); return r; };
  const zones=[], walls=[];
  const rng2=(s,lo,hi,ax)=>{ const t=String(s??'').trim(); if(!t) return [`@${lo}`,`@${hi}`]; const p=t.split(/\s*~\s*/); return p.length===2?p:[p[0],p[0]]; };
  const bx={lo:px.lo,hi:px.hi}, by={lo:py.lo,hi:py.hi};
  (W.types||[]).forEach((t,ti)=>{ const ids=names.map((n,i)=>i).filter(i=>typeOf[i]===ti); const [x1,x2]=rng2(t.x,bx.lo,bx.hi), [y1,y2]=rng2(t.y,by.lo,by.hi);
    runs(ids).forEach(([a,b])=>zones.push({type:'footprint',name:t.name,x1,x2,y1,y2,s1:names[a],s2:names[b],head:'',svc:''})); });
  (W.cons||[]).forEach((c,ci)=>{ const r=floorSet(c.floors||'',names,typeMap); r.bad.forEach(b=>err.push(`Constraint "${c.name||ci+1}": floor "${b}" not found`));
    const ids=String(c.floors||'').trim()?[...r.set]:names.map((n,i)=>i);
    const [x1,x2]=rng2(c.x,bx.lo,bx.hi), [y1,y2]=rng2(c.y,by.lo,by.hi);
    runs(ids).forEach(([a,b])=>{
      if (c.kind==='wall') walls.push({name:c.name||'Wall',x1,y1,x2,y2,s1:names[a],s2:names[b],n:num(c.n)||1,dx:num(c.dx)||0,dy:num(c.dy)||0});
      else if (c.kind==='periph') zones.push({type:'colfree',name:c.name||'Rooms',x1,x2,y1,y2,s1:names[a],s2:names[b],head:'',svc:'',periph:true,partsSp:{x:String(c.px||''),y:String(c.py||'')}});
      else if (c.kind==='spacing') zones.push({type:'spacing',name:c.name||'Spacing zone',x1,x2,y1,y2,s1:names[a],s2:names[b],head:'',svc:'',minSp:num(c.sp),spType:c.spt||'c'});
      else if (c.kind==='ramp'){ if(a===b){ err.push(`Ramp "${c.name||ci+1}": give the floors as low~top (e.g. B1/F~G/F)`); return; }
        zones.push({type:'dbl',name:c.name||'Ramp',x1,x2,y1,y2,s1:names[a],s2:names[b],head:'',svc:'',ramp:{dir:c.dir||'+X',grad:num(c.grad)||null,tr:c.rcol==='plate'}});
        if (c.rcol==='plate'){ zones.push({type:'colfree',name:(c.name||'Ramp')+' (no column below)',x1,x2,y1,y2,s1:names[a],s2:names[b-1],head:'',svc:''}); if(b<names.length) zones.push({type:'keep',name:(c.name||'Ramp')+' (columns land on ramp)',x1,x2,y1,y2,s1:names[b],s2:names[names.length-1],head:'',svc:''}); }
        if (c.rcol==='no') zones.push({type:'colfree',name:(c.name||'Ramp')+' (no column through)',x1,x2,y1,y2,s1:names[a],s2:names[b-1],head:'',svc:''}); }
      else zones.push({type:c.kind==='nocol'?'colfree':c.kind,name:c.name||KIND_NAME[c.kind],x1,x2,y1,y2,s1:names[a],s2:names[b],head:c.head??'',svc:c.svc??'',nocol:c.kind==='nocol'});
    }); });
  const res=(v,ax)=>{ const P=ax==='x'?px.pos:py.pos, labs=ax==='x'?xl:yl; const t=String(v??'').replace(/\s+/g,''); if(!t||t.includes(':')||t[0]==='@') return v;
    const m=t.match(/^(.+?)([+-]\d+(?:\.\d+)?)?$/); if(!m) return v; let i=labs.indexOf(m[1]); if(i<0) i=labs.findIndex(l=>l.toUpperCase()===m[1].toUpperCase()); if(i<0) return v; return '@'+(+(P[i]+(m[2]?+m[2]:0)).toFixed(4)); };
  zones.forEach(z=>{ z.x1=res(z.x1,'x'); z.x2=res(z.x2,'x'); z.y1=res(z.y1,'y'); z.y2=res(z.y2,'y');
    if (z.partsSp){ const toNum=v=>{ const t=String(v).replace('@',''); return num(t); }; const pp=(sp,a)=>{ const l=String(sp).split(/[,\s]+/).map(num).filter(v=>v>0); if(!l.length) return null; let v=toNum(a); if(v===null) return null; const out=[v]; l.forEach(d=>{ v+=d; out.push(+v.toFixed(3)); }); return out; };
      const fit=(P,a,b)=>{ if(!P) return null; const lo=toNum(a), hi=toNum(b); P=P.filter(v=>v<hi-TOL); P.push(hi); return P; };
      z.parts={x:fit(pp(z.partsSp.x,z.x1),z.x1,z.x2),y:fit(pp(z.partsSp.y,z.y1),z.y1,z.y2)}; delete z.partsSp; } });
  walls.forEach(w=>{ w.x1=res(w.x1,'x'); w.x2=res(w.x2,'x'); w.y1=res(w.y1,'y'); w.y2=res(w.y2,'y'); });
  let sxl=xl, syl=yl;
  const gDef=(nm,g,s1,s2)=>({name:nm,xLabels:g.x.labels.join(','),xSp:dpos(g.x),yLabels:g.y.labels.join(','),ySp:dpos(g.y),ox:g.x.pos[0],oy:g.y.pos[0],s1,s2,cols:true});
  if (lay&&lay.sg){ const g=lay.sg; sxl=g.x.labels; syl=g.y.labels; grids[0]=gDef('M',g,'',''); }
  if (lay&&lay.bands){ const bs=lay.bands; sxl=bs[0].g.x.labels; syl=bs[0].g.y.labels;
    bs.forEach((b,i)=>{ const gd=gDef(i?'U'+(i>1?i:''):'M',b.g,names[b.from],names[(bs[i+1]?bs[i+1].from:ns)-1]); if(i===0) grids[0]=gd; else grids.splice(i,0,gd); }); }
  // transfer mode: columns above a column-free zone / void continue and are transferred at the zone roof
  if (lay&&lay.tmode==='keep') zones.filter(z=>z.type==='void'||z.type==='colfree').slice().forEach(z=>{ const i=names.indexOf(z.s2); const f=Math.max(i+1,lay.from??i+1); if(i>=0&&f<ns) zones.push({type:'keep',name:'Transfer over '+z.name,x1:z.x1,x2:z.x2,y1:z.y1,y2:z.y2,s1:names[f],s2:names[ns-1],head:'',svc:''}); });
  const S={title:W.title,grids,levels,zones,walls,columns:[],removed:[],specials:[],
    site:{refLevel:String(W.floors.ground||'G/F'),refMpd:num(W.site.ground),gwl:num(W.site.gwl),rock:num(W.site.rock),raftT:num(W.site.raft)||1,adjacent:!!W.site.adjacent,soils:[]},
    rules:{minSpacing:0,wallsBanned:(W.types||[]).some(t=>t.noWall),autoStop:true},params:{...DEFAULT_PARAMS,inclMax:W.set.inclMax,plate:W.set.plateRatio,rcWall:W.set.wallRatio}};
  return {S,err,names,typeOf,lv,px,py,xl:sxl,yl:syl,axl:xl,ayl:yl,G};
}

/* ---------- Schemes ---------- */
const SCHEMES=[
  {id:'R1',mat:'rc',name:'IN-SITU RC BEAM AND SLAB WITH COLUMN AND CORE WALL',sys:['RC']},
  {id:'R2',mat:'rc',name:'IN-SITU RC BEAM AND SLAB AND TRANSFER BEAM SYSTEM WITH COLUMN AND CORE WALL',sys:['RC','RCWALL'],needCarry:true},
  {id:'R3',mat:'rc',name:'IN-SITU RC BEAM AND SLAB AND TRANSFER PLATE SYSTEM WITH COLUMN AND CORE WALL',sys:['PLATE','RC'],needCarry:true,must:'PLATE'},
  {id:'R4',mat:'rc',name:'IN-SITU RC BEAM AND SLAB WITH INCLINED COLUMN AND CORE WALL',sys:['INCL','RC'],needCarry:true,must:'INCL'},
  {id:'R5',mat:'rc',name:'IN-SITU RC BEAM AND SLAB SUPPORTED BY HANGER COLUMN IN TURN SUPPORTED BY STEEL TRUSS AT ROOF LEVEL',sys:['HANG','RC'],must:'HANG'},
  {id:'R6',mat:'rc',name:'IN-SITU RC BEAM AND SLAB WITH POST-TENSIONED LONG-SPAN / TRANSFER GIRDERS',sys:['RC','PT'],note:'Post-tensioning is not in your template — use only if you are comfortable justifying it.',must:'PT'},
  {id:'S1',mat:'st',name:'STEEL COMPOSITE BEAM AND SLAB SYSTEM WITH COLUMN AND BRACED CORE WALL',sys:['ST']},
  {id:'S2',mat:'st',name:'STEEL COMPOSITE BEAM AND SLAB AND TRANSFER TRUSS SYSTEM WITH COLUMN AND BRACED CORE WALL',sys:['ST','STRUSS'],must:'STRUSS'},
  {id:'S3',mat:'st',name:'STEEL COMPOSITE BEAM AND SLAB SUPPORTED BY BRACED CORE WALL AND HANGER COLUMN IN TURN SUPPORTED BY STEEL TRUSS AT ROOF LEVEL',sys:['HANG','ST'],must:'HANG'}
];
// required column spacing at a point: a spacing zone wins over the floor type
function spReqAt(M,C,s,x,y){ const z=M.zones.find(z=>z.type==='spacing'&&z.minSp&&M.zAct(z,s)&&x>z.x1-TOL&&x<z.x2+TOL&&y>z.y1-TOL&&y<z.y2+TOL);
  if (z) return {v:z.minSp,e:z.spType==='e',where:z.name,ti:null}; const t=W.types[C.typeOf[s]]||{}; const v=num(t.minSp); return v?{v,e:t.spType==='e',where:t.name,ti:C.typeOf[s]}:null; }
const gridAt=(M,s)=>M.grids.filter(g=>g.cols).find(g=>s>=g.s1&&s<=g.s2)||M.grids[0];
const pickSec=(list,Mreq,Ireq)=>list.slice().sort((a,b)=>a[1]-b[1]).find(r=>r[2]>=Mreq&&r[1]>=Ireq);
const secDepth=n=>{ const m=String(n).match(/(\d+)x/); return m?+m[1]/1000:null; };

/* Column layouts. Each axis: the architectural grid, the total length divided into n equal bays (bay between the
   minimum column spacing and maxBay) with end cantilevers 0 / 2.5 / 5 m, and grids aligned to core / zone edges.
   X x Y x {columns stop at restricted zones | columns continue and are transferred}; plus two-band layouts with a
   different grid above a transfer level (top of a restricted zone or a plant / refuge floor).
   Stage 1 screens geometry quickly (spacing, cantilever, spans); stage 2 fully checks the best, most varied ones. */
function* layoutGen(W){
  const C=compile(W,null,null); const archLay={id:'A',arch:true,sg:null,tmode:'stop',gkey:'arch',nx:0,ny:0};
  if (C.err.length) return [archLay];
  const M=buildModel(C.S); if (M.err.length) return [archLay];
  const st=W.set, r=v=>Math.round(v*1000)/1000, cgC=Math.max(0,num(st.cantGrid)??2.5)+(+st.cantRef===1?Math.max(num(st.colPrefRC)||0,num(st.colPrefSt)||0)/2000:0), maxBay=num(st.maxBay)||20, names=C.names, ns=names.length;
  const minSp=Math.max(0,...(W.types||[]).map(t=>(num(t.minSp)||0)+(num(t.minSp)&&t.spType==='e'?1:0)));
  const bays=pos=>pos.slice(1).map((p,i)=>+(p-pos[i]).toFixed(2));
  const bayTxt=pos=>{ const b=bays(pos); const out=[]; b.forEach(v=>{ const l=out.at(-1); if(l&&Math.abs(l.v-v)<0.01) l.n++; else out.push({v,n:1}); }); return out.map(o=>(o.n>1?o.n+'@':'')+f2(o.v).replace(/\.?0+$/,'')).join(' + ')+` = ${f1(pos.at(-1)-pos[0]).replace(/\.0$/,'')} m`; };
  const archP={x:C.px.pos.map(r),y:C.py.pos.map(r)}, archL={x:C.xl,y:C.yl};
  const labelsFor=(pos,ax)=>{ const ap=archP[ax], al=archL[ax], cnt={}; return pos.map(p=>{ const i=ap.findIndex(a=>Math.abs(a-p)<TOL); if(i>=0) return al[i]; let j=0; ap.forEach((a,k)=>{ if(a<p) j=k; }); const d=p-ap[j]; return al[j]+(d>=0?'+':'')+d.toFixed(2); }); };
  const zAt=(z,s)=>M.zAct(z,s);
  // candidate positions along one axis for the storeys ss
  // minimum spacing for the storeys of one band (a podium and a tower may differ)
  const minSpOf=ss=>Math.max(0,...ss.map(s=>{ const t=W.types[C.typeOf[s]]||{}; return (num(t.minSp)||0)+(num(t.minSp)&&t.spType==='e'?1:0); }));
  const axisC=(ax,ss,maxAx=8)=>{ const minSp=minSpOf(ss);
    const fps=M.zones.filter(z=>z.type==='footprint'&&ss.some(s=>zAt(z,s)));
    const lo=r(Math.min(...fps.map(z=>ax==='x'?z.x1:z.y1))), hi=r(Math.max(...fps.map(z=>ax==='x'?z.x2:z.y2)));
    const inR=v=>v>lo-TOL&&v<hi+TOL; const sets=[]; const push=(pos,kind)=>{ pos=pos.map(r); if(pos.length<2) return; const b=bays(pos); if(b.some(v=>v>maxBay+1e-6)) return; if(!sets.some(o=>o.pos.length===pos.length&&o.pos.every((v,i)=>Math.abs(v-pos[i])<TOL))) sets.push({pos,kind}); };
    const ap=archP[ax].filter(inR); if (ap.length>1) push(ap,'arch');
    // n bays over length L, each a multiple of spRound: equal inner bays, the two end bays take the remainder
    const q=num(st.spRound)||0, isQ=v=>!q||Math.abs(v/q-Math.round(v/q))<1e-6;
    const div=(L,n)=>{ const ex=L/n; if(!q||isQ(ex)||n===1) return Array(n).fill(ex); if(n===2){ const a=Math.round(ex/q)*q; return [a,L-a]; }
      let best=null; for(let b=Math.ceil(ex/q)*q+q;b>=ex-1.5;b-=q){ const e=(L-(n-2)*b)/2; if(!isQ(e)&&isQ(L)) continue; const d=Math.abs(e-b); if(d<=1.5&&(!best||d<best.d)) best={b,e,d}; }
      return best?[best.e,...Array(n-2).fill(best.b),best.e]:Array(n).fill(ex); };
    const seq=(a,bs)=>{ const o=[a]; bs.forEach(v=>o.push(o.at(-1)+v)); return o; };
    const cg=cgC, cOpts=[...new Set([0,cg>=2.5?Math.round(cg/2/0.25)*0.25:null,cg>=3.5?Math.floor((cg-1)/0.25)*0.25:null,Math.floor(cg/0.25+1e-6)*0.25,cg].filter(v=>v!==null&&v>=0))];
    for (const c of cOpts){ const L=hi-lo-2*c; if(L<=0) continue; for(let n=1;n<=40;n++){ const ex=L/n; if(ex<minSp-1e-6) break; if(ex>maxBay+1e-6) continue; const bs=div(L,n); if(Math.min(...bs)<minSp-1e-6) continue; push(seq(lo+c,bs),c?`cantilever ${c} m`:'equal bays'); } }
    // grids on room partitions: every k-th partition with spacing >= the minimum (periphery zones covering the full length)
    M.zones.filter(z=>z.periph&&z.parts&&z.parts[ax]&&ss.some(s=>zAt(z,s))).forEach(z=>{ const P=z.parts[ax]; if(Math.abs(P[0]-lo)>TOL||Math.abs(P.at(-1)-hi)>TOL) return;
      [0,1,2].forEach(extra=>{ const need=Math.max(minSp,0.01)+extra*1.5; const out=[P[0]]; for(let i=1;i<P.length;i++){ if(P[i]-out.at(-1)>=need-1e-6&&(P.at(-1)-P[i]>=need-1e-6||i===P.length-1)) out.push(P[i]); } if(Math.abs(out.at(-1)-P.at(-1))>TOL) out[out.length-1]=P.at(-1); push(out,'on room partitions'); }); });
    // aligned to footprint / core / restricted-zone edges
    const mand=new Set([lo,hi]), pref=new Set();
    M.zones.filter(z=>ss.some(s=>zAt(z,s))).forEach(z=>{ const a=ax==='x'?[z.x1,z.x2]:[z.y1,z.y2]; a.map(r).filter(inR).forEach(v=>(z.type==='footprint'||z.type==='core'?mand:pref).add(v)); });
    let bl=[...mand].sort((a,b)=>a-b); [...pref].sort((a,b)=>a-b).forEach(v=>{ if(bl.every(b=>Math.abs(b-v)>=minSp-1e-6)) bl.push(v); }); bl.sort((a,b)=>a-b);
    [6,7.5,8,8.4,9,10,11,12,13.5,15,16.5,18,20].forEach(t=>{ const out=[bl[0]]; for(let i=0;i<bl.length-1;i++){ const L=bl[i+1]-bl[i]; let n=Math.max(1,Math.round(L/t)); while(n>1&&Math.min(...div(L,n))<minSp-1e-6) n--; seq(bl[i],div(L,n)).slice(1).forEach(v=>out.push(v)); } push(out,'aligned to core / zone edges'); });
    // keep a varied short list: one per (number of bays, longest bay), preferring the simplest kind
    const pri={'on room partitions':-1,arch:0,'equal bays':0,'aligned to core / zone edges':1}; const seen=new Set(), keep=[];
    const add=(o,cap)=>{ const k=(o.pos.length)+'|'+Math.round(Math.max(...bays(o.pos))); if(!seen.has(k)&&keep.length<cap){ seen.add(k); keep.push(o); } };
    sets.filter(o=>!o.kind.startsWith('cantilever')).sort((a,b)=>(pri[a.kind]??3)-(pri[b.kind]??3)).forEach(o=>add(o,maxAx-2));
    sets.filter(o=>o.kind.startsWith('cantilever')).forEach(o=>add(o,maxAx));
    return keep.map(o=>{ const c=r(o.pos[0]-lo); const ct=c>0.01?`${f2(c).replace(/\.?0+$/,'')} cant. + `:''; const t=bayTxt(o.pos); return {...o,labels:labelsFor(o.pos,ax),txt:ct?ct+t.replace(/ = .*$/,'')+` + ${f2(c).replace(/\.?0+$/,'')} cant. = ${f1(hi-lo).replace(/\.0$/,'')} m`:t,maxB:Math.max(...bays(o.pos)),cant:c}; });
  };
  // stage-1 screen: column spacing per floor type, edge cantilever, member spans
  const screen=lay=>{ const Cl=compile(W,null,null,lay); if(Cl.err.length) return null; const Ml=buildModel(Cl.S); if(Ml.err.length) return null;
    let worstSp=Infinity;
    for (let s=0;s<ns;s++){ const cols=Ml.pts.filter(p=>Ml.col[s][p.id]==='col'||Ml.col[s][p.id]==='edge');
      { const lines=new Map(); cols.forEach(p=>{ [['x',p.y,p.x],['y',p.x,p.y]].forEach(([a,k,v])=>{ const key=a+Math.round(k*20); if(!lines.has(key)) lines.set(key,{a,k,vs:[]}); lines.get(key).vs.push(v); }); });
        for (const ln of lines.values()){ const arr=ln.vs.sort((a,b)=>a-b); for(let i=0;i<arr.length-1;i++){ const m=(arr[i]+arr[i+1])/2; const rq=spReqAt(Ml,Cl,s,ln.a==='x'?m:ln.k,ln.a==='x'?ln.k:m); if(!rq) continue; const d=arr[i+1]-arr[i]-(rq.e?0.75:0); worstSp=Math.min(worstSp,d/rq.v); if(d<rq.v-1e-6) return null; } } }
      const fp=Ml.zones.filter(z=>z.type==='footprint'&&Ml.zAct(z,s)); if(!cols.length) continue;
      const cores=Ml.zones.filter(z=>z.type==='core'&&Ml.zAct(z,s));
      for (const z of fp){ const xs=cols.map(p=>p.x).concat(cores.flatMap(c=>[c.x1,c.x2])), ys=cols.map(p=>p.y).concat(cores.flatMap(c=>[c.y1,c.y2])); const c=Math.max(Math.min(...xs)-z.x1,z.x2-Math.max(...xs),Math.min(...ys)-z.y1,z.y2-Math.max(...ys)); if(c>Math.max(cgC,0.3)+1e-6) return null; } }
    const plateOnly=Object.values(Ml.levelInfo).some(li=>li.unresolved&&li.unresolved.length);
    const spans=Ml.members.map(m=>m.span); const mx=spans.length?Math.max(...spans):0; if(mx>30) return null;
    const nCol=Ml.pts.filter(p=>Ml.col.some(row=>row[p.id]==='col'||row[p.id]==='edge')).length;
    // uniform column spacing is preferred: penalise (longest - shortest bay) / mean bay on every grid used
    const unif=pos=>{ const b=bays(pos); const m=b.reduce((a,c)=>a+c,0)/b.length; return b.length>1?(Math.max(...b)-Math.min(...b))/m:0; };
    const gs=lay.bands?lay.bands.flatMap(b=>[b.g.x,b.g.y]):lay.sg?[lay.sg.x,lay.sg.y]:[]; const u=gs.reduce((a,g)=>a+unif(g.pos),0);
    return {score:u*10+mx*0.2+Ml.members.length*0.05+nCol*0.02+(plateOnly?3:0),u,mx,nMem:Ml.members.length,nCol,plateOnly}; };
  const all=ns?[...Array(ns).keys()]:[];
  const X=axisC('x',all), Y=axisC('y',all);
  const needT=M.col.some(row=>row.some(v=>v==='nosupport'));
  // transfer storey: directly above each restricted zone, or at / above a plant / refuge floor higher up
  const starts=new Set(); M.zones.filter(z=>z.type==='void'||z.type==='colfree').forEach(z=>{ if(z.s2+1<ns) starts.add(z.s2+1); C.lv.forEach((l,f)=>{ if(l.free&&f>z.s2){ if(f<ns) starts.add(f); if(f+1<ns) starts.add(f+1); } }); });
  const tms=needT?['stop',...[...starts].sort((a,b)=>a-b).map(f=>'keep@'+f)]:['stop'];
  const cands=[]; const total=X.length*Y.length*tms.length; let done=0;
  for (const gx of X) for (const gy of Y) for (const tm of tms){
    const arch=gx.kind==='arch'&&gy.kind==='arch';
    const lay={arch,sg:arch?null:{x:gx,y:gy},tmode:tm==='stop'?'stop':'keep',from:tm==='stop'?null:+tm.slice(5),tkey:tm,nx:gx.pos.length-1,ny:gy.pos.length-1,gx,gy,gkey:JSON.stringify([gx.pos,gy.pos])};
    const sc=screen(lay); done++; if(done%8===0) yield {phase:'Screening column layouts',i:done,n:total};
    if (sc||arch) cands.push({...lay,scr:sc||{score:99}});
  }
  // stage-2 selection: architectural grid always; then the best layout of each (bays X x bays Y x transfer) family
  const maxL=num(st.maxLayouts)||40; const pick=[]; const fam=new Map();
  cands.filter(c=>c.arch).forEach(c=>pick.push(c));
  cands.filter(c=>!c.arch).sort((a,b)=>a.scr.score-b.scr.score).forEach(c=>{ const k=`${c.nx}x${c.ny}|${c.tkey}`; if(!fam.has(k)) fam.set(k,c); });
  [...fam.values()].sort((a,b)=>a.scr.score-b.scr.score).forEach(c=>{ if(pick.length<maxL) pick.push(c); });
  // two-band layouts: the lower band and the upper band each get their own generated grids, transfer at the boundary
  const gIdx=Math.max(0,names.findIndex(n=>normF(n)===normF(W.floors.ground||'G/F')));
  const splits=new Set(); M.zones.filter(z=>z.type==='void'||z.type==='colfree').forEach(z=>{ if(z.s2+1<ns&&z.s2+1>gIdx) splits.add(z.s2+1); });
  C.lv.forEach((l,i)=>{ if(l.free&&i+1<ns&&i+1>=gIdx) splits.add(i+1); });   // plant / refuge floor (incl. basement plant just below ground)
  if (gIdx>0) splits.add(gIdx);                                              // low-zone transfer at ground (e.g. car park grid below)
  for (let s=1;s<ns;s++) if (C.typeOf[s]!==C.typeOf[s-1]&&s>=gIdx) splits.add(s);  // floor type changes (e.g. podium → guest floors)
  M.zones.filter(z=>z.type==='colfree'&&z.s1>0&&z.s1>=gIdx).forEach(z=>splits.add(z.s1)); // a zone starting above (e.g. rooms from 3/F)
  const bandC=[]; let bd=0; const sub=(a,b)=>a.every(v=>b.some(w=>Math.abs(v-w)<TOL));
  const okSplits=[...splits].filter(u=>u>=1&&ns-u>=2).sort((a,b)=>a-b);
  const nBand=okSplits.length*16*16;
  for (const u of okSplits){ const lo=[], up=[]; for(let s=0;s<u;s++) lo.push(s); for(let s=u;s<ns;s++) up.push(s);
    const LX=axisC('x',lo,4), LY=axisC('y',lo,4), UX=axisC('x',up,4), UY=axisC('y',up,4);
    for (const lx of LX) for (const ly of LY) for (const ux of UX) for (const uy of UY){
      if ((sub(ux.pos,lx.pos)&&sub(uy.pos,ly.pos))||(sub(lx.pos,ux.pos)&&sub(ly.pos,uy.pos))) continue;   // same grid in both bands → not two-band
      const lay={band:{u,lower:{x:lx,y:ly},upper:{x:ux,y:uy}},bands:[{from:0,g:{x:lx,y:ly}},{from:u,g:{x:ux,y:uy}}],tmode:'stop',nx:lx.pos.length-1,ny:ly.pos.length-1,gx:lx,gy:ly,ux,uy,gkey:JSON.stringify([lx.pos,ly.pos,u,ux.pos,uy.pos])};
      const sc=screen(lay); bd++; if(bd%16===0) yield {phase:'Screening two-band layouts',i:bd,n:nBand};
      if (sc) bandC.push({...lay,scr:sc}); } }
  const bf=new Map(); bandC.sort((a,b)=>a.scr.score-b.scr.score).forEach(c=>{ const k=`${c.band.u}|${c.nx}x${c.ny}|${c.ux.pos.length}x${c.uy.pos.length}|${c.scr.plateOnly?1:0}`; if(!bf.has(k)) bf.set(k,c); });
  // keep a fair share for each transfer level
  const byU=new Map(); [...bf.values()].forEach(c=>{ if(!byU.has(c.band.u)) byU.set(c.band.u,[]); byU.get(c.band.u).push(c); });
  const per=Math.max(3,Math.round(maxL/2/Math.max(1,byU.size))); byU.forEach(list=>list.slice(0,per).forEach(c=>pick.push(c)));
  // three bands: best lower grids of the lowest split, best upper grids of the highest split, generated grids in between
  const tri=[]; const uniq=(arr,f)=>{ const m=new Map(); arr.forEach(c=>{ const k=f(c); if(!m.has(k)) m.set(k,c); }); return [...m.values()]; };
  for (let i=0;i<okSplits.length;i++) for (let j=i+1;j<okSplits.length;j++){ const u1=okSplits[i], u2=okSplits[j]; if(u2-u1<1) continue;
    const lows=uniq(bandC.filter(c=>c.band.u===u1),c=>JSON.stringify([c.gx.pos,c.gy.pos])).slice(0,3), tops=uniq(bandC.filter(c=>c.band.u===u2),c=>JSON.stringify([c.ux.pos,c.uy.pos])).slice(0,3);
    const mid=[]; for(let s=u1;s<u2;s++) mid.push(s); const MX=axisC('x',mid,3), MY=axisC('y',mid,3);
    for (const lo of lows) for (const tp of tops) for (const mx of MX) for (const my of MY){
      const same=(a,b)=>sub(a.x.pos,b.x.pos)&&sub(a.y.pos,b.y.pos)&&sub(b.x.pos,a.x.pos)&&sub(b.y.pos,a.y.pos);
      const L0={x:lo.gx,y:lo.gy}, M1={x:mx,y:my}, T2={x:tp.ux,y:tp.uy}; if(same(L0,M1)||same(M1,T2)) continue;
      const lay={band:{u:u1,lower:L0,upper:M1},band3:{u:u2,top:T2},bands:[{from:0,g:L0},{from:u1,g:M1},{from:u2,g:T2}],tmode:'stop',nx:lo.nx,ny:lo.ny,gx:lo.gx,gy:lo.gy,ux:mx,uy:my,gkey:JSON.stringify([L0.x.pos,L0.y.pos,u1,mx.pos,my.pos,u2,T2.x.pos,T2.y.pos])};
      const sc=screen(lay); bd++; if(bd%16===0) yield {phase:'Screening three-band layouts',i:bd,n:bd+1};
      if (sc) tri.push({...lay,scr:sc}); } }
  uniq(tri.sort((a,b)=>a.scr.score-b.scr.score),c=>`${c.band.u}|${c.band3.u}|${c.nx}x${c.ny}|${c.ux.pos.length}x${c.uy.pos.length}`).slice(0,Math.max(3,Math.round(maxL/5))).forEach(c=>pick.push(c));
  // the user's own layouts ("My column layouts"): always fully checked and listed, pass or fail
  const myErr=[]; const fmt=v=>f2(v).replace(/\.?0+$/,'');
  const ext=(ax,ss)=>{ const fps=M.zones.filter(z=>z.type==='footprint'&&ss.some(s=>zAt(z,s))); return [r(Math.min(...fps.map(z=>ax==='x'?z.x1:z.y1))),r(Math.max(...fps.map(z=>ax==='x'?z.x2:z.y2)))]; };
  const myG=(str,ax,ss)=>{ const [lo,hi]=ext(ax,ss); const t=String(str??'').trim();
    if (!t){ const pos=archP[ax].filter(v=>v>lo-TOL&&v<hi+TOL); return {pos,labels:labelsFor(pos,ax),txt:bayTxt(pos),maxB:Math.max(...bays(pos)),cant:0}; }
    const toks=t.split(/[,\s]+/).filter(Boolean); let c0=0, c1=0; const bs=[];
    toks.forEach((k,i)=>{ let m=k.match(/^(\d+(?:\.\d+)?)c$/i); if(m){ if(i===0) c0=+m[1]; else if(i===toks.length-1) c1=+m[1]; else throw `"${k}": a cantilever (c) can only be first or last`; return; }
      m=k.match(/^(\d+)@(\d+(?:\.\d+)?)$/); if(m){ for(let j=0;j<+m[1];j++) bs.push(+m[2]); return; }
      if (/^\d+(?:\.\d+)?$/.test(k)){ bs.push(+k); return; } throw `cannot read "${k}"`; });
    if (!bs.length) throw `${ax.toUpperCase()}: no bays given`;
    const L=c0+c1+bs.reduce((a,b)=>a+b,0); if(Math.abs(L-(hi-lo))>0.05) throw `${ax.toUpperCase()} "${t}" adds up to ${fmt(L)} m but the building is ${fmt(hi-lo)} m long`;
    const pos=[lo+c0]; bs.forEach(b=>pos.push(r(pos.at(-1)+b)));
    return {pos,labels:labelsFor(pos,ax),txt:(c0?`${fmt(c0)} cant. + `:'')+bayTxt(pos).replace(/ = .*$/,'')+(c1?` + ${fmt(c1)} cant.`:'')+` = ${fmt(hi-lo)} m`,maxB:Math.max(...bays(pos)),cant:Math.max(c0,c1),kind:'my layout'}; };
  (W.mylays||[]).forEach((m,i)=>{ const nm=m.name||`My layout ${i+1}`, id='M'+(i+1);
    try {
      const ft=String(m.from??'').trim();
      if (!ft){ const gx=myG(m.x,'x',all), gy=myG(m.y,'y',all);
        (needT?['stop','keep']:['stop']).forEach(tm=>{ const lay={custom:true,myName:nm,myId:id+(tm==='keep'?'T':''),arch:false,sg:{x:gx,y:gy},tmode:tm,from:null,tkey:tm,nx:gx.pos.length-1,ny:gy.pos.length-1,gx,gy,gkey:JSON.stringify(['my',gx.pos,gy.pos,tm])};
          pick.push({...lay,scr:screen(lay)||{score:99,u:0}}); }); }
      else { const u=names.findIndex(n=>normF(n)===normF(ft)); if(u<1) throw `transfer floor "${ft}" not found (or is the lowest floor)`;
        const lo=[...Array(u).keys()], up=[...Array(ns-u).keys()].map(k=>k+u);
        const lx=myG(m.x,'x',lo), ly=myG(m.y,'y',lo), ux=String(m.xu??'').trim()?myG(m.xu,'x',up):myG(m.x,'x',up), uy=String(m.yu??'').trim()?myG(m.yu,'y',up):myG(m.y,'y',up);
        const lay={custom:true,myName:nm,myId:id,band:{u,lower:{x:lx,y:ly},upper:{x:ux,y:uy}},bands:[{from:0,g:{x:lx,y:ly}},{from:u,g:{x:ux,y:uy}}],tmode:'stop',nx:lx.pos.length-1,ny:ly.pos.length-1,gx:lx,gy:ly,ux,uy,gkey:JSON.stringify(['my',lx.pos,ly.pos,u,ux.pos,uy.pos])};
        pick.push({...lay,scr:screen(lay)||{score:99,u:0}}); }
    } catch(e){ myErr.push(`${nm}: ${e.message||e}`); } });
  pick.myErr=myErr;
  let nb=0; pick.forEach((l,i)=>{ l.id=l.custom?l.myId:l.arch&&l.tmode==='stop'&&!l.band?'A':l.arch&&!l.band?'B'+(nb++?nb:''):'L'+(i+1);
    l.ttxt=l.band3?`THREE-BAND GRID, TRANSFER AT ${names[l.band.u]} AND ${names[l.band3.u]}`:l.band?`TWO-BAND GRID, TRANSFER AT ${names[l.band.u]}`:l.tmode==='keep'?`COLUMNS CONTINUE, TRANSFERRED AT ${[...new Set(M.zones.filter(z=>z.type==='void'||z.type==='colfree').map(z=>names[Math.max(z.s2+1,l.from)]).filter(Boolean))].join(' / ')}`:'COLUMNS STOP AT RESTRICTED ZONES (NO TRANSFER)';
    const gx=l.gx||{txt:bayTxt(archP.x)}, gy=l.gy||{txt:bayTxt(archP.y)};
    l.bays={x:gx.txt||bayTxt(archP.x),y:gy.txt||bayTxt(archP.y)};
    l.short=`${l.custom?`MY LAYOUT "${l.myName}": `:''}${l.arch?'ARCHITECTURAL GRID':l.band?`BELOW ${names[l.band.u]}: GRID`:'GRID'} X ${l.bays.x}; Y ${l.bays.y}${l.band?`; ${l.band3?`${names[l.band.u]} ~ ${names[l.band3.u-1]}`:`FROM ${names[l.band.u]} UP`}: X ${l.ux.txt}; Y ${l.uy.txt} `:''}${l.band3?`; FROM ${names[l.band3.u]} UP: X ${l.band3.top.x.txt}; Y ${l.band3.top.y.txt} `:''}; ${l.ttxt}`; });
  return pick;
}
function* evalGen(W){
  const lg=layoutGen(W); let x; while(!(x=lg.next()).done) yield x.value; const lays=x.value;
  const out=[]; let i=0;
  for (const lay of lays){
    let shared=null;
    if (!lay.arch){ const C=compile(W,null,null,lay); if(C.err.length) return {err:C.err}; const M=buildModel(C.S); if(M.err.length) return {err:M.err}; shared={C,M}; }
    for (const sc0 of SCHEMES){
      const sc={...sc0,base:sc0.id,id:sc0.id+(lay.id==='A'?'':'-'+lay.id),lay};
      let C=null, M=null, R=null;
      if (shared){ C=shared.C; M=shared.M; R=assess(W,sc,C,M); }
      else { let wx=null, wy=null; // iterate: column widths influence grid positions when spacing codes are used
        for (let it=0; it<3; it++){ C=compile(W,wx,wy,lay); if (C.err.length) return {err:C.err}; M=buildModel(C.S); if (M.err.length) return {err:M.err}; R=assess(W,sc,C,M);
          const nwx=C.xl.map((l,i)=>R.lineW.x[i]||0), nwy=C.yl.map((l,i)=>R.lineW.y[i]||0); if (wx&&nwx.every((v,i)=>v===wx[i])&&nwy.every((v,i)=>v===wy[i])) break; wx=nwx; wy=nwy; } }
      out.push({sc,C,M,R,lay});
    }
    i++; yield {phase:'Checking schemes',i,n:lays.length};
  }
  // a transfer or a change of column grid must be needed: if the same material still works without it, it is meaningless
  const names=out.length?out[0].C.names:[]; const cache=new Map();
  const viableAlt=(alt,mat)=>{ const key=JSON.stringify([alt.sg?[alt.sg.x.pos,alt.sg.y.pos]:'arch',alt.bands?alt.bands.map(b=>[b.from,b.g.x.pos,b.g.y.pos]):0,alt.tmode,alt.from??null,mat]);
    if (cache.has(key)) return cache.get(key); let ok=false, ls=0;
    if (!alt.sg&&!alt.bands&&alt.tmode==='stop'){ const A=out.filter(e=>e.lay.id==='A'); ok=A.some(e=>e.sc.mat===mat&&feasibleE(e)); ls=A.length?lsFloors(A[0].M):0; }
    else { const C=compile(W,null,null,alt); if(!C.err.length){ const M=buildModel(C.S); if(!M.err.length){ ls=lsFloors(M); ok=SCHEMES.filter(s0=>s0.mat===mat).some(s0=>{ const R=assess(W,{...s0,lay:alt},C,M); return R.applicable&&R.worst!=='fail'; }); } } }
    const r={ok,ls}; cache.set(key,r); return r; };
  // floors that need long-span (non-transfer) members over restricted zones
  function maxCarried(M){ let mx=0; M.tpoints.forEach(t=>{ if(!t.carries) return; const p=M.pmap.get(t.key); if(!p) return; let n=0; for(let s=t.k;s<=M.nL-2&&M.present(M.col[s][p.id]);s++) n++; mx=Math.max(mx,n); }); return mx; }
  function lsFloors(M){ return new Set(M.members.filter(m=>!m.carries).map(m=>m.k)).size; }
  const altsOf=lay=>{ const A=[]; const mk=arr=>arr.length===1?{sg:arr[0].g,tmode:'stop'}:{bands:arr,tmode:'stop'};
    if (lay.tmode==='keep') A.push({what:'the same grid without the transfer (columns stop at the restricted zones)',lay:{...lay,tmode:'stop',from:null}});
    if (lay.bands){ const bs=lay.bands; for(let i=1;i<bs.length;i++){ const lo=bs[i-1].g, hi=bs[i].g;
      const ext=ax=>{ const P=hi[ax].pos, mn=Math.min(...P), mx=Math.max(...P); const pos=[...P,...lo[ax].pos.filter(v=>v<mn-TOL||v>mx+TOL)].sort((a,b)=>a-b); return {pos,labels:pos.map((v,k)=>'S'+k)}; };
      A.push({what:`the lower grid continued above ${names[bs[i].from]} (no transfer there)`,lay:mk(bs.filter((b,j)=>j!==i))});
      A.push({what:`the upper grid continued below ${names[bs[i].from]} (no transfer there)`,lay:mk(bs.map((b,j)=>j===i-1?{from:b.from,g:{x:ext('x'),y:ext('y')}}:b).filter((b,j)=>j!==i))}); } }
    return A; };
  let n2=0; const todo=lays.filter(l=>(l.tmode==='keep'||l.bands)&&!l.custom);
  for (const lay of todo){ const alts=altsOf(lay);
    for (const mat of ['rc','st']){ const es=out.filter(e=>e.lay===lay&&e.sc.mat===mat&&feasibleE(e)); if(!es.length) continue;
      // a transfer that only carries the top storey (e.g. one roof column) is not worth a transfer structure
      const carried=maxCarried(es[0].M); if (carried<2){ es.forEach(e=>{ e.R.meaningless=(carried?'Not needed: the transferred columns carry only the top storey — use a long-span roof / plant-floor member instead.':'Not needed: no column is actually transferred in this layout.'); }); continue; }
      // needed = the alternative fails, or the transfer / grid change saves long-span members on at least two floors
      const own=lsFloors(es[0].M); const hit=alts.find(a=>{ const r=viableAlt(a.lay,mat); return r.ok&&r.ls-own<2; });
      if (hit) es.forEach(e=>{ e.R.meaningless=`Not needed: a ${mat==='rc'?'RC':'steel'} scheme also works with ${hit.what}, with long-span members on about as many floors.`; });
      else es.forEach(e=>{ const a=alts.map(x=>({x,r:viableAlt(x.lay,mat)})).find(y=>y.r.ok); e.R.benefit=a?`Without it (${a.x.what}) long-span members are needed on ${a.r.ls} floors; with it on ${own}.`:'Without it no scheme of this material works.'; }); }
    n2++; yield {phase:'Checking that transfers / grid changes are needed',i:n2,n:todo.length}; }
  // special systems (hanger, inclined column, transfer plate) must be needed: if a plain scheme of the same material works on the same layout, hide it
  out.forEach(e=>{ if(!feasibleE(e)||e.lay.custom) return; const sp=['HANG','INCL','PLATE','RPLATE'].filter(u=>e.R.used.has(u)); if(!sp.length) return;
    const plain=out.find(o=>o.lay===e.lay&&o.sc.mat===e.sc.mat&&o!==e&&!['HANG','INCL','PLATE','RPLATE'].some(u=>o.R.used.has(u))&&o.R.applicable&&o.R.worst!=='fail');
    if (plain) e.R.meaningless=`Not needed: ${plain.sc.id} works on the same layout without the ${sp.map(u=>({HANG:'hanger',INCL:'inclined column',PLATE:'transfer plate',RPLATE:'inclined plate'}[u])).join(' / ')}.`; });
  return {list:out,lays,myErr:lays.myErr||[]};
}
function evaluate(W){ const g=evalGen(W); let x; while(!(x=g.next()).done); return x.value; }
const SYS_CAT={RPLATE:'PLATE',RC:'GIRDER',ST:'GIRDER',PT:'GIRDER',RCWALL:'STOREY-DEEP',STRUSS:'STOREY-DEEP',PLATE:'PLATE',INCL:'INCLINED COLUMN',HANG:'HANGER'};
function layDiff(a,b){ if(a.gkey===b.gkey) return false; if(!!a.band!==!!b.band||!!a.band3!==!!b.band3) return true; if(a.band3&&b.band3&&a.band3.u!==b.band3.u) return true;
  const mb=l=>[l.gx?l.gx.maxB:10,l.gy?l.gy.maxB:10]; const A=mb(a), B=mb(b); if(Math.abs(A[0]-B[0])>=2.5||Math.abs(A[1]-B[1])>=2.5) return true;
  if (a.band&&b.band&&(a.band.u!==b.band.u||a.ux.pos.length!==b.ux.pos.length||a.uy.pos.length!==b.uy.pos.length)) return true; return false; }
function sigOf(e){ const tr=[...new Set([...e.R.used].map(u=>SYS_CAT[u]).filter(Boolean))].sort(); return {lay:e.lay.gkey,tm:e.R.checks.some(c=>c.cat==='Transfer'||c.cat==='Transfer plate'||c.cat==='Inclined column'||c.cat==='Hanger + truss')?'TRANSFER':'NO TRANSFER',floor:e.sc.floor==='flat'?'FLAT SLAB':'BEAM AND SLAB',tr:tr.join(' + ')||'NONE'}; }
// strong = column layout, floor system, or a different transfer principle (plate / hanger / inclined column);
// girder vs storey-deep girder / truss alone is only a member-type change (weak)
const major=t=>t.split(' + ').map(x=>x==='STOREY-DEEP'?'GIRDER':x).filter((v,i,a)=>a.indexOf(v)===i).join(' + ');
function distinctBy(a,b){ const A=sigOf(a), B=sigOf(b), d=[]; if(layDiff(a.lay,b.lay)) d.push('column spacing / layout (framing plan)'); if(A.tm!==B.tm) d.push('transfer vs no transfer (load path)'); if(major(A.tr)!==major(B.tr)) d.push('transfer principle (load path)'); return d; }
function weakDiff(a,b){ const A=sigOf(a), B=sigOf(b); return !distinctBy(a,b).length&&(A.tr!==B.tr||A.lay!==B.lay); }
const feasibleE=e=>e.R.applicable&&e.R.worst!=='fail'&&!e.R.meaningless;
// how different two schemes are, aspect by aspect (the answer pair should differ in as many as possible)
function tLevels(e){ const s=new Set(); Object.values(e.R.ch).forEach(c=>{ if(c&&c.m&&c.m.carries&&!c.inTruss&&c.tag) s.add(c.m.level); });
  e.R.checks.forEach(c=>{ if(c.cat==='Transfer plate') s.add(c.where); if(c.cat==='Hanger + truss'){ const m=c.item.match(/TRUSS IN (\S+)/); if(m) s.add(m[1]); } if(c.cat==='Inclined column') s.add(c.where.split(' ')[0]); }); return s; }
function tTypes(e){ const t=new Set(); ['PLATE','RPLATE','HANG','INCL'].forEach(u=>{ if(e.R.used.has(u)) t.add(u); });
  Object.values(e.R.ch).forEach(c=>{ if(!c||!c.m||!c.m.carries||c.inTruss) return; if(c.sys==='RC'||c.sys==='ST') t.add('GIRDER'); else if(['STRUSS','RCWALL','PT'].includes(c.sys)) t.add(c.sys); }); return t; }
const T_NAME={RPLATE:'inclined transfer plate (ramp)',PLATE:'transfer plate',STRUSS:'storey-deep truss',RCWALL:'storey-deep wall / deep beam',HANG:'hanger + roof truss',INCL:'inclined column',PT:'PT girder',GIRDER:'transfer girder'};
function maxBay(e){ return Math.max(...e.M.grids.filter(g=>g.cols).flatMap(g=>[...g.gx.sp,...g.gy.sp])); }
function aspects(a,b){
  const ta=sigOf(a).tm==='TRANSFER', tb=sigOf(b).tm==='TRANSFER'; const la=tLevels(a), lb=tLevels(b), ya=tTypes(a), yb=tTypes(b);
  const sameSet=(x,y)=>x.size===y.size&&[...x].every(v=>y.has(v));
  const out=[
    {k:'grid',w:3,on:layDiff(a.lay,b.lay),txt:'Column grid'},
    {k:'tr',w:3,on:ta!==tb,txt:'Transfer vs no transfer'},
    {k:'lvl',w:2,on:ta&&tb&&!sameSet(la,lb),txt:'Transfer floor'},
    {k:'type',w:2,on:ta&&tb&&!sameSet(ya,yb),txt:'Transfer type'},
    {k:'span',w:1,on:Math.abs(maxBay(a)-maxBay(b))>=3,txt:'Max. span'}];
  out.forEach(x=>{ x.detail=x.k==='grid'?`${a.lay.bays.x} × ${a.lay.bays.y}${a.lay.band3?' (three-band)':a.lay.band?' (two-band)':''} | ${b.lay.bays.x} × ${b.lay.bays.y}${b.lay.band3?' (three-band)':b.lay.band?' (two-band)':''}`:
    x.k==='tr'?`${ta?'transfer':'no transfer'} | ${tb?'transfer':'no transfer'}`:x.k==='lvl'?`${[...la].join(', ')||'—'} | ${[...lb].join(', ')||'—'}`:
    x.k==='type'?`${[...ya].map(t=>T_NAME[t]).join(', ')||'—'} | ${[...yb].map(t=>T_NAME[t]).join(', ')||'—'}`:`${f1(maxBay(a))} m | ${f1(maxBay(b))} m`; });
  return out;
}
const aScore=as=>as.reduce((t,x)=>t+(x.on?x.w:0),0);
function recPair(L){
  const rank=(a,b)=>V_RANK[a.R.worst]-V_RANK[b.R.worst]||(a.lay.arch?0:1)-(b.lay.arch?0:1)||((a.lay.scr&&a.lay.scr.u)||0)-((b.lay.scr&&b.lay.scr.u)||0);
  const fe=L.filter(feasibleE), rc=fe.filter(e=>e.sc.mat==='rc').sort(rank), stl=fe.filter(e=>e.sc.mat==='st').sort(rank);
  // default: the RC / steel pair that differs the most (passing schemes first, then uniform spacing)
  const pref=e=>{ const b=maxBay(e), [lo,hi]=e.sc.mat==='rc'?[8,10.5]:[15,18]; return b<lo?(lo-b)/3:b>hi?(b-hi)/1.5:0; };
  const pen=e=>V_RANK[e.R.worst]*4+((e.lay.scr&&e.lay.scr.u)||0)+pref(e);
  let best=null; rc.forEach(a=>stl.forEach(b=>{ if(!distinctBy(a,b).length) return; const sc=aScore(aspects(a,b))-pen(a)-pen(b); if(!best||sc>best.sc) best={a,b,sc}; }));
  let a=rc.find(e=>e.sc.id===view.pickRC)||(best&&best.a)||rc[0], b=stl.find(e=>e.sc.id===view.pickST)||(best&&best.b)||stl[0];
  if (!a||!b) return a||b?{a:a||b,b:null,d:[],rc,stl}:null;
  return {a,b,d:distinctBy(a,b),rc,stl,as:aspects(a,b)};
}
function assess(W,sc,C,M){
  const st=W.set, L=M.L, nL=M.nL, checks=[], tol=st.tol, step=st.step/1000;
  // geometry / code limits are strict (pass or fail); only depth / thickness may be "slightly off"
  const add=(c)=>{ c.v=c.strict?(c.ratio<=1+1e-9?'pass':'fail'):verdictOf(c.ratio,tol); checks.push(c); return c; };
  const q=sc.mat==='rc'?st.kRC:st.kSt;
  const zoneAt=k=>M.depth[k];
  /* --- long-span / transfer members --- */
  const ch={}; const covered=new Set(); const used=new Set();
  const memberOpts=m=>{
    const Ls=m.span, opts=[];
    const ratioMain=m.cant?st.sdCant:lsr(st.sdMain,Ls);
    const wTrib=10, wU=q*wTrib*st.tf;
    const carried=m.carries?m.nodes.length:0;
    const P=carried?q*100*Math.max(1,(nL-1-m.k))*st.tf:0;   // carried column: 10x10 bay per floor above
    const Vrc=wU*Ls/2+P/2;
    // depth from S/D; if shear needs a beam wider than 2D (min. 1 m), deepen within the zone first; still too wide → not feasible
    const rc=()=>{ const vmax=0.8*Math.sqrt(st.fcuB)*1000, Breq=d=>Vrc/(vmax*(d-0.07)), Bmax=d=>Math.max(1.0,2*d);
      let D=roundUp(Ls/ratioMain,step); while(Breq(D)>Bmax(D)+1e-9&&D+step<=m.avail+1e-9) D=+(D+step).toFixed(3);
      const Bn=Breq(D), over=Bn>Bmax(D)+1e-9?Bn/Bmax(D):0, B=over?roundUp(Bmax(D),step):roundUp(Math.max(D/2,Bn),step);
      return {sys:'RC',D,B,need:over?Math.max(D,m.avail)*over:D,have:m.avail,txt:`RC ${m.carries?'TRANSFER ':''}GIRDER ${f0(D*1000)} x ${f0(B*1000)}`,calc:`S/D = ${f0(Ls*1000)} / D ≤ ${f1(ratioMain)} → D ≥ ${f0(Ls/ratioMain*1000)}; V = ${f0(Vrc)} kN → b ≥ ${f0(Bn*1000)}${over?` > 2D — too wide even at ${f0(D*1000)} deep`:''} → ${f0(D*1000)} x ${f0(B*1000)}`}; };
    sc.sys.forEach(sy=>{
      if (sy==='RC') opts.push(rc());
      if (sy==='PT'){ const D=roundUp(Ls/st.sdPT,step); opts.push({sys:'PT',D,B:roundUp(Math.max(D,0.5),step),need:D,have:m.avail,txt:`PT GIRDER ${f0(D*1000)} x ${f0(roundUp(Math.max(D,0.5),step)*1000)}`,calc:`S/D ≤ ${st.sdPT} (PT, not template) → D ≥ ${f0(Ls/st.sdPT*1000)}`}); }
      if (sy==='RCWALL'){ const H=m.above||m.below; if(H) opts.push({sys:'RCWALL',D:H,need:Ls/st.wallRatio,have:H,txt:`STOREY-DEEP RC TRANSFER WALL / DEEP BEAM ${f0(H*1000)} DEEP (IN ${m.above?L[m.k].name:L[m.k-1].name})`,calc:`L/H = ${f1(Ls/H)} ≤ ${st.wallRatio}`,where:m.above?'above':'below'}); }
      if (sy==='ST'){ const wl=q*wTrib, wLL=5*wTrib; const Mreq=wl*Ls*Ls/8/1.6+(P?P*Ls/4/1.6:0), Ireq=2.29*wLL*Ls**3/2.8; const sec=pickSec(UB355,Mreq,Ireq);
        if (sec){ const D=secDepth(sec[0]); opts.push({sys:'ST',D,need:D,have:m.avail,txt:`STEEL BEAM ${sec[0]} S355`,calc:`MREQ = ${f0(Mreq)} kNm, IREQ = ${f0(Ireq)} cm4 → ${sec[0]}`}); }
        else { const D=roundUp(Ls/15,step); opts.push({sys:'ST',D,need:D,have:m.avail,txt:`STEEL PLATE GIRDER ${f0(D*1000)} DEEP`,calc:`no rolled section (MREQ ${f0(Mreq)} kNm) → plate girder L/15`}); } }
      if (sy==='STRUSS'){ const H=m.above||m.below; if(H){ const floors=m.above?2:1; const w=q*wTrib*floors*st.tf; const Mt=w*Ls*Ls/8+(P?P*Ls/4:0); const Cf=Mt/H; const A=Cf*1000/(0.8*st.py)/100; const u=UC_AREA.find(x=>x[1]>=A);
        opts.push({sys:'STRUSS',D:H,need:u?H:H*(A/808),have:H,txt:`STOREY-DEEP STEEL TRUSS H = ${f0(H*1000)} (CHORD ${u?u[0]:'> UC 356x406x634'})`,calc:`M = ${f0(Mt)} kNm, C = M/H = ${f0(Cf)} kN, Ag ≥ ${f0(A)} cm2`,where:m.above?'above':'below'}); } }
    });
    return opts;
  };
  const ms=[...M.members].filter(m=>!m.special).sort((a,b)=>a.k-b.k);
  const plateLv=new Set();
  const rampTr=sc.mat==='rc'?M.zones.filter(z=>z.ramp&&z.ramp.tr):[], rpUse=new Map();
  if (sc.sys.includes('PLATE')) Object.values(M.levelInfo).forEach(li=>{ if(li.carries>0&&li.plate){ plateLv.add(li.k);
    const t=roundUp(li.plate.maxSpan/st.plateRatio,step); const have=li.plate.inFree?li.plate.H:li.plate.avail; const useH=Math.max(li.plate.avail,li.plate.H||0);
    add({cat:'Transfer plate',where:`${L[li.k].name}`,item:`TRANSFER PLATE ${f0(t*1000)} THK.`,calc:`max. span ${f1(li.plate.maxSpan)} m / ${st.plateRatio} = ${f0(li.plate.maxSpan/st.plateRatio*1000)} → ${f0(t*1000)}`,need:t,have:useH,ratio:t/useH,fix:'Thicken locally / use plant floor depth'}); used.add('PLATE'); } });
  const inclPts=new Set();
  if (sc.sys.includes('INCL')) M.tpoints.forEach(t=>{ if(t.carries&&t.incl){ const r=t.incl.ratio/st.inclMax; const c=add({cat:'Inclined column',where:`${L[t.k].name} ${t.label}`,item:`INCLINED COLUMN ${t.label} → ${t.incl.label}`,calc:`offset ${f2(t.incl.d)} / height ${f2(t.incl.h)} = ${f2(t.incl.ratio)} ≤ ${st.inclMax}`,need:t.incl.ratio,have:st.inclMax,ratio:r,strict:true,fix:'Spread the slope over two storeys / tie beams for kick-out force'}); if(c.v!=='fail'){ inclPts.add(t.k+'|'+t.key); used.add('INCL'); } } });
  const hangPts=new Set();
  const gIdx=Math.max(0,L.findIndex(l=>normF(l.name)===normF(W.floors.ground||'G/F')));
  const manualBelow=t=>{ const pp=M.pmap.get(t.key); return pp&&t.k-1>=0&&M.col[t.k-1][pp.id]==='manual'; };
  // hangers only for suspended floors above ground, and not where a column was simply omitted by the layout (long-span beams there)
  if (sc.sys.includes('HANG')) M.tpoints.forEach(t=>{ if(t.hang&&t.k>gIdx&&!manualBelow(t)){ const r=t.hang.req/t.hang.H; const c=add({cat:'Hanger + truss',where:`${L[t.k].name} ${t.label}`,item:`HANGER ${t.label} TO TRUSS IN ${L[t.hang.f].name}`,calc:`truss span ${f1(t.hang.span)} m, depth ${f1(t.hang.H)} m`,need:t.hang.req,have:t.hang.H,ratio:r,fix:'Deeper truss / shorter span'}); if(c.v!=='fail'){ hangPts.add(t.k+'|'+t.key); used.add('HANG'); } } });
  let gN=0;
  for (const m of ms){
    const geo=`${m.dir}|${m.x1},${m.y1},${m.x2},${m.y2}`;
    const where=`${m.level} grid ${m.lineLabel} (${m.ends.join('–')})`;
    if (covered.has(`${m.k}|${geo}`)){ ch[m.id]={sys:'COVERED',txt:'TOP CHORD OF TRUSS BELOW'}; continue; }
    if (plateLv.has(m.k)){ ch[m.id]={sys:'PLATE',txt:'WITHIN TRANSFER PLATE'}; continue; }
    { const rz=rampTr.find(z=>m.k===z.s2&&(m.x1+m.x2)/2>z.x1-TOL&&(m.x1+m.x2)/2<z.x2+TOL&&(m.y1+m.y2)/2>z.y1-TOL&&(m.y1+m.y2)/2<z.y2+TOL);
      if (rz){ ch[m.id]={sys:'RPLATE',txt:'WITHIN INCLINED TRANSFER PLATE (RAMP)'}; (rpUse.get(rz)||rpUse.set(rz,[]).get(rz)).push(m); continue; } }
    if (m.pts.length&&m.pts.every(pk=>inclPts.has(m.k+'|'+pk))){ ch[m.id]={sys:'NOTREQ',txt:'NOT REQUIRED (INCLINED COLUMN)'}; continue; }
    if (m.pts.some(pk=>hangPts.has(m.k+'|'+pk))){ ch[m.id]={sys:'HANG',txt:'HUNG FROM TRUSS ABOVE'}; continue; }
    const opts=memberOpts(m);
    if (!opts.length){ add({cat:'Long span / transfer',where,item:'NO SYSTEM AVAILABLE IN THIS SCHEME',calc:'',need:1,have:0.01,ratio:99,fix:''}); ch[m.id]=null; continue; }
    opts.forEach(o=>o.ratio=o.need/o.have);
    // the scheme's signature system is preferred wherever it works; otherwise the best verdict
    const P=m.carries?q*100*Math.max(1,(nL-1-m.k))*st.tf:0;
    const sig=sc.must&&opts.find(o=>o.sys===sc.must&&verdictOf(o.ratio,tol)!=='fail');
    const best=sig||opts.slice().sort((a,b)=>V_RANK[verdictOf(a.ratio,tol)]-V_RANK[verdictOf(b.ratio,tol)]||a.ratio-b.ratio)[0];
    const tag=`G${++gN}`;
    // a column that only exists inside the storey of a storey-deep truss / wall is the truss post, not a transferred column
    const inTruss=m.carries&&(best.sys==='STRUSS'||best.sys==='RCWALL')&&best.where==='above'&&m.pts.every(pk=>{ const pp=M.pmap.get(pk); return pp&&!(m.k+1<=nL-2&&M.present(M.col[m.k+1][pp.id])); });
    const c=add({cat:m.carries&&!inTruss?'Transfer':'Long span',where,item:`${tag}: ${best.txt}${inTruss?' (POSTS WITHIN THE TRUSS STOREY — LONG SPAN, NOT A TRANSFER)':''}`,calc:`span ${f1(m.span)} m${m.cant?' (cantilever)':''}; zone ${f0(m.avail*1000)} mm${m.voidName?' (over '+m.voidName+')':''}; ${best.calc}`,need:best.need,have:best.have,ratio:best.ratio,fix:'Increase width / use C60 / compression steel / local deepening into plant floor'});
    ch[m.id]={...best,tag,v:c.v,m,P,wTrib:10,inTruss}; used.add(best.sys);
    if ((best.sys==='STRUSS'||best.sys==='RCWALL')&&best.where==='above') covered.add(`${m.k+1}|${geo}`);
  }
  Object.values(M.levelInfo).forEach(li=>{ if(li.unresolved&&li.unresolved.length&&!plateLv.has(li.k)) add({cat:'Transfer',where:L[li.k].name,item:`COLUMNS ${li.unresolved.slice(0,4).map(t=>t.label).join(', ')}${li.unresolved.length>4?' …':''} HAVE NO TRANSFER SUPPORT`,calc:`${li.unresolved.length} column(s) above sit on no lower column, wall or transfer beam line in either direction`,need:2,have:1,ratio:2,strict:true,fix:''}); });
  rpUse.forEach((ms,z)=>{ const span=Math.max(...ms.map(m=>m.span)), t=roundUp(span/st.plateRatio,step), avail=M.depth[z.s1+1]||0, nCol=new Set(ms.flatMap(m=>m.nodes)).size;
    add({cat:'Transfer plate',where:L[z.s2].name,item:`INCLINED TRANSFER PLATE (${z.name.toUpperCase()}) ${f0(t*1000)} THK.`,calc:`${nCol} column(s) land on the ramp; max. span ${f1(span)} m / ${st.plateRatio} = ${f0(span/st.plateRatio*1000)} → ${f0(t*1000)}; zone under the ramp ${f0(avail*1000)} mm; horizontal thrust tied into the floor diaphragms`,need:t,have:avail,ratio:avail?t/avail:9,fix:'Thicken locally / ramp downstand within headroom'}); used.add('RPLATE'); });
  const applicable=!sc.must||used.has(sc.must);
  /* --- typical framing per floor type --- */
  const typ=[];
  (W.types||[]).forEach((t,ti)=>{
    const ks=[]; C.typeOf.forEach((x,s)=>{ if(x===ti) ks.push(s+1); }); if(!ks.length) return;
    const zone=Math.min(...ks.map(k=>zoneAt(k)));
    const gT=gridAt(M,ks[0]-1), gx=gT.gx, gy=gT.gy;
    const sxs=gx.sp, sys=gy.sp; const bx=Math.max(...sxs), byy=Math.max(...sys);
    const longD=Math.max(bx,byy), shortD=Math.min(bx,byy);
    const tSlab=(sc.mat==='rc'?st.slabRC:st.slabComp)/1000, nSec=Math.max(1,Math.ceil(longD/(st.sdSlab*tSlab)-1e-9)), ls=longD/nSec;
    const r={type:t.name,floors:`${L[ks[0]-1].name}~${L[ks.at(-1)-1].name}`,zone,nSec,ls,secDir:bx>=byy?'Y':'X'};
    if (sc.floor==='flat'){
      const Lf=longD, d=Lf/st.sdFlat, tf=roundUp(d+0.04,0.025), drop=roundUp(1.5*tf,0.025), Ld=roundUp(Lf/3,0.25);
      Object.assign(r,{sec:'— (NO BEAMS)',main:`FLAT SLAB ${f0(tf*1000)} THK. + DROP ${f0(drop*1000)} (${f2(Ld)} m SQ.)`,flat:{t:tf,drop,Ld,Lf},nSec:1,ls:Lf,tSlab:tf,shortD,longD});
      add({cat:'Slab',where:t.name,item:`FLAT SLAB ${f0(tf*1000)} THK., DROP PANEL ${f0(drop*1000)} THK.`,calc:`L / d = ${f0(Lf*1000)} / d ≤ ${st.sdFlat} → d ≥ ${f0(d*1000)} → h = ${f0(tf*1000)}; drop ${f0(drop*1000)} vs zone ${f0(zone*1000)}`,need:drop,have:zone,ratio:drop/zone,fix:'Thinner drop / column head; reduce span'});
      typ.push(r); return;
    }
    add({cat:'Slab',where:t.name,item:`SLAB ${f0(tSlab*1000)} THK.${sc.mat==='st'?' COMPOSITE':''} @ ${f2(ls)} m`,calc:`S/D = ${f0(ls*1000)} / ${f0(tSlab*1000)} = ${f1(ls/tSlab)} < ${st.sdSlab}`,need:ls/tSlab,have:st.sdSlab,ratio:ls/tSlab/st.sdSlab,fix:'More secondary beams'});
    if (sc.mat==='rc'){
      const sdS=lsr(st.sdSec,shortD), Ds=roundUp(shortD/sdS,step), Bs=roundUp(Math.max(Ds/2,0.25),step);
      const sdM=lsr(st.sdMain,longD), Dm=roundUp(longD/sdM,step), Bm=roundUp(Math.max(Dm/2,0.4),step);
      r.sec=`${f0(Ds*1000)} x ${f0(Bs*1000)}`; r.main=`${f0(Dm*1000)} x ${f0(Bm*1000)}`; Object.assign(r,{Ds,Bs,Dm,Bm,shortD,longD,tSlab});
      add({cat:'Secondary beam',where:t.name,item:`SECONDARY BEAM B1 ${r.sec}`,calc:`S/D = ${f0(shortD*1000)} / D ≤ ${f1(sdS)} → D ≥ ${f0(shortD/sdS*1000)}; zone ${f0(zone*1000)}`,need:Ds,have:zone,ratio:Ds/zone,fix:'Wider / flatter beam; reduce span'});
      add({cat:'Main beam',where:t.name,item:`MAIN BEAM B2 ${r.main}`,calc:`S/D = ${f0(longD*1000)} / D ≤ ${f1(sdM)} → D ≥ ${f0(longD/sdM*1000)}; zone ${f0(zone*1000)}`,need:Dm,have:zone,ratio:Dm/zone,fix:'Wider / flatter beam; PT; reduce span'});
    } else {
      const wl=q*ls, wLL=5*ls; const Mreq=wl*shortD*shortD/8/1.6, Ireq=2.29*wLL*shortD**3/2.8; const sb=pickSec(UB355,Mreq,Ireq);
      const nP=nSec-1, k1=[0,3.66,3.12,2.9,2.77][Math.min(Math.max(nP,1),4)], k2=[0,0.25,0.333,0.5,0.6][Math.min(Math.max(nP,1),4)];
      const Psb=q*ls*shortD, PLL=5*ls*shortD; const Mm=k2*Psb*longD/1.6, Im=Math.max(1,nP)*k1*PLL*longD*longD/2.8; const mb=pickSec(UB355,Mm,Im);
      const Ds=sb?secDepth(sb[0]):roundUp(shortD/15,step), Dm=mb?secDepth(mb[0]):roundUp(longD/15,step);
      r.sec=sb?sb[0]:`plate girder ${f0(Ds*1000)}`; r.main=mb?mb[0]:`plate girder ${f0(Dm*1000)}`; Object.assign(r,{Ds,Dm,shortD,longD,tSlab});
      add({cat:'Secondary beam',where:t.name,item:`SECONDARY BEAM SB ${r.sec}`,calc:`MREQ = ${f0(Mreq)} kNm, IREQ = ${f0(Ireq)} cm4; zone ${f0(zone*1000)}`,need:Ds,have:zone,ratio:Ds/zone,fix:'Closer spacing / heavier section'});
      add({cat:'Main beam',where:t.name,item:`MAIN BEAM MB ${r.main}`,calc:`MREQ = ${f0(Mm)} kNm, IREQ = ${f0(Im)} cm4; zone ${f0(zone*1000)}`,need:Dm,have:zone,ratio:Dm/zone,fix:'Heavier section / reduce span'});
    }
    typ.push(r);
  });
  /* --- columns: size, clash with restricted zones, spacing --- */
  const pts=M.pts, colSize={}, lineW={x:{},y:{}};
  const gx=M.grids[0].gx, gy=M.grids[0].gy;
  const nC=sc.mat==='rc'?st.nRC:st.nComp;
  const present=(s,p)=>M.present(M.col[s][p.id])&&M.col[s][p.id]!=='core';
  const neighbours=(s,p,axis)=>{ const same=pts.filter(o=>o!==p&&(axis==='x'?Math.abs(o.y-p.y)<TOL:Math.abs(o.x-p.x)<TOL)&&(M.present(M.col[s][o.id]))); const c=axis==='x'?p.x:p.y; const lo=same.map(o=>axis==='x'?o.x:o.y).filter(v=>v<c-TOL), hi=same.map(o=>axis==='x'?o.x:o.y).filter(v=>v>c+TOL); return [lo.length?c-Math.max(...lo):null, hi.length?Math.min(...hi)-c:null]; };
  pts.forEach(p=>{
    let load=0, area=0, nfl=0; colSize[p.id]=[];
    for (let s=nL-2;s>=0;s--){
      if (!present(s,p)){ load=0; area=0; nfl=0; colSize[p.id][s]=null; continue; }
      const k=s+1; if (M.nodeSlab(k,p.x,p.y)){ const [a,b]=neighbours(s,p,'x'), [c,d]=neighbours(s,p,'y'); const tx=((a??0)+(b??0))/2||5, ty=((c??0)+(d??0))/2||5; load+=q*tx*ty*st.ef; area+=tx*ty; nfl++; }
      const li=M.levelInfo[k]; if (li) li.members.forEach(m=>{ if(m.carries&&m.ends.includes(p.label)) load+=q*100*Math.max(1,nL-1-k)*st.tf/2; });
      const side=Math.max(st.minSize/1000,roundUp(Math.sqrt(load*1000/nC)/1000,step));
      colSize[p.id][s]={load,side,area,nfl};
    }
  });
  // column types: C1 interior, C2 edge / corner, C3 supporting transfer / long-span members (setting colGroups)
  const supportLabels=new Set(M.members.flatMap(m=>m.ends));
  const groups={}, ctype={};
  pts.forEach(p=>{ const cs=(colSize[p.id]||[]).filter(Boolean); if(!cs.length) return;
    let s0=-1, mxl=-1; colSize[p.id].forEach((c,s)=>{ if(c&&c.load>mxl){ mxl=c.load; s0=s; } });
    const [a,b]=neighbours(s0,p,'x'), [c,d]=neighbours(s0,p,'y'); const edge=[a,b,c,d].some(v=>v===null);
    const mode=Math.round(num(st.colGroups)??4), pref=(num(sc.mat==='rc'?st.colPrefRC:st.colPrefSt)||1000)/1000, req=Math.max(...cs.map(c=>c.side));
    // mode 4: every column takes the preferred size; only columns that really need more become the second (larger) type
    const g=mode===4?(req<=pref+1e-9?'C1':'C2'):mode===0?'C'+p.label:mode===1?'C1':(mode===3&&supportLabels.has(p.label))?'C3':edge?'C2':'C1';
    ctype[p.id]=g; const G=groups[g]||(groups[g]={id:g,side:mode===4&&g==='C1'?pref:0,crit:null,count:0,edge,desc:mode===4?(g==='C1'?'TYPICAL':'HEAVY (EXCEEDS '+f0(pref*1000)+')'):g==='C1'&&mode!==1?'INTERIOR':g==='C2'?'EDGE / CORNER':g==='C3'?'SUPPORTING TRANSFER / LONG-SPAN':''});
    G.count++; colSize[p.id].forEach((c,s)=>{ if(!c) return; G.side=Math.max(G.side,c.side); if(!G.crit||c.load>G.crit.load) G.crit={...c,p,s}; });
  });
  pts.forEach(p=>{ const G=groups[ctype[p.id]]; if(!G) return; colSize[p.id].forEach(c=>{ if(c) c.side=G.side; });
    const ix=gx.pos.findIndex(v=>Math.abs(v-p.x)<TOL), iy=gy.pos.findIndex(v=>Math.abs(v-p.y)<TOL);
    if (ix>=0) lineW.x[ix]=Math.max(lineW.x[ix]||0,G.side); if (iy>=0) lineW.y[iy]=Math.max(lineW.y[iy]||0,G.side); });
  let crit=null;
  Object.values(groups).sort((a,b)=>a.id.localeCompare(b.id)).forEach(G=>{ const c=G.crit; if(!c) return; if(!crit||c.load>crit.load) crit={...c,side:G.side};
    const h=L[c.s].h; add({cat:'Column',where:`${G.id}${G.desc?' '+G.desc:''} — governing ${c.p.label} at ${L[c.s].name} (${G.count} nos.)`,item:`COLUMN ${G.id} ${f0(G.side*1000)} x ${f0(G.side*1000)}${sc.mat==='st'?' (ENCASED)':''}`,calc:`P = ${f0(c.load)} kN; Ac = P / ${nC} = ${f0(c.load*1000/nC)} mm2 → ${f0(G.side*1000)}; H/D = ${f1(h/G.side)} < ${st.slenderBraced}`,need:h/G.side,have:st.slenderBraced,ratio:h/G.side/st.slenderBraced,strict:true,fix:''}); });
  if (sc.floor==='flat'){ const ft=typ.filter(t=>t.flat).sort((a,b)=>b.flat.Lf-a.flat.Lf)[0];
    if (ft) Object.values(groups).forEach(G=>{ const c=G.crit; if(!c) return; const V=q*c.area/Math.max(1,c.nfl), d=ft.flat.drop-0.04, cs=G.side, beta=G.id==='C2'?1.4:1.15;
      const u1=4*(cs+3*d), v1=beta*V*1000/(u1*1000*d*1000), v0=V*1000/(4*cs*1000*d*1000), vmax=0.8*Math.sqrt(st.fcuB);
      G.punch={V,d,beta,u1,v1,v0};
      add({cat:'Punching shear',where:`${G.id} (${ft.type})`,item:`PUNCHING SHEAR AT ${G.id} ${f0(cs*1000)} SQ.`,calc:`V = ${f0(V)} kN/floor; v = ${beta}V / (u1 d) = ${f2(v1)} MPa ≤ 2vc = ${f2(2*st.vcFlat)} (links); v0 = ${f2(v0)} ≤ ${f2(vmax)}`,need:Math.max(v1/(2*st.vcFlat),v0/vmax),have:1,ratio:Math.max(v1/(2*st.vcFlat),v0/vmax),fix:'Thicker drop panel / column head / larger column'}); }); }
  // offsets: column faces must not enter restricted zones (setting zoneOffset) and must stay inside the building edge
  const offsets={};
  const onGrid=new Set();
  const why=(o,t)=>{ (o.why=o.why||[]).includes(t)||o.why.push(t); };
  const keepOnGrid=num(st.zoneOffset)===0;
  M.zones.filter(z=>z.type==='colfree'||z.type==='void').forEach(z=>{
    pts.forEach(p=>{ for(let s=z.s1;s<=z.s2;s++){ const c=colSize[p.id][s]; if(!c||!present(s,p)) continue; const h=c.side/2;
      const ovX=Math.min(p.x+h,z.x2)-Math.max(p.x-h,z.x1), ovY=Math.min(p.y+h,z.y2)-Math.max(p.y-h,z.y1);
      if (ovX>1e-6&&ovY>1e-6){ const onEdge=[p.x-z.x1,p.x-z.x2,p.y-z.y1,p.y-z.y2].some(v=>Math.abs(v)<TOL);
        if ((keepOnGrid||z.periph)&&onEdge){ if(!z.periph) onGrid.add(p.label+' ('+z.name+')'); continue; }
        const o=offsets[p.id]||{dx:0,dy:0,p,z,side:c.side};
        if (Math.abs(p.x-z.x1)<TOL) o.dx=Math.min(o.dx,-h); else if (Math.abs(p.x-z.x2)<TOL) o.dx=Math.max(o.dx,h);
        if (Math.abs(p.y-z.y1)<TOL) o.dy=Math.min(o.dy,-h); else if (Math.abs(p.y-z.y2)<TOL) o.dy=Math.max(o.dy,h);
        if (!o.dx&&!o.dy){ o.clash=true; o.z=z; } else why(o,'edge of '+z.name); o.side=Math.max(o.side,c.side); offsets[p.id]=o; } } });
  });
  M.zones.filter(z=>z.type==='footprint').forEach(z=>{
    pts.forEach(p=>{ for(let s=z.s1;s<=z.s2;s++){ const c=colSize[p.id][s]; if(!c||!present(s,p)) continue; const h=c.side/2; let hit=false;
      const o=offsets[p.id]||{dx:0,dy:0,p,z,side:c.side};
      if (Math.abs(p.x-z.x1)<TOL){ o.dx=Math.max(o.dx,h); hit=true; } else if (Math.abs(p.x-z.x2)<TOL){ o.dx=Math.min(o.dx,-h); hit=true; }
      if (Math.abs(p.y-z.y1)<TOL){ o.dy=Math.max(o.dy,h); hit=true; } else if (Math.abs(p.y-z.y2)<TOL){ o.dy=Math.min(o.dy,-h); hit=true; }
      if (hit){ why(o,`building edge (${L[s].name})`); o.side=Math.max(o.side,c.side); offsets[p.id]=o; } } });
  });
  // straight column lines: all columns on a line take the largest offset needed on that line (same direction)
  [['x','dx'],['y','dy']].forEach(([ax,d])=>{ const lines=new Map(); Object.values(offsets).forEach(o=>{ if(!o[d]||o.clash) return; const k=Math.round((ax==='x'?o.p.x:o.p.y)*20); const l=lines.get(k)||{v:0,mixed:false}; if(l.v&&Math.sign(l.v)!==Math.sign(o[d])) l.mixed=true; if(Math.abs(o[d])>Math.abs(l.v)) l.v=o[d]; lines.set(k,l); });
    lines.forEach((l,k)=>{ if(l.mixed) return; pts.forEach(p=>{ if(Math.round((ax==='x'?p.x:p.y)*20)!==k) return; if(!colSize[p.id].some(Boolean)) return; const o=offsets[p.id]||(offsets[p.id]={dx:0,dy:0,p,z:null,side:0}); if(o.clash) return; o[d]=l.v; why(o,'straight column line'); }); }); });
  M.zones.filter(z=>z.periph&&z.parts&&(z.parts.x||z.parts.y)).forEach(z=>{ const bad=new Set();
    pts.forEach(p=>{ for(let s=z.s1;s<=z.s2;s++){ if(!present(s,p)) continue; if(!(p.x>z.x1+TOL&&p.x<z.x2-TOL&&p.y>z.y1+TOL&&p.y<z.y2-TOL)) continue;   // on the zone boundary (facade / corridor wall): allowed
      const onX=(z.parts.x||[]).some(v=>Math.abs(v-p.x)<TOL), onY=(z.parts.y||[]).some(v=>Math.abs(v-p.y)<TOL); if(!onX&&!onY){ bad.add(p.label); break; } } });
    if (bad.size) add({cat:'Column clash',where:z.name,item:`${bad.size} COLUMN(S) NOT ON A ROOM PARTITION (${[...bad].slice(0,4).join(', ')}${bad.size>4?' …':''})`,calc:`inside the rooms, columns are only permitted on a room partition (columns on the zone boundary are allowed)`,need:2,have:1,ratio:2,strict:true,fix:''}); });
  if (onGrid.size) add({cat:'Column offset',where:[...onGrid].join(', '),item:'COLUMNS KEPT ON GRID AT RESTRICTED-ZONE EDGE',calc:'half the column projects into the zone — set the void / column-free edge at the column face',need:0,have:1,ratio:0,fix:''});
  Object.values(offsets).forEach(o=>{ if(o.clash) add({cat:'Column clash',where:o.p.label,item:`COLUMN ${o.p.label} INSIDE ${o.z.name}`,calc:'column face enters restricted zone',need:2,have:1,ratio:2,strict:true,fix:'Move grid / remove column',pt:o.p.id});
    else if (o.dx||o.dy){ const w=o.why||[]; const edges=w.filter(t=>t.startsWith('building edge')); const short=[...w.filter(t=>!t.startsWith('building edge')),...(edges.length?(()=>{ const fl=edges.map(t=>t.slice(15,-1)).filter((v,i,a)=>a.indexOf(v)===i); return ['building edge ('+(fl.length>2?fl[0]+' ~ '+fl.at(-1):fl.join(', '))+')']; })():[])];
      add({cat:'Column offset',where:o.p.label,item:`COLUMN ${o.p.label} OFFSET ${o.dx?`${o.dx>0?'+':''}${f0(o.dx*1000)} mm X `:''}${o.dy?`${o.dy>0?'+':''}${f0(o.dy*1000)} mm Y`:''}`,calc:`face aligned to ${short.join(' / ')}`,need:0,have:1,ratio:0,fix:''}); } });
  // column spacing: the floor type's requirement, replaced inside spacing zones; checked pair by pair at its mid-point
  { const worstBy=new Map();
    for (let s=0;s<nL-1;s++) [['x'],['y']].forEach(([ax])=>{
      const lines=new Map(); pts.forEach(p=>{ if(!present(s,p)) return; const key=Math.round((ax==='x'?p.y:p.x)*20); if(!lines.has(key)) lines.set(key,[]); lines.get(key).push(p); });
      lines.forEach(arr=>{ arr.sort((a,b)=>(ax==='x'?a.x-b.x:a.y-b.y)); for(let i=0;i<arr.length-1;i++){ const a=arr[i], b=arr[i+1];
        const rq=spReqAt(M,C,s,(a.x+b.x)/2,(a.y+b.y)/2); if(!rq) continue;
        const oa=offsets[a.id]?(ax==='x'?offsets[a.id].dx:offsets[a.id].dy):0, ob=offsets[b.id]?(ax==='x'?offsets[b.id].dx:offsets[b.id].dy):0;
        const cc=(ax==='x'?b.x-a.x:b.y-a.y)+ob-oa; const wa=colSize[a.id][s]?.side||0, wb=colSize[b.id][s]?.side||0; const val=rq.e?cc-wa/2-wb/2:cc;
        const w=worstBy.get(rq.where); if(!w||rq.v/val>w.ratio) worstBy.set(rq.where,{ratio:rq.v/val,val,a,b,s,rq}); } }); });
    worstBy.forEach(w=>add({cat:'Column spacing',where:w.rq.where,item:`MIN. ${w.rq.e?'CLEAR':'C/C'} SPACING ${f2(w.val)} m (${w.a.label}–${w.b.label})`,calc:`required ≥ ${w.rq.v} m ${w.rq.e?'clear':'c/c'}${w.rq.ti===null?' (spacing zone)':''}`,need:w.rq.v,have:w.val,ratio:w.ratio,strict:true,fix:'',ti:w.rq.ti,minSp:w.rq.v})); }
  /* --- columns dropped only because the floor below is a restricted zone: fine for a roof or one plant floor, not for a tower --- */
  { let worst=null; pts.forEach(p=>{ let run=0, s0=null; for(let s=0;s<nL-1;s++){ if(M.col[s][p.id]==='nosupport'){ if(!run) s0=s; run++; if(!worst||run>worst.run) worst={run,p,s0,s}; } else run=0; } });
    const lim=num(st.maxStopFloors)||2;
    if (worst&&worst.run>lim) add({cat:'Transfer',where:`${worst.p.label} ${L[worst.s0].name} ~ ${L[worst.s].name}`,item:`${worst.run} FLOORS WITHOUT COLUMNS ABOVE A RESTRICTED ZONE`,calc:`columns allowed on these floors were dropped only because the zone below has none — more than ${lim} floors on long-span beams; use a transfer level instead`,need:worst.run,have:lim,ratio:worst.run/lim,strict:true,fix:''}); }
  /* --- practical column spacing per material: a longer bay is accepted only where a restricted zone / core forces it --- */
  { const lim=sc.mat==='rc'?num(st.spanRC)||12:num(st.spanSt)||18; let worstB=null;
    M.grids.filter(g=>g.cols).forEach(g=>{ for(let i=0;i<g.gx.pos.length-1;i++) for(let j=0;j<g.gy.pos.length-1;j++){
      const xa=g.gx.pos[i], xb=g.gx.pos[i+1], ya=g.gy.pos[j], yb=g.gy.pos[j+1]; const sp=Math.max(xb-xa,yb-ya); if(sp<=lim+1e-6) continue;
      let used=false; for(let s=g.s1;s<=g.s2&&!used;s++) if(M.slabAt(s+1,(xa+xb)/2,(ya+yb)/2)) used=true; if(!used) continue;
      const A=(xb-xa)*(yb-ya), forced=M.zones.some(z=>['void','colfree','core','dbl'].includes(z.type)&&Math.max(0,Math.min(xb,z.x2)-Math.max(xa,z.x1))*Math.max(0,Math.min(yb,z.y2)-Math.max(ya,z.y1))>=0.5*A);
      if (!forced&&(!worstB||sp>worstB.sp)) worstB={sp,lbl:`${M.ptLabel(xa,ya)}–${M.ptLabel(xb,yb)}`}; } });
    if (worstB) add({cat:'Grid span',where:worstB.lbl,item:`COLUMN SPACING ${f2(worstB.sp)} m`,calc:`> ${lim} m practical max. for ${sc.mat==='rc'?'RC':'steel'} (not forced by a restricted zone)`,need:worstB.sp,have:lim,ratio:worstB.sp/lim,strict:true,fix:''}); }
  /* --- ramps / sloped slabs, and columns without a slab to brace them --- */
  const ramps=[];
  M.zones.filter(z=>z.ramp).forEach(z=>{ const rise=L.slice(z.s1,z.s2).reduce((t,l)=>t+l.h,0), along=z.ramp.dir.includes('X'), run=along?z.x2-z.x1:z.y2-z.y1, wid=along?z.y2-z.y1:z.x2-z.x1;
    const n=z.ramp.grad||num(st.maxGrad)||6, g=rise/run, Ls=Math.hypot(run,rise);
    const t=(sc.mat==='rc'?st.slabRC:st.slabComp)/1000, nb=Math.max(1,Math.ceil(wid/(st.sdSlab*t)-1e-9)), sw=wid/nb, gl=(along?M.grids[0].gx:M.grids[0].gy), bay=Math.max(...gl.sp)||run, Lb=bay*Math.hypot(1,g), Db=roundUp(Lb/lsr(st.sdMain,Lb),step);
    ramps.push({z,rise,run,wid,g,n,Ls,t,Lb,Db,sw,nb});
    add({cat:'Ramp',where:`${z.name} ${L[z.s1].name} → ${L[z.s2].name}`,item:`RAMP GRADIENT 1 : ${f1(run/rise)}`,calc:`rise ${f2(rise)} m / run ${f2(run)} m = 1 : ${f1(run/rise)} ≤ 1 : ${n}`,need:g,have:1/n,ratio:g*n,strict:true,fix:''});
    add({cat:'Ramp',where:z.name,item:`RAMP SLAB ${f0(t*1000)} THK., INCLINED BEAM ${f0(Db*1000)} DEEP`,calc:`slab spans ${f2(sw)} m between ${nb+1} inclined beams, S/D = ${f1(sw/t)} ≤ ${st.sdSlab}; inclined beam ${f2(Lb)} m (sloped length) S/D ≤ ${f1(lsr(st.sdMain,Lb))}`,need:0,have:1,ratio:0,fix:''}); });
  { let worst=null; pts.forEach(p=>{ let run=0, h=0, s0=null;
      for (let s=0;s<nL-1;s++){ const c=colSize[p.id][s]; if(!c||!present(s,p)){ run=0; h=0; continue; }
        h+=L[s].h; run++; const braced=s+1>=nL-1||!present(s+1,p)||M.nodeSlab(s+1,p.x,p.y);
        if (braced){ if(run>1){ const r=h/c.side; if(!worst||r>worst.r) worst={r,h,side:c.side,p,s0:s-run+1,s}; } run=0; h=0; } } });
    if (worst) add({cat:'Column unbraced',where:`${worst.p.label} ${L[worst.s0].name} ~ ${L[worst.s].name}`,item:`COLUMN ${worst.p.label} UNBRACED OVER ${f2(worst.h)} m (no slab at intermediate level)`,calc:`H / D = ${f0(worst.h*1000)} / ${f0(worst.side*1000)} = ${f1(worst.r)} ≤ ${st.slenderBraced}`,need:worst.r,have:st.slenderBraced,ratio:worst.r/st.slenderBraced,strict:true,fix:''}); }
  /* --- cantilevers at slab edges --- */
  const cants=[];
  (W.types||[]).forEach((t,ti)=>{ const ss=[]; C.typeOf.forEach((x,s)=>{ if(x===ti) ss.push(s); }); if(!ss.length) return;
    const fp=M.zones.find(z=>z.type==='footprint'&&z.name===t.name); if(!fp) return;
    const s=ss[0]; const cols=pts.filter(p=>present(s,p)); if(!cols.length) return;
    const cores=M.zones.filter(z=>z.type==='core'&&M.zAct(z,s)); const xs=cols.map(p=>p.x).concat(cores.flatMap(z=>[z.x1,z.x2])), ys=cols.map(p=>p.y).concat(cores.flatMap(z=>[z.y1,z.y2])); const zone=Math.min(...ss.map(s=>zoneAt(s+1)));
    [['W',Math.min(...xs)-fp.x1],['E',fp.x2-Math.max(...xs)],['N',Math.min(...ys)-fp.y1],['S',fp.y2-Math.max(...ys)]].forEach(([side,len])=>{
      if (len<0.3) return; const lim=sc.mat==='rc'?st.cantRC:st.cantSt; const D=roundUp(len/st.sdCant,step);
      cants.push({type:t.name,side,len,D});
      add({cat:'Cantilever span',where:`${t.name} (${side} edge)`,item:`CANTILEVER SPAN ${f2(len)} m`,calc:`span ${f2(len)} m ≤ max. ${lim} m (${sc.mat==='rc'?'RC':'steel'})`,need:len,have:lim,ratio:len/lim,strict:true,fix:''});
      add({cat:'Cantilever',where:`${t.name} (${side} edge)`,item:`CANTILEVER BEAM CB ${f0(D*1000)} DEEP`,calc:`S/D ≤ ${st.sdCant} → D ≥ ${f0(len/st.sdCant*1000)}; zone ${f0(zone*1000)}`,need:D,have:zone,ratio:D/zone,fix:'Wider beam / back-span tie-down'});
    }); });
  const worst=checks.reduce((w,c)=>V_RANK[c.v]>V_RANK[w]?c.v:w,'pass');
  return {checks,ch,used,applicable,typ,colSize,offsets,lineW,cants,worst,crit,groups,ctype,ramps};
}

/* ---------- Output helpers ---------- */
const f0=x=>Number.isFinite(x)?Math.round(x).toLocaleString('en-US'):'–', f1=x=>Number.isFinite(x)?x.toFixed(1):'–', f2=x=>Number.isFinite(x)?x.toFixed(2):'–';
function memberWhy(c){
  if (c.sys==='RCWALL') return `L/H ${f1(c.need*W.set.wallRatio/c.have)} > ${W.set.wallRatio}`;
  if (c.sys==='STRUSS') return `CHORD > UC 356x406x634`;
  return `D ${f0(c.need*1000)} > ZONE ${f0(c.have*1000)}`;
}
function planGroups(M){
  // group consecutive slab levels with the same framing signature
  const sig=k=>{ const parts=[];
    M.pts.forEach(p=>{ parts.push((k-1>=0&&M.present(M.col[k-1][p.id])?'1':'0')+(k<=M.nL-2&&M.present(M.col[k][p.id])?'1':'0')); });
    M.cells.forEach(c=>parts.push(M.slabAt(k,c.cx,c.cy)?'s':'-'));
    M.zones.forEach(z=>{ if(z.type!=='footprint') parts.push(((k-1>=0&&M.zAct(z,k-1))||(k<=M.nL-2&&M.zAct(z,k)))?'z':'.'); });
    M.members.filter(m=>m.k===k).forEach(m=>parts.push(`${m.dir}${m.x1},${m.y1},${m.x2},${m.y2}`));
    return parts.join('|'); };
  const g=[]; for (let k=1;k<M.nL;k++){ const s=sig(k); const last=g.at(-1); if(last&&last.sig===s&&!M.levelInfo[k]&&!M.levelInfo[last.k1]) last.k2=k; else g.push({k1:k,k2:k,sig:s}); }
  return g;
}
function planSVG2(E,k,grp){
  const {M,R,sc}=E; const st=W.set; const nL=M.nL;
  const ag={x:{pos:E.C.px.pos,labels:E.C.axl||E.C.xl},y:{pos:E.C.py.pos,labels:E.C.ayl||E.C.yl}};
  const x0=Math.min(...M.xs,...ag.x.pos), x1=Math.max(...M.xs,...ag.x.pos), y0=Math.min(...M.ys,...ag.y.pos), y1=Math.max(...M.ys,...ag.y.pos);
  const S=Math.min(720/Math.max(x1-x0,1),560/Math.max(y1-y0,1)), pad=56, Wd=(x1-x0)*S+pad*2, H=(y1-y0)*S+pad*2;
  const X=x=>pad+(x-x0)*S, Y=y=>pad+(y-y0)*S; let g='', ngTxt='';
  const clashPts=new Set(R.checks.filter(c=>c.cat==='Column clash'&&c.pt).map(c=>c.pt));
  const id='h'+Math.random().toString(36).slice(2,7);
  g+=`<defs><pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#d62828" stroke-width="1.2"/></pattern><pattern id="q${id}" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 0L9 9M9 0L0 9" stroke="#2e7d32" stroke-width=".8"/></pattern></defs>`;
  M.cells.forEach(c=>{ if(M.slabAt(k,c.cx,c.cy)) g+=`<rect x="${X(c.x1)}" y="${Y(c.y1)}" width="${(c.x2-c.x1)*S}" height="${(c.y2-c.y1)*S}" fill="#f7f8fa"/>`; });
  // restricted zones in red hatch
  (R.ramps||[]).forEach(rp=>{ const z=rp.z; if(k<z.s1||k>z.s2) return; const d=z.ramp.dir, cx=X((z.x1+z.x2)/2), cy=Y((z.y1+z.y2)/2), w=(z.x2-z.x1)*S, hh=(z.y2-z.y1)*S;
    const [ax,ay,bx2,by2]=d==='+X'?[X(z.x1)+8,cy,X(z.x2)-8,cy]:d==='-X'?[X(z.x2)-8,cy,X(z.x1)+8,cy]:d==='+Y'?[cx,Y(z.y1)+8,cx,Y(z.y2)-8]:[cx,Y(z.y2)-8,cx,Y(z.y1)+8];
    g+=`<g class="ly-zone"><rect x="${X(z.x1)}" y="${Y(z.y1)}" width="${w}" height="${hh}" fill="#e8f1ff" stroke="#1f4fd1" stroke-dasharray="6 3"/><line x1="${ax}" y1="${ay}" x2="${bx2}" y2="${by2}" stroke="#1f4fd1" stroke-width="1.6" marker-end="url(#ar${id})"/><text x="${cx}" y="${cy-6}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#1f4fd1" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(z.name.toUpperCase())} UP 1:${f1(rp.run/rp.rise)} (${esc(M.L[z.s1].name)} → ${esc(M.L[z.s2].name)})</text></g>`; });
  g+=`<defs><marker id="ar${id}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#1f4fd1"/></marker></defs>`;
  let zl=0; M.zones.forEach(z=>{ const a=(k-1>=0&&M.zAct(z,k-1))||(k<=nL-2&&M.zAct(z,k)); if(!a||z.type==='footprint'||z.type==='core'||z.type==='outside'||z.type==='keep'||z.ramp) return;
    if (z.type==='spacing'){ g+=`<g class="ly-req"><rect x="${X(z.x1)}" y="${Y(z.y1)}" width="${(z.x2-z.x1)*S}" height="${(z.y2-z.y1)*S}" fill="url(#q${id})" fill-opacity=".6" stroke="#2e7d32" stroke-width="1.2" stroke-dasharray="10 4"/><text x="${X(z.x1)+4}" y="${Y(z.y1)+13}" font-size="9.5" font-weight="700" fill="#2e7d32" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(z.name.toUpperCase())}: MIN. ${z.minSp} m ${z.spType==='e'?'CLEAR':'C/C'}</text></g>`; return; } zl++;
    g+=`<g class="ly-zone"><rect x="${X(z.x1)}" y="${Y(z.y1)}" width="${(z.x2-z.x1)*S}" height="${(z.y2-z.y1)*S}" fill="url(#${id})" fill-opacity=".55" stroke="#d62828" stroke-width="1.2" stroke-dasharray="5 3"/><text x="${X((z.x1+z.x2)/2)}" y="${Y((z.y1+z.y2)/2)+16+(zl-1)*13}" text-anchor="middle" font-size="10" font-weight="700" fill="#b71c1c" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(z.name.toUpperCase())}${z.periph?' — COLUMNS ON PERIPHERY ONLY':''}</text></g>`; });
  // grid
  const gr=gridAt(M,Math.max(0,k-1));
  // grid lines and bubbles: always the question's grid
  ag.x.pos.forEach((p,i)=>{ g+=`<line x1="${X(p)}" y1="${pad-24}" x2="${X(p)}" y2="${H-pad+8}" stroke="#9aa" stroke-width=".6" stroke-dasharray="9 3 2 3"/><circle cx="${X(p)}" cy="${pad-32}" r="9" fill="#fff" stroke="#333"/><text x="${X(p)}" y="${pad-28}" text-anchor="middle" font-size="10">${esc(ag.x.labels[i])}</text>`;
    const n=ag.x.pos[i+1]; if(n!==undefined) g+=`<text x="${(X(p)+X(n))/2}" y="${pad-13}" text-anchor="middle" font-size="9">${f0((n-p)*1000)}</text>`; });
  ag.y.pos.forEach((p,j)=>{ g+=`<line x1="${pad-24}" y1="${Y(p)}" x2="${Wd-pad+8}" y2="${Y(p)}" stroke="#9aa" stroke-width=".6" stroke-dasharray="9 3 2 3"/><circle cx="${pad-32}" cy="${Y(p)}" r="9" fill="#fff" stroke="#333"/><text x="${pad-32}" y="${Y(p)+4}" text-anchor="middle" font-size="10">${esc(ag.y.labels[j])}</text>`;
    const n=ag.y.pos[j+1]; if(n!==undefined){ const cy=(Y(p)+Y(n))/2; g+=`<text x="${pad-13}" y="${cy}" text-anchor="middle" font-size="9" transform="rotate(-90 ${pad-13} ${cy})">${f0((n-p)*1000)}</text>`; } });
  // column lines that are not on the question's grid: setting-out dimensions from the grid (bottom and right)
  const off=(sp,ap)=>sp.some(v=>!ap.some(a=>Math.abs(a-v)<TOL));
  if (off(gr.gx.pos,ag.x.pos)){ const u=[...new Set([...gr.gx.pos,...ag.x.pos].map(v=>+v.toFixed(3)))].sort((a,b)=>a-b); const yb=Y(y1)+26;
    g+=`<g class="ly-sp"><line x1="${X(u[0])}" y1="${yb}" x2="${X(u.at(-1))}" y2="${yb}" stroke="#7a3" stroke-width=".8"/>${u.map(v=>`<line x1="${X(v)}" y1="${yb-4}" x2="${X(v)}" y2="${yb+4}" stroke="#7a3"/>`).join('')}${u.slice(1).map((v,i)=>`<text x="${(X(v)+X(u[i]))/2}" y="${yb-3}" text-anchor="middle" font-size="8.5" fill="#4a7a14">${f0((v-u[i])*1000)}</text>`).join('')}<text x="${X(u[0])}" y="${yb+14}" font-size="9" fill="#4a7a14">COLUMN SETTING-OUT FROM GRID (X)</text>${gr.gx.pos.filter(v=>!ag.x.pos.some(a=>Math.abs(a-v)<TOL)).map(v=>`<line x1="${X(v)}" y1="${Y(y0)}" x2="${X(v)}" y2="${yb}" stroke="#7a3" stroke-width=".5" stroke-dasharray="2 3"/>`).join('')}</g>`; }
  if (off(gr.gy.pos,ag.y.pos)){ const u=[...new Set([...gr.gy.pos,...ag.y.pos].map(v=>+v.toFixed(3)))].sort((a,b)=>a-b); const xb=X(x1)+26;
    g+=`<g class="ly-sp"><line x1="${xb}" y1="${Y(u[0])}" x2="${xb}" y2="${Y(u.at(-1))}" stroke="#7a3" stroke-width=".8"/>${u.map(v=>`<line x1="${xb-4}" y1="${Y(v)}" x2="${xb+4}" y2="${Y(v)}" stroke="#7a3"/>`).join('')}${u.slice(1).map((v,i)=>{ const cy=(Y(v)+Y(u[i]))/2; return `<text x="${xb-3}" y="${cy}" text-anchor="middle" font-size="8.5" fill="#4a7a14" transform="rotate(-90 ${xb-3} ${cy})">${f0((v-u[i])*1000)}</text>`; }).join('')}${gr.gy.pos.filter(v=>!ag.y.pos.some(a=>Math.abs(a-v)<TOL)).map(v=>`<line x1="${X(x0)}" y1="${Y(v)}" x2="${xb}" y2="${Y(v)}" stroke="#7a3" stroke-width=".5" stroke-dasharray="2 3"/>`).join('')}</g>`; }
  // beams: main beams along grid lines between columns below, secondaries per bay, members coloured
  const colsBelow=M.pts.filter(p=>k-1>=0&&M.present(M.col[k-1][p.id]));
  const inCore=(x,y)=>M.zones.some(z=>z.type==='core'&&((k-1>=0&&M.zAct(z,k-1))||(k<=nL-2&&M.zAct(z,k)))&&x>z.x1-0.01&&x<z.x2+0.01&&y>z.y1-0.01&&y<z.y2+0.01);
  const slabMid=(x,y)=>M.slabAt(k,x,y+0.01)||M.slabAt(k,x,y-0.01)||M.slabAt(k,x+0.01,y)||M.slabAt(k,x-0.01,y);
  const memberGeo=new Set(M.members.filter(m=>m.k===k).flatMap(m=>{ const out=[]; const a=m.dir==='X'?m.x1:m.y1, b=m.dir==='X'?m.x2:m.y2; const ln=m.dir==='X'?gr.gx.pos:gr.gy.pos; ln.forEach((v,i)=>{ const w=ln[i+1]; if(w!==undefined&&v>=a-TOL&&w<=b+TOL) out.push(m.dir==='X'?`X${v},${m.y1}`:`Y${m.x1},${v}`); }); return out; }));
  const line=(xa,ya,xb,yb,col,wd,dash)=>`<line x1="${X(xa)}" y1="${Y(ya)}" x2="${X(xb)}" y2="${Y(yb)}" stroke="${col}" stroke-width="${wd}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
  const flat=sc.floor==='flat';
  // main beams follow the (offset) column lines; RC main beams drawn to width as two dashed lines
  const tyB=(()=>{ const ti=E.C.typeOf[Math.min(Math.max(k-1,0),E.C.typeOf.length-1)]; const t=R.typ.find(t=>t.type===(W.types[ti]||{}).name)||R.typ[0]; return t&&t.Bm?t.Bm:0; })();
  // a column line that was pushed off the grid sits on a building / zone edge: the beam face is set flush with that edge
  const bh=(sc.mat==='rc'&&tyB?tyB:0.3)/2;
  const lo={x:new Map(),y:new Map()}; Object.values(R.offsets).forEach(o=>{ if(o.dx) lo.x.set(Math.round(o.p.x*20),Math.sign(o.dx)*bh); if(o.dy) lo.y.set(Math.round(o.p.y*20),Math.sign(o.dy)*bh); });
  const ox=v=>v+(lo.x.get(Math.round(v*20))||0), oy=v=>v+(lo.y.get(Math.round(v*20))||0);
  const beam=(xa,ya,xb,yb,col,w)=>{ if(sc.mat!=='rc'||!w) return line(xa,ya,xb,yb,col,2); const h=w/2, v=Math.abs(xa-xb)<1e-9;
    return v?line(xa-h,ya,xb-h,yb,col,1,'5 3')+line(xa+h,ya,xb+h,yb,col,1,'5 3'):line(xa,ya-h,xb,yb-h,col,1,'5 3')+line(xa,ya+h,xb,yb+h,col,1,'5 3'); };
  if (!flat) gr.gy.pos.forEach(y=>{ for(let i=0;i<gr.gx.pos.length-1;i++){ const a=gr.gx.pos[i], b=gr.gx.pos[i+1]; if(!slabMid((a+b)/2,y)||inCore((a+b)/2,y)||memberGeo.has(`X${a},${y}`)) continue; g+=beam(ox(a),oy(y),ox(b),oy(y),'#1f4fd1',tyB); } });
  if (!flat) gr.gx.pos.forEach(x=>{ for(let j=0;j<gr.gy.pos.length-1;j++){ const a=gr.gy.pos[j], b=gr.gy.pos[j+1]; if(!slabMid(x,(a+b)/2)||inCore(x,(a+b)/2)||memberGeo.has(`Y${x},${a}`)) continue; g+=beam(ox(x),oy(a),ox(x),oy(b),'#1f4fd1',tyB); } });
  const typeIdx=E.C.typeOf[Math.min(k-1,E.C.typeOf.length-1)], ty=R.typ.find(t=>t.type===(W.types[typeIdx]||{}).name)||R.typ[0];
  const nSec=ty?ty.nSec:3;
  for(let i=0;i<gr.gx.pos.length-1;i++) for(let j=0;j<gr.gy.pos.length-1;j++){ const xa=gr.gx.pos[i], xb=gr.gx.pos[i+1], ya=gr.gy.pos[j], yb=gr.gy.pos[j+1]; const cx=(xa+xb)/2, cy=(ya+yb)/2;
    if(!M.slabAt(k,cx,cy)||inCore(cx,cy)) continue;
    for(let n=1;n<nSec;n++){ if(xb-xa>=yb-ya){ const x=xa+(xb-xa)*n/nSec; g+=line(x,ya,x,yb,'#36a9e1',1); } else { const y=ya+(yb-ya)*n/nSec; g+=line(xa,y,xb,y,'#36a9e1',1); } } }
  if (flat&&ty&&ty.flat){ const hd=ty.flat.Ld/2; M.pts.forEach(p=>{ if(!(k-1>=0&&M.present(M.col[k-1][p.id])&&M.col[k-1][p.id]!=='core')) return; const o=R.offsets[p.id]||{}; const cx=p.x+(o.dx||0), cy=p.y+(o.dy||0);
      const xa=Math.max(cx-hd,x0), xb=Math.min(cx+hd,x1), ya=Math.max(cy-hd,y0), yb=Math.min(cy+hd,y1);
      g+=`<rect x="${X(xa)}" y="${Y(ya)}" width="${(xb-xa)*S}" height="${(yb-ya)*S}" fill="none" stroke="#1f4fd1" stroke-dasharray="4 3"/>`; });
    g+=`<text x="${X(x0)}" y="${Y(y1)+30}" font-size="10" fill="#1f4fd1">${esc(ty.main)} (DASHED = DROP PANEL)</text>`; }
  // cantilevers to slab edge
  const fp=M.zones.find(z=>z.type==='footprint'&&k-1>=0&&M.zAct(z,k-1));
  if (fp&&colsBelow.length){ const xs=colsBelow.map(p=>p.x), ys=colsBelow.map(p=>p.y); const mnx=Math.min(...xs),mxx=Math.max(...xs),mny=Math.min(...ys),mxy=Math.max(...ys);
    colsBelow.forEach(p=>{ if(Math.abs(p.x-mnx)<TOL&&mnx-fp.x1>0.3) g+=line(p.x,p.y,fp.x1,p.y,'#d62828',2); if(Math.abs(p.x-mxx)<TOL&&fp.x2-mxx>0.3) g+=line(p.x,p.y,fp.x2,p.y,'#d62828',2); if(Math.abs(p.y-mny)<TOL&&mny-fp.y1>0.3) g+=line(p.x,p.y,p.x,fp.y1,'#d62828',2); if(Math.abs(p.y-mxy)<TOL&&fp.y2-mxy>0.3) g+=line(p.x,p.y,p.x,fp.y2,'#d62828',2); });
    g+=`<rect x="${X(fp.x1)}" y="${Y(fp.y1)}" width="${(fp.x2-fp.x1)*S}" height="${(fp.y2-fp.y1)*S}" fill="none" stroke="#222" stroke-width="1"/>`; }
  // long-span / transfer members
  M.members.filter(m=>m.k===k).forEach(m=>{ const c=R.ch[m.id]; const col=!c||c.v==='fail'?'#d62828':c.v==='marg'?'#e08a00':c.sys==='COVERED'||c.sys==='PLATE'||c.sys==='RPLATE'||c.sys==='NOTREQ'?'#8a8a8a':'#1a9e3f';
    if ((!c||c.v==='fail'||c.v==='marg')){ const mx=X((m.x1+m.x2)/2), my=Y((m.y1+m.y2)/2); const t=!c?'NO SYSTEM':`${c.tag} ${c.v==='fail'?'✗':'≈'} ${memberWhy(c)}`;
      ngTxt+=`<text x="${mx+(m.dir==='Y'?8:0)}" y="${my+(m.dir==='X'?16:0)}" ${m.dir==='Y'?`transform="rotate(-90 ${mx+8} ${my})" text-anchor="middle"`:'text-anchor="middle"'} font-size="10" font-weight="700" fill="${col}" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(t)}</text>`; }
    if (c&&(c.sys==='RC'||c.sys==='PT')&&c.B){ const h=c.B/2, v=m.dir==='Y'; g+=v?line(m.x1-h,m.y1,m.x2-h,m.y2,col,1.6,'7 3')+line(m.x1+h,m.y1,m.x2+h,m.y2,col,1.6,'7 3'):line(m.x1,m.y1-h,m.x2,m.y2-h,col,1.6,'7 3')+line(m.x1,m.y1+h,m.x2,m.y2+h,col,1.6,'7 3'); }
    else g+=`<line x1="${X(m.x1)}" y1="${Y(m.y1)}" x2="${X(m.x2)}" y2="${Y(m.y2)}" stroke="${col}" stroke-width="5" ${c&&c.sys==='STRUSS'?'stroke-dasharray="10 4"':''}/>`;
    if (c&&c.tag){ const mx=X(m.x1+(m.x2-m.x1)*0.3), my=Y(m.y1+(m.y2-m.y1)*0.3); g+=`<text x="${mx+(m.dir==='Y'?7:0)}" y="${my+(m.dir==='X'?-7:0)}" font-size="10" font-weight="700" fill="${col}">${c.tag}</text>`; } });
  // plate
  if (R.used.has('PLATE')&&M.levelInfo[k]&&M.levelInfo[k].carries){ const li=M.levelInfo[k]; const xs=li.pts.map(t=>t.x).concat(li.members.flatMap(m=>[m.x1,m.x2])), ys=li.pts.map(t=>t.y).concat(li.members.flatMap(m=>[m.y1,m.y2]));
    g+=`<rect x="${X(Math.min(...xs)-1)}" y="${Y(Math.min(...ys)-1)}" width="${(Math.max(...xs)-Math.min(...xs)+2)*S}" height="${(Math.max(...ys)-Math.min(...ys)+2)*S}" fill="#1a9e3f" fill-opacity=".12" stroke="#1a9e3f" stroke-width="2"/>`; }
  // core
  M.zones.filter(z=>z.type==='core'&&((k-1>=0&&M.zAct(z,k-1))||(k<=nL-2&&M.zAct(z,k)))).forEach(z=>{ const cx=X((z.x1+z.x2)/2), cy=Y((z.y1+z.y2)/2);
    g+=`<rect x="${X(z.x1)}" y="${Y(z.y1)}" width="${(z.x2-z.x1)*S}" height="${(z.y2-z.y1)*S}" fill="#fff" stroke="#555" stroke-width="3.5"/><line x1="${X(z.x1)}" y1="${Y(z.y2)}" x2="${X(z.x2)}" y2="${Y(z.y1)}" stroke="#555"/><text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="9">SERVICE CORE</text>`; });
  // walls
  if (k-1>=0) M.wallsAt(k-1).forEach(w=>{ g+=line(w.x1,w.y1,w.x2,w.y2,'#333',4); });
  if (k<=nL-2) M.wallsAt(k).filter(w=>!(k-1>=0&&M.wallsAt(k-1).includes(w))).forEach(w=>{ g+=line(w.x1,w.y1,w.x2,w.y2,'#333',2,'4 3'); });
  // columns to scale with template symbols
  M.pts.forEach(p=>{ const b=k-1>=0&&M.present(M.col[k-1][p.id])&&M.col[k-1][p.id]!=='core', a=k<=nL-2&&M.present(M.col[k][p.id])&&M.col[k][p.id]!=='core'; if(!a&&!b) return;
    const sz=(R.colSize[p.id]||[])[b?k-1:k]; const side=Math.max(sz?sz.side:0.5,0.4)*S; const o=R.offsets[p.id]||{dx:0,dy:0}; const x=X(p.x+(o.dx||0)), y=Y(p.y+(o.dy||0));
    if (a&&b) g+=`<rect x="${x-side/2}" y="${y-side/2}" width="${side}" height="${side}" fill="#fff" stroke="#111" stroke-width="1.3"/><path d="M${x-side/2} ${y-side/2}L${x+side/2} ${y+side/2}M${x+side/2} ${y-side/2}L${x-side/2} ${y+side/2}" stroke="#111"/>`;
    else if (b) g+=`<rect x="${x-side/2}" y="${y-side/2}" width="${side}" height="${side}" fill="#fff" stroke="#111" stroke-dasharray="2.5 1.5"/>`;
    else g+=`<rect x="${x-side/2}" y="${y-side/2}" width="${side}" height="${side}" fill="url(#${id})" stroke="#111"/>`;
    if (R.ctype[p.id]) g+=`<text class="ly-ct" x="${x+side/2+2}" y="${y-side/2-1}" font-size="7.5" fill="#444">${R.ctype[p.id]}</text>`;
    if (clashPts.has(p.id)){ g+=`<rect x="${x-side/2-3}" y="${y-side/2-3}" width="${side+6}" height="${side+6}" fill="none" stroke="#d62828" stroke-width="2.5"/>`; ngTxt+=`<text x="${x}" y="${y+side/2+11}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#d62828" stroke="#fff" stroke-width="3" paint-order="stroke">✗ IN ZONE</text>`; }
  });
  // actual column spacing along each grid line (storey below this slab)
  if (k-1>=0){ const s=k<=nL-2?k:k-1; let sp='';
    const cs=M.pts.filter(p=>M.present(M.col[s][p.id])), isCore=p=>M.col[s][p.id]==='core';
    const pos=p=>{ const o=R.offsets[p.id]||{}; return [p.x+(o.dx||0),p.y+(o.dy||0)]; };
    ['x','y'].forEach(ax=>{ const lines=new Map(); cs.forEach(p=>{ const key=Math.round((ax==='x'?p.y:p.x)*20); if(!lines.has(key)) lines.set(key,[]); lines.get(key).push(p); });
      lines.forEach(arr=>{ arr.sort((a,b)=>ax==='x'?a.x-b.x:a.y-b.y); for(let i=0;i<arr.length-1;i++){ const a=arr[i], b=arr[i+1]; if(isCore(a)||isCore(b)) continue;
        // a span over a stopped / transferred column is a long-span member (tagged G..), not a column spacing: no label
        { const gq=gridAt(M,s), gp=ax==='x'?gq.gx.pos:gq.gy.pos, va=ax==='x'?a.x:a.y, vb=ax==='x'?b.x:b.y; if(gp.some(v=>v>va+TOL&&v<vb-TOL)) continue; }
        const [ax1,ay1]=pos(a), [bx1,by1]=pos(b);
        const rq=spReqAt(M,E.C,s,(a.x+b.x)/2,(a.y+b.y)/2), minSp=rq?rq.v:0, clear=rq?rq.e:false;
        const cc=ax==='x'?bx1-ax1:by1-ay1; const wa=(R.colSize[a.id][s]||{}).side||0, wb=(R.colSize[b.id][s]||{}).side||0; const val=clear?cc-wa/2-wb/2:cc;
        const ok=!minSp||val>=minSp-1e-9; const col=!minSp?'#555':ok?'#137333':'#c5221f'; const t=`${clear?'CLR ':''}${f0(val*1000)}`;
        if (ax==='x'){ const tx=X((ax1+bx1)/2), ty=Y((ay1+by1)/2)-4; sp+=`<text x="${tx}" y="${ty}" text-anchor="middle" font-size="8.5" fill="${col}" ${ok?'':'font-weight="700"'} stroke="#fff" stroke-width="2.5" paint-order="stroke">${t}</text>`; }
        else { const tx=X((ax1+bx1)/2)-4, ty=Y((ay1+by1)/2); sp+=`<text x="${tx}" y="${ty}" text-anchor="middle" font-size="8.5" fill="${col}" ${ok?'':'font-weight="700"'} transform="rotate(-90 ${tx} ${ty})" stroke="#fff" stroke-width="2.5" paint-order="stroke">${t}</text>`; } } }); });
    g+=`<g class="ly-sp">${sp}</g>`; }
  g+=`<g class="ly-ng">${ngTxt}</g>`;
  const title=`${M.L[grp.k1].name}${grp.k2>grp.k1?' ~ '+M.L[grp.k2].name:''} FRAMING PLAN`;
  return {svg:`<svg viewBox="0 0 ${Wd} ${H}" width="100%" style="max-width:${Wd}px">${g}</svg>`,title};
}
function sectionLines(E){
  // the most informative cut in each direction: through restricted zones, long-span / transfer members and ramps
  const {M}=E; const g=M.grids.find(x=>x.cols)||M.grids[0]; const out=[];
  [['X','y',g.gy],['Y','x',g.gx]].forEach(([dir,ax,gl])=>{ let best=null;
    gl.pos.forEach((c,i)=>{ let sc=0; M.members.forEach(m=>{ if(m.dir===dir&&Math.abs((dir==='X'?m.y1:m.x1)-c)<TOL) sc+=3; });
      M.zones.forEach(z=>{ if(['void','colfree','dbl','core'].includes(z.type)&&c>=(ax==='y'?z.y1:z.x1)-TOL&&c<=(ax==='y'?z.y2:z.x2)+TOL) sc+=z.ramp?4:2; });
      if(!best||sc>best.sc) best={sc,c,lab:gl.labels[i]}; });
    out.push({dir,c:best.c,lab:best.lab}); });
  return out;
}
function sectionSVG(E,cut){
  const {M,R,sc}=E, L=M.L, nL=M.nL; const along=cut.dir==='X'; const c=cut.c;
  const z=[0]; for(let k=1;k<nL;k++) z[k]=z[k-1]+(L[k-1].h||0);
  const gi=L.findIndex(l=>normF(l.name)===normF(W.floors.ground||'G/F')); const z0=gi>=0?z[gi]:0;
  const ag=along?{pos:E.C.px.pos,labels:E.C.axl||E.C.xl}:{pos:E.C.py.pos,labels:E.C.ayl||E.C.yl};
  const ps=along?M.xs:M.ys; const u0=Math.min(...ps,...ag.pos), u1=Math.max(...ps,...ag.pos), H=z[nL-1];
  const S=Math.min(760/Math.max(u1-u0,1),520/Math.max(H,1)), pad=60, Wd=(u1-u0)*S+pad*2, Ht=H*S+pad*2;
  const U=u=>pad+(u-u0)*S, V=h=>Ht-pad-h*S; let g='';
  const hid='s'+Math.random().toString(36).slice(2,7);
  g+=`<defs><pattern id="${hid}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#d62828" stroke-width="1.1"/></pattern></defs>`;
  const at=(u)=>along?[u,c]:[c,u];
  // restricted zones / core cut by the section
  M.zones.forEach(zn=>{ const a1=along?zn.y1:zn.x1, a2=along?zn.y2:zn.x2; if(c<a1-TOL||c>a2+TOL) return; const b1=along?zn.x1:zn.y1, b2=along?zn.x2:zn.y2;
    if (zn.type==='core') g+=`<rect x="${U(b1)}" y="${V(z[zn.s2+1]??H)}" width="${(b2-b1)*S}" height="${(z[zn.s2+1]-z[zn.s1])*S}" fill="#eee" stroke="#555" stroke-width="2.5"/><text x="${U((b1+b2)/2)}" y="${V(z[zn.s2+1])-4}" text-anchor="middle" font-size="9">CORE</text>`;
    else if (zn.ramp){ const d=zn.ramp.dir, up=(d==='+X'&&along)||(d==='+Y'&&!along), dn=(d==='-X'&&along)||(d==='-Y'&&!along);
      const tp=zn.ramp.tr?(R.checks.find(cc=>cc.cat==='Transfer plate'&&cc.item.includes('INCLINED'))||{}).need:0;
      if ((up||dn)&&tp) g+=`<polygon points="${U(b1)},${V(z[up?zn.s1:zn.s2])} ${U(b2)},${V(z[up?zn.s2:zn.s1])} ${U(b2)},${V(z[up?zn.s2:zn.s1]-tp)} ${U(b1)},${V(z[up?zn.s1:zn.s2]-tp)}" fill="#1a9e3f" fill-opacity=".4" stroke="#1a9e3f"/>`;
      if (up||dn) g+=`<line x1="${U(b1)}" y1="${V(z[up?zn.s1:zn.s2])}" x2="${U(b2)}" y2="${V(z[up?zn.s2:zn.s1])}" stroke="#1f4fd1" stroke-width="3"/><text x="${U((b1+b2)/2)}" y="${V((z[zn.s1]+z[zn.s2])/2)-6}" text-anchor="middle" font-size="9" fill="#1f4fd1">${esc(zn.name.toUpperCase())}</text>`;
      else g+=`<rect x="${U(b1)}" y="${V(z[zn.s2])}" width="${(b2-b1)*S}" height="${(z[zn.s2]-z[zn.s1])*S}" fill="#e8f1ff" stroke="#1f4fd1" stroke-dasharray="4 3"/>`; }
    else if (['void','colfree','dbl'].includes(zn.type)) g+=`<g class="ly-zone"><rect x="${U(b1)}" y="${V(z[zn.s2+1])}" width="${(b2-b1)*S}" height="${(z[zn.s2+1]-z[zn.s1])*S}" fill="url(#${hid})" fill-opacity=".45" stroke="#d62828" stroke-dasharray="5 3"/><text x="${U((b1+b2)/2)}" y="${V((z[zn.s1]+z[zn.s2+1])/2)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#b71c1c" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(zn.name.toUpperCase())}</text></g>`; });
  // slabs
  const cuts=[...new Set(ps.concat(ag.pos))].sort((a,b)=>a-b);
  for(let k=0;k<nL;k++){ for(let i=0;i<cuts.length-1;i++){ const a=cuts[i], b=cuts[i+1]; if(b-a<1e-6) continue; const [x,y]=at((a+b)/2); if(M.slabAt(k,x,y)) g+=`<line x1="${U(a)}" y1="${V(z[k])}" x2="${U(b)}" y2="${V(z[k])}" stroke="#222" stroke-width="${k===0?3:2}"/>`; } }
  // long-span / transfer members on this line
  const trussPosts=new Set();
  M.members.forEach(m=>{ if(m.dir!==cut.dir||Math.abs((along?m.y1:m.x1)-c)>TOL) return; const ch=R.ch[m.id]; if(!ch||!ch.sys) return; const a=along?m.x1:m.y1, b=along?m.x2:m.y2;
    const col=ch.v==='fail'?'#d62828':ch.v==='marg'?'#e08a00':'#1a9e3f';
    if (ch.sys==='RCWALL'||ch.sys==='STRUSS'){ const top=ch.where==='above'?z[m.k+1]:z[m.k], bot=ch.where==='above'?z[m.k]:z[m.k-1]; g+=`<rect x="${U(a)}" y="${V(top)}" width="${(b-a)*S}" height="${(top-bot)*S}" fill="${ch.sys==='RCWALL'?'#cfe8d6':'none'}" stroke="${col}" stroke-width="1.5"/>`;
      if (ch.sys==='STRUSS'){ const n=Math.max(2,Math.round((b-a)/3)); for(let j=0;j<n;j++){ const xa=a+(b-a)*j/n, xb=a+(b-a)*(j+1)/n; g+=`<line x1="${U(xa)}" y1="${V(j%2?top:bot)}" x2="${U(xb)}" y2="${V(j%2?bot:top)}" stroke="${col}"/>`; } } }
    else { const D=ch.D||0.5; g+=`<rect x="${U(a)}" y="${V(z[m.k])}" width="${(b-a)*S}" height="${Math.max(2,D*S)}" fill="${col}" fill-opacity=".55" stroke="${col}"/>`; }
    const deep=ch.sys==='RCWALL'||ch.sys==='STRUSS', ty=deep?V((ch.where==='above'?(z[m.k]+z[m.k+1]):(z[m.k]+z[m.k-1]))/2)+4:V(z[m.k])+Math.max(10,(ch.D||0.5)*S+10);
    if (ch.tag) g+=`<text x="${U(a+(b-a)*0.25)}" y="${ty}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${col}" stroke="#fff" stroke-width="3" paint-order="stroke">${ch.tag}${ch.inTruss?' (LONG SPAN)':''}</text>`;
    if (ch.inTruss) m.pts.forEach(pk=>{ const pp=M.pmap.get(pk); if(!pp) return; trussPosts.add(pp.id+'|'+m.k); }); });
  if (R.used.has('PLATE')) Object.values(M.levelInfo).forEach(li=>{ if(!li.carries||!li.plate) return; const t=R.checks.find(cc=>cc.cat==='Transfer plate'&&cc.where===L[li.k].name); if(!t) return; const xs=li.pts.map(p=>along?p.x:p.y); g+=`<rect x="${U(Math.min(...xs)-1)}" y="${V(z[li.k])}" width="${(Math.max(...xs)-Math.min(...xs)+2)*S}" height="${t.need*S}" fill="#1a9e3f" fill-opacity=".35" stroke="#1a9e3f"/>`; });
  // columns on the cut line, storey by storey (with offsets)
  M.pts.forEach(p=>{ if(Math.abs((along?p.y:p.x)-c)>TOL) return; const o=R.offsets[p.id]||{}; const u=(along?p.x+(o.dx||0):p.y+(o.dy||0));
    for(let s=0;s<nL-1;s++){ const st=M.col[s][p.id]; if(!M.present(st)||st==='core') continue; const w=Math.max(2,((R.colSize[p.id]||[])[s]||{side:0.5}).side*S);
      if (trussPosts.has(p.id+'|'+s)){ g+=`<line x1="${U(u)}" y1="${V(z[s])}" x2="${U(u)}" y2="${V(z[s+1])}" stroke="#1a9e3f" stroke-width="1.5"/>`; continue; }
      g+=`<rect x="${U(u)-w/2}" y="${V(z[s+1])}" width="${w}" height="${(z[s+1]-z[s])*S}" fill="#fff" stroke="#111"/>`; } });
  // ground, levels, grid
  g+=`<line x1="${pad-30}" y1="${V(z0)}" x2="${Wd-pad+30}" y2="${V(z0)}" stroke="#7a5" stroke-width="1" stroke-dasharray="10 4"/><text x="${pad+4}" y="${V(z0)-3}" font-size="8.5" fill="#5a3">GROUND LEVEL</text>`;
  for(let k=0;k<nL;k++) g+=`<text x="${pad-8}" y="${V(z[k])+3}" text-anchor="end" font-size="9.5" font-weight="700">${esc(L[k].name)}</text><text x="${Wd-pad+8}" y="${V(z[k])+3}" font-size="8.5" fill="#555">${(z[k]-z0>=0?'+':'')}${f2(z[k]-z0)}</text>`;
  ag.pos.forEach((p,i)=>{ g+=`<line x1="${U(p)}" y1="${pad-8}" x2="${U(p)}" y2="${Ht-pad+10}" stroke="#9aa" stroke-width=".6" stroke-dasharray="9 3 2 3"/><circle cx="${U(p)}" cy="${Ht-pad+22}" r="9" fill="#fff" stroke="#333"/><text x="${U(p)}" y="${Ht-pad+26}" text-anchor="middle" font-size="10">${esc(ag.labels[i])}</text>`; });
  return `<svg viewBox="0 0 ${Wd} ${Ht}" width="100%" style="max-width:${Wd}px">${g}</svg>`;
}
function sectionsHTML(E){ return sectionLines(E).map(cut=>`<div class="planbox"><div class="planimg">${sectionSVG(E,cut)}<div class="ptitle">SECTION ${cut.dir==='X'?'A-A':'B-B'} (ALONG GRID ${esc(String(cut.lab))})</div></div></div>`).join(''); }
const LEGEND=`<div class="legend"><b>LEGEND:</b>
<span><svg width="14" height="14"><rect x="1" y="1" width="12" height="12" fill="#fff" stroke="#555" stroke-width="3"/></svg>SERVICE CORE</span>
<span><svg width="14" height="14"><rect x="2" y="2" width="10" height="10" fill="#fff" stroke="#111"/><path d="M2 2L12 12M12 2L2 12" stroke="#111"/></svg>COLUMN ABOVE &amp; BELOW</span>
<span><svg width="14" height="14"><rect x="2" y="2" width="10" height="10" fill="#fff" stroke="#111" stroke-dasharray="2.5 1.5"/></svg>COLUMN BELOW</span>
<span><svg width="14" height="14"><defs><pattern id="lg" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#111"/></pattern></defs><rect x="2" y="2" width="10" height="10" fill="url(#lg)" stroke="#111"/></svg>COLUMN ABOVE</span>
<span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#1f4fd1" stroke-width="2"/></svg>MAIN BEAM</span>
<span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#36a9e1" stroke-width="1.2"/></svg>SECONDARY BEAM</span>
<span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#d62828" stroke-width="2"/></svg>CANTILEVER BEAM</span>
<span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#1a9e3f" stroke-width="4"/></svg>TRANSFER / LONG-SPAN (dashed = truss)</span>
<span><svg width="22" height="12"><rect x="1" y="1" width="20" height="10" fill="#fde" stroke="#d62828" stroke-dasharray="4 2"/></svg>RESTRICTED ZONE</span>
<span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#333" stroke-width="3"/></svg>WALL</span></div>`;
function keyPlan(M,grp){
  const rows=[]; for(let k=M.nL-1;k>=1;k--) rows.push(`<div style="padding:0 4px;${k>=grp.k1&&k<=grp.k2?'background:#1f4fd1;color:#fff;font-weight:700':''}">${esc(M.L[k].name)}</div>`);
  return `<div class="key"><div class="note">KEY PLAN</div>${rows.join('')}</div>`;
}

/* ---------- UI ---------- */
const $=s=>document.querySelector(s);
let RES=null, view={scheme:null,step:1,tab:'schemes',hide:new Set(['req']),cmp:null,cmpPlan:0,secOpen:new Set()};
function fieldI(label,obj,key,w){ return `<label>${esc(label)}<input data-k="${key}" value="${esc(obj[key]??'')}" style="width:${w||'80px'}"></label>`; }
function bindFields(root,obj){ root.querySelectorAll('[data-k]').forEach(el=>{ const k=el.dataset.k; const ev=el.type==='checkbox'?'change':'input'; el.addEventListener(ev,()=>{ obj[k]=el.type==='checkbox'?el.checked:el.value; changedW(); }); }); }
function tableI(rows,cols,host,redraw){
  const t=document.createElement('table'); t.className='ed';
  t.innerHTML='<tr>'+cols.map(c=>`<th>${esc(c.l)}</th>`).join('')+'<th></th></tr>';
  rows.forEach((r,ri)=>{ const tr=document.createElement('tr');
    cols.forEach(c=>{ const td=document.createElement('td'); let el;
      if (c.t==='extra'){ // only the inputs that apply to this row's type, each with its own label
        const fs=c.fields.filter(f=>f.kinds.includes(r.kind)); if(!fs.length){ td.innerHTML='<span class="note">—</span>'; tr.appendChild(td); return; }
        td.className='xtra'; fs.forEach(f=>{ const lb=document.createElement('label'); lb.textContent=f.l+' '; let e;
          if (f.t==='sel'){ e=document.createElement('select'); e.innerHTML=f.o.map(([v,tx])=>`<option value="${esc(v)}">${esc(tx)}</option>`).join(''); e.value=r[f.k]??f.o[0][0]; if(r[f.k]===undefined) r[f.k]=f.o[0][0]; e.onchange=()=>{r[f.k]=e.value;changedW();}; }
          else { e=document.createElement('input'); e.value=r[f.k]??''; e.style.width=f.w||'50px'; e.placeholder=f.ph||''; e.oninput=()=>{r[f.k]=e.value;changedW();}; }
          lb.appendChild(e); td.appendChild(lb); }); tr.appendChild(td); return; }
      if (c.t==='sel'){ el=document.createElement('select'); el.innerHTML=c.o.map(([v,tx])=>`<option value="${esc(v)}">${esc(tx)}</option>`).join(''); el.value=r[c.k]??c.o[0][0]; el.onchange=()=>{r[c.k]=el.value;changedW();redraw&&redraw();}; }
      else if (c.t==='chk'){ el=document.createElement('input'); el.type='checkbox'; el.checked=!!r[c.k]; el.onchange=()=>{r[c.k]=el.checked;changedW();}; }
      else { el=document.createElement('input'); el.value=r[c.k]??''; el.style.width=c.w||'90px'; el.placeholder=c.ph||''; el.oninput=()=>{r[c.k]=el.value;changedW();}; }
      td.appendChild(el); tr.appendChild(td); });
    const td=document.createElement('td'); const d=document.createElement('button'); d.textContent='✕'; d.title='Delete'; d.onclick=()=>{rows.splice(ri,1);changedW();redraw();}; const cp=document.createElement('button'); cp.textContent='⧉'; cp.title='Copy'; cp.onclick=()=>{rows.splice(ri+1,0,clone(r));changedW();redraw();}; td.append(cp,d); tr.appendChild(td); t.appendChild(tr); });
  host.appendChild(t); const a=document.createElement('button'); a.textContent='+ Add row'; a.onclick=()=>{ const n={}; cols.forEach(c=>{ if(c.t!=='extra') n[c.k]=c.t==='chk'?false:c.t==='sel'?c.o[0][0]:''; }); rows.push(n); changedW(); redraw(); }; host.appendChild(a);
}
function renderSteps(){
  const h=$('#steps'); const s=view.step;
  const tabs=[[1,'1  Floors'],[2,'2  Grid'],[3,'3  Floor types'],[4,'4  Cores & constraints'],[5,'Site & settings']];
  let html=`<div class="steptabs">${tabs.map(([i,t])=>`<button data-s="${i}" class="${i===s?'on':''}">${t}</button>`).join('')}</div><div id="stepBody" class="card"></div>`;
  h.innerHTML=html; h.querySelectorAll('.steptabs button').forEach(b=>b.onclick=()=>{view.step=+b.dataset.s;renderSteps();});
  const B=$('#stepBody'); const re=()=>renderSteps();
  if (s===1){
    B.innerHTML=`<h2>Step 1 — Floors</h2><div class="hint">Floors are generated automatically. Enter the typical values, then add exception rows for floors that differ. Floor lists: <code>G/F</code>, <code>1/F~4/F</code>, <code>B3/F~B1/F, 6/F</code>.</div>
    <div class="row">${fieldI('Basements',W.floors,'basements','60px')}${fieldI('Ground floor name',W.floors,'ground','70px')}${fieldI('Top floor no.',W.floors,'top','60px')}${fieldI('Skip numbers (e.g. 4,14,24)',W.floors,'skip','140px')}${fieldI('Roof name',W.floors,'roof','60px')}</div>
    <div class="row"><b style="align-self:center">Typical:</b>${fieldI('F-to-F (m)',W.floors,'h','60px')}${fieldI('Headroom (m)',W.floors,'hr','60px')}${fieldI('Services (m)',W.floors,'sv','60px')}${fieldI('Use',W.floors,'use','100px')}${fieldI('LL (kPa)',W.floors,'ll','60px')}</div><h3>Exceptions</h3><div id="exc"></div><h3>Result</h3><div id="floorPrev"></div>`;
    bindFields(B,W.floors);
    tableI(W.exc,[{k:'floors',l:'Floors',w:'120px',ph:'1/F~4/F'},{k:'h',l:'F-to-F',w:'55px'},{k:'hr',l:'Headroom',w:'55px'},{k:'sv',l:'Services',w:'55px'},{k:'use',l:'Use',w:'100px'},{k:'ll',l:'LL',w:'45px'},{k:'free',l:'Plant / refuge (truss allowed)',t:'chk'}],$('#exc'),re);
    floorPreview();
  }
  if (s===2){
    B.innerHTML=`<h2>Step 2 — Grid</h2><div class="hint">Labels: <code>1-8</code>, <code>A-F</code> (I and O are skipped) or a list <code>A,B,C</code>. Spacings in m, one per bay. Plain number = centre to centre. Prefix: <b>e</b> = clear face to face, <b>f</b> = centre to far face of next column, <b>n</b> = centre to near face, <b>f&lt; / n&lt;</b> = measured from the face of this column, <b>b</b> = boundary to column face (first / last only). Example: <code>b3, e10, 10, 10, 12, e10, b3</code>. Real centre-to-centre spacings are recalculated for each scheme from its column sizes.</div>
    <div class="row">${fieldI('X labels',W.grid,'xl','90px')}${fieldI('X spacings (m)',W.grid,'xs','380px')}</div><div class="row">${fieldI('Y labels',W.grid,'yl','90px')}${fieldI('Y spacings (m)',W.grid,'ys','380px')}</div>
    <h3>Second grid (optional, e.g. tower walls)</h3><div class="row"><label>Use<input type="checkbox" data-k="on" ${W.grid2.on?'checked':''}></label>${fieldI('Name',W.grid2,'name','40px')}${fieldI('X labels',W.grid2,'xl','90px')}${fieldI('X spacings (c/c)',W.grid2,'xs','200px')}${fieldI('Y labels',W.grid2,'yl','80px')}${fieldI('Y spacings',W.grid2,'ys','140px')}${fieldI('Origin X',W.grid2,'ox','50px')}${fieldI('Origin Y',W.grid2,'oy','50px')}${fieldI('Floors',W.grid2,'floors','100px')}<label>Columns<input type="checkbox" data-k="cols" ${W.grid2.cols?'checked':''}></label></div>
    <h3>My column layouts (optional)</h3><div class="hint">Your own column layouts. They are always fully checked and listed under “My column layouts” with the result, pass or fail (no screening, no “not needed” filter). Bays in m, centre to centre, from the building edge: <code>3c, 10, 10, 10, 3c</code> (<b>c</b> = end cantilever, first / last only), <code>3@12</code> = three bays of 12 m; they must add up to the building length. Blank = the question's grid. <b>Transfer at</b>: the first floor of the upper grid (blank = one grid for all floors; schemes with and without transfer over the restricted zones are both checked). Upper X / Y blank = same as below.</div><div id="mylays"></div>`;
    bindFields(B.querySelectorAll('.row')[0],W.grid); bindFields(B.querySelectorAll('.row')[1],W.grid); bindFields(B.querySelectorAll('.row')[2],W.grid2);
    tableI(W.mylays,[{k:'name',l:'Name',w:'110px'},{k:'x',l:'X bays (below)',w:'170px'},{k:'y',l:'Y bays (below)',w:'150px'},{k:'from',l:'Transfer at',w:'60px'},{k:'xu',l:'X bays (above)',w:'170px'},{k:'yu',l:'Y bays (above)',w:'150px'}],$('#mylays'),re);
  }
  if (s===3){
    B.innerHTML=`<h2>Step 3 — Floor types</h2><div class="hint">Usually 3–6 types. Each type lists its floors, building extent (blank = whole grid / boundary; e.g. X <code>1~6</code>, Y <code>A~D+2</code>), and the column spacing rule for that type. Later rows win if floors overlap.</div><div id="types"></div>`;
    tableI(W.types,[{k:'name',l:'Name',w:'130px'},{k:'floors',l:'Floors',w:'110px'},{k:'x',l:'Extent X',w:'80px'},{k:'y',l:'Extent Y',w:'80px'},{k:'minSp',l:'Min. column spacing (m)',w:'55px'},{k:'spType',l:'Measured',t:'sel',o:[['c','c/c'],['e','clear']]},{k:'noWall',l:'No structural wall',t:'chk'}],$('#types'),re);
  }
  if (s===4){
    B.innerHTML=`<h2>Step 4 — Cores and constraints</h2><div class="hint">Positions by grid: <code>1~2</code>, <code>3+5~5</code> (5 m beyond line 3), <code>@12.5</code> (absolute). Floors: list, range, or a floor-type name; blank = all floors. Cores are rigid supports and are not calculated. Wall rows: X/Y give the first wall (<code>T:T1</code> to refer to grid T), with count and dx / dy. Spacing zone: X / Y / Floors + min. spacing — inside it this replaces the floor type's requirement (e.g. 8 m in the car park, 10 m in the shops on the same floor). Ramp: X / Y = ramp extent, Floors = <code>low~top</code> (e.g. <code>B1/F~G/F</code>), direction it rises, max. gradient (blank = setting).</div><div id="cons"></div>`;
    tableI(W.cons,[{k:'kind',l:'Type',t:'sel',o:KINDS},{k:'name',l:'Name',w:'120px'},{k:'x',l:'X',w:'80px'},{k:'y',l:'Y',w:'80px'},{k:'floors',l:'Floors',w:'100px'},
      {k:'_x',l:'Details for this type',t:'extra',fields:[
        {k:'head',l:'Headroom (m)',kinds:['void','dbl'],w:'45px'},{k:'svc',l:'Services (m)',kinds:['void','dbl'],w:'45px'},
        {k:'sp',l:'Min. spacing (m)',kinds:['spacing'],w:'45px'},{k:'spt',l:'measured',t:'sel',o:[['c','c/c'],['e','clear']],kinds:['spacing']},
        {k:'dir',l:'Rises',t:'sel',o:[['+X','+X'],['-X','−X'],['+Y','+Y'],['-Y','−Y']],kinds:['ramp']},{k:'grad',l:'Max 1:',kinds:['ramp'],w:'35px',ph:String(W.set.maxGrad||6)},
        {k:'rcol',l:'Columns',t:'sel',o:[['yes','pass through ramp'],['no','not in ramp (stop below)'],['plate','land on thickened ramp (inclined transfer plate)']],kinds:['ramp']},
        {k:'px',l:'Partitions along X (spacings)',kinds:['periph'],w:'150px',ph:'e.g. 3.75,3.75,3.5,...'},{k:'py',l:'along Y',kinds:['periph'],w:'90px'},
        {k:'n',l:'Count',kinds:['wall'],w:'35px'},{k:'dx',l:'dx',kinds:['wall'],w:'35px'},{k:'dy',l:'dy',kinds:['wall'],w:'35px'}]}],$('#cons'),re);
  }
  if (s===5){
    B.innerHTML=`<h2>Site and settings</h2><div class="row">${fieldI('Ground level mPD',W.site,'ground','60px')}${fieldI('Groundwater mPD',W.site,'gwl','60px')}${fieldI('Rockhead mPD',W.site,'rock','60px')}${fieldI('Base slab / pile cap thk (m)',W.site,'raft','50px')}<label>Adjoining buildings<input type="checkbox" data-k="adjacent" ${W.site.adjacent?'checked':''}></label></div><h3>Rules (from your template, editable)</h3><div class="row" id="setRow">${Object.keys(DEF_SET).map(k=>fieldI(SET_LABELS[k],W.set,k,'55px')).join('')}</div><button id="rstSet">Restore defaults</button>`;
    bindFields(B.querySelector('.row'),W.site); B.querySelectorAll('#setRow [data-k]').forEach(el=>el.oninput=()=>{ W.set[el.dataset.k]=num(el.value)??DEF_SET[el.dataset.k]; changedW(); });
    $('#rstSet').onclick=()=>{ W.set={...DEF_SET}; changedW(); renderSteps(); };
  }
}
function floorPreview(){
  const host=$('#floorPrev'); if(!host) return; const C=compile(W,null,null);
  host.innerHTML=(C.err.length?C.err.map(e=>`<div class="err">${esc(e)}</div>`).join(''):'')+`<table class="mini"><tr><th>Floor</th><th>F-to-F</th><th>Headroom</th><th>Services</th><th>Use</th><th>LL</th><th>Structural zone of slab above</th></tr>${C.lv.slice().reverse().map((l,i)=>{ const z=l.h-l.head-l.svc; return `<tr><td>${esc(l.name)}</td><td>${f2(l.h)}</td><td>${f2(l.head)}</td><td>${f2(l.svc)}</td><td>${esc(l.use)}</td><td>${l.ll??''}</td><td><b>${f0(z*1000)} mm</b></td></tr>`; }).join('')}</table>`;
}
let tmr=null;
function changedW(){ saveW(); clearTimeout(tmr); tmr=setTimeout(()=>{ if(view.step===1) floorPreview(); run(); },400); }
let runTok=0;
function run(){
  const tok=++runTok; const g=evalGen(W);
  const prog=x=>{ let el=$('#prog'); if(!el){ el=document.createElement('div'); el.id='prog'; el.className='prog noprint'; document.body.appendChild(el); } el.textContent=x?`${x.phase} … ${x.i} / ${x.n}`:''; el.style.display=x?'block':'none'; };
  const step=()=>{ if(tok!==runTok) return; const t0=performance.now(); let x;
    try { do { x=g.next(); } while(!x.done&&performance.now()-t0<60); } catch(e){ console.error(e); RES={err:['Calculation error: '+e.message]}; prog(null); renderOut(); return; }
    if (!x.done){ prog(x.value); setTimeout(step,0); return; }
    prog(null); RES=x.value; if(RES.list&&view.scheme&&!RES.list.some(e=>e.sc.id===view.scheme)) view.scheme=null; renderOut(); };
  step();
}
function planLevels(E,grp){ const out=[]; for(let k=grp.k1;k<=grp.k2;k++) out.push(k); return out; }
function planChecks(E,grp){
  const {M,R,C}=E; const ks=planLevels(E,grp); const tnames=new Set(ks.map(k=>(W.types[C.typeOf[Math.max(0,k-1)]]||{}).name).filter(Boolean));
  const unames=new Set(ks.map(k=>(W.types[C.typeOf[Math.min(k,M.nL-2)]]||{}).name).filter(Boolean));
  const out=[];
  M.members.filter(m=>ks.includes(m.k)).forEach(m=>{ const c=R.ch[m.id]; if(!c) out.push({v:'fail',t:`${m.level} GRID ${m.lineLabel} (${m.ends.join('–')}): NO SYSTEM AVAILABLE`}); else if(c.tag&&c.v!=='pass') out.push({v:c.v,t:`${c.tag} ${m.level} GRID ${m.lineLabel} (${m.ends.join('–')}): ${c.txt} — ${memberWhy(c)} (span ${f1(m.span)} m)`}); });
  R.checks.forEach(c=>{ if(c.v==='pass') return; const tn=[...tnames].find(n=>c.where===n||c.where.startsWith(n+' (')||c.where.endsWith('('+n+')'));
    if (c.cat==='Column spacing'){ if(unames.has(c.where)||M.zones.some(z=>z.type==='spacing'&&z.name===c.where&&ks.some(k=>M.zAct(z,Math.min(k,M.nL-2))))) out.push({v:c.v,t:`${c.item} — ${c.calc}`}); }
    else if (tn&&!['Long span','Transfer'].includes(c.cat)) out.push({v:c.v,t:`${c.item} — ${c.calc}`});
    else if (c.cat==='Column clash'&&ks.some(k=>k-1>=0&&M.present(M.col[k-1][c.pt]))) out.push({v:c.v,t:`${c.item}`});
    else if (c.cat==='Column') out.push({v:c.v,t:`${c.item} — ${c.calc}`}); });
  return out;
}
function planNotes(E,grp){ const n=planChecks(E,grp); if(!n.length) return '';
  const fail=n.some(x=>x.v==='fail');
  return `<div class="pnotes ly-ng ${fail?'fail':'marg'}"><b>${fail?'WHY THIS PLAN IS NOT FEASIBLE':'SLIGHTLY OFF ON THIS PLAN'}:</b>${n.map(x=>`<div>${V_ICON[x.v]} ${esc(x.t)}</div>`).join('')}</div>`; }
function planSide(E,grp){
  const {M,R,C,sc}=E; const k=grp.k1, s=Math.max(0,k-1); const t=W.types[C.typeOf[s]]||{}; const st=W.set; const tu=W.types[C.typeOf[Math.min(k,M.nL-2)]]||{};
  const ly=(id,label)=>`<label class="ly"><input type="checkbox" data-ly="${id}" ${view.hide.has(id)?'':'checked'}>${label}</label>`;
  const row=(v,txt)=>`<div class="crow">${v?V_ICON[v]:'•'} ${txt}</div>`;
  let h=`<div class="cons"><div class="note">CONSTRAINTS (${esc(M.L[k].name)})</div>`;
  // restricted zones on this plan
  const zs=M.zones.filter(z=>!['footprint','core','outside','spacing','keep'].includes(z.type)&&((k-1>=0&&M.zAct(z,k-1))||(k<=M.nL-2&&M.zAct(z,k))));
  h+=ly('zone','<b>Restricted zones</b>');
  if (!zs.length) h+=row(null,'none on this floor');
  zs.forEach(z=>{ const clash=R.checks.some(c=>c.cat==='Column clash'&&c.v==='fail'&&c.item.includes(z.name)); const nOff=Object.values(R.offsets).filter(o=>(o.why||[]).some(w=>w.includes(z.name))).length;
    h+=row(clash?'fail':'pass',`${esc(z.name)}: ${z.periph?'columns on the periphery only':'no column inside'}${nOff?` (${nOff} offset)`:''}`); });
  // spacing
  const sp=R.checks.find(c=>c.cat==='Column spacing'&&c.where===tu.name);
  h+=ly('sp',`<b>Column spacing</b> — ${esc(tu.name||'')} (numbers on plan)`);
  h+=row(sp?sp.v:null, tu.minSp?`required ≥ ${tu.minSp} m ${tu.spType==='e'?'clear':'c/c'}${sp?`; min. provided ${f2(sp.have)} m`:''}`:'no requirement');
  if (M.zones.some(z=>z.type==='spacing'&&M.zAct(z,Math.min(k,M.nL-2)))) h+=ly('req','<b>Spacing zones</b> (green cross hatch)');
  M.zones.filter(z=>z.type==='spacing'&&M.zAct(z,Math.min(k,M.nL-2))).forEach(z=>{ const c=R.checks.find(x=>x.cat==='Column spacing'&&x.where===z.name); h+=row(c?c.v:null,`${esc(z.name)}: ≥ ${z.minSp} m ${z.spType==='e'?'clear':'c/c'}${c?`; min. ${f2(c.have)} m`:''}`); });
  // structural zone
  const ty=R.typ.find(x=>x.type===t.name); const z=M.depth[k];
  if (ty&&z) { const d=ty.flat?ty.flat.drop:Math.max(ty.Dm||0,ty.Ds||0); h+=`<div class="crow"><b>Structural zone</b></div>`+row(d<=z+1e-9?'pass':verdictOf(d/z,st.tol),`${f0(z*1000)} mm; ${ty.flat?'drop panel':'deepest beam'} ${f0(d*1000)} mm`); }
  // edge, cantilever
  const nEdge=Object.values(R.offsets).filter(o=>(o.why||[]).some(w=>w.startsWith('building edge'))).length;
  h+=`<div class="crow"><b>Building edge</b></div>`+row('pass',`column faces inside edge${nEdge?` (${nEdge} offset)`:''}`);
  const cants=R.checks.filter(c=>c.cat==='Cantilever span'&&c.where.startsWith(t.name));
  if (cants.length) h+=row(cants.some(c=>c.v==='fail')?'fail':'pass',`cantilever ≤ ${sc.mat==='rc'?st.cantRC:st.cantSt} m (max. ${f2(Math.max(...cants.map(c=>c.need)))} m)`);
  h+=ly('ct','<b>Column types</b>')+Object.values(R.groups||{}).sort((a,b)=>a.id.localeCompare(b.id)).map(G=>row(null,`${G.id} ${f0(G.side*1000)} SQ.${G.desc?' — '+G.desc.toLowerCase():''}`)).join('');
  const n=planChecks(E,grp); h+=ly('ng',`<b>Problems on plan</b> (${n.length})`);
  return h+'</div>';
}
function prosCons(e){
  const P=[], C=[]; const sg=sigOf(e);
  if (e.sc.mat==='rc'){ P.push('Low material cost, local labour familiar','Inherent fire resistance, robust and durable','Good stiffness against wind'); C.push('Heavy self-weight → larger foundation','Formwork and curing → longer programme'); }
  else { P.push('Fast erection, prefabricated off site','Light weight → smaller columns and foundation'); C.push('Higher material cost','Fire and corrosion protection required','Specialist fabrication / site welding control'); }
  if (sg.floor==='FLAT SLAB'){ P.push('No downstand beams → minimum structural depth, free MEP routing','Simple flat formwork'); C.push('Punching shear at columns (drops / links)','Thicker, heavier slab'); }
  const mb=Math.max(...e.M.grids.filter(g=>g.cols).flatMap(g=>[...g.gx.sp,...g.gy.sp])); if (mb>=12){ P.push(`Long spans (max. ${f1(mb)} m) → fewer columns, flexible floor space`); C.push('Deeper / heavier beams, larger column loads'); } else { P.push(`Short spans (max. ${f1(mb)} m) → shallow, economical beams`); C.push('More columns on the floor'); }
  if (sg.tm==='TRANSFER'){ P.push('Columns above continue the regular grid; restricted zone kept clear by transfer'); C.push('Heavy transfer member, construction sequence / propping'); } else { P.push('No transfer structure — direct load path'); C.push('Long-span members needed at every floor over the restricted zone'); }
  if (sg.tr.includes('STOREY-DEEP')){ P.push(`Storey-deep ${e.sc.mat==='rc'?'wall / deep beam':'truss'} within the plant / refuge floor — no headroom loss`); C.push('Openings in storey-deep members restricted'); }
  if (sg.tr.includes('PLATE')){ P.push('Plate accommodates any column arrangement above'); C.push('Very heavy, large concrete pour, heat of hydration'); }
  if (sg.tr.includes('HANGER')){ P.push('Lower floors column-free'); C.push('Roof truss carries hung floors — sequence and deflection critical'); }
  if (sg.tr.includes('INCLINED')){ P.push('No heavy transfer member'); C.push('Horizontal kick-out forces at floor diaphragms'); }
  return {P,C};
}
function recHTML(L){
  const r=recPair(L); if(!r){
    const app=L.filter(e=>e.R.applicable); const cnt=new Map();
    app.forEach(e=>{ const seen=new Set(); e.R.checks.filter(c=>c.v==='fail').forEach(c=>{ const k=c.cat+' — '+c.item.replace(/^G\d+: /,'').replace(/[\d,.]+( x [\d,.]+)?/g,'#').slice(0,70); if(seen.has(k)) return; seen.add(k); const o=cnt.get(k)||{n:0,ex:c}; o.n++; cnt.set(k,o); }); if(e.R.meaningless&&e.R.worst!=='fail'){ const k='Not needed — '+e.R.meaningless.slice(0,70); const o=cnt.get(k)||{n:0,ex:{item:e.R.meaningless,where:'',calc:''}}; o.n++; cnt.set(k,o); } });
    const top=[...cnt.values()].sort((a,b)=>b.n-a.n).slice(0,6);
    const near=app.map(e=>({e,n:e.R.checks.filter(c=>c.v==='fail').length})).filter(x=>x.n>0).sort((a,b)=>a.n-b.n).slice(0,4);
    return `<div class="card rec fail"><b>No viable scheme found.</b> ${app.length} applicable scheme / layout combinations were checked. Most common reasons:
      <ul>${top.map(t=>`<li><b>${t.n}×</b> ${esc(t.ex.item)}${t.ex.where?` — ${esc(t.ex.where)}`:''}${t.ex.calc?`<div class="note">${esc(t.ex.calc)}</div>`:''}</li>`).join('')}</ul>
      ${near.length?`<div class="note">Closest: ${near.map(x=>`<a href="#" data-go="${x.e.sc.id}">${esc(x.e.sc.id)}</a> (${x.n} failing check${x.n>1?'s':''})`).join(', ')} — click to see its plans and the failing items.</div>`:''}</div>`; }
  if (!r.b) return `<div class="card rec marg"><b>Only ${r.a.sc.mat==='rc'?'RC':'steel'} schemes are viable</b> — no ${r.a.sc.mat==='rc'?'steel':'RC'} scheme passes.</div>`;
  const ok=r.d.length>0, as=r.as, sc=aScore(as), mx=aScore(as.map(x=>({...x,on:true})));
  const anyPair=r.rc.some(a=>r.stl.some(b=>distinctBy(a,b).length));
  if (!ok&&!anyPair) return `<div class="card rec fail"><b>No distinct RC + steel pair passes with the current rules.</b> Every viable RC and steel scheme has the same column layout and no needed transfer — only the material differs (not distinct).
  <div class="note" style="margin-top:6px">What blocks the alternatives here: ${[...new Set(L.filter(e=>e.R.meaningless).map(e=>e.R.meaningless.split(':')[1].split('—')[0].trim()))].slice(0,3).map(esc).join('; ')||'—'}${L.some(e=>e.R.checks.some(c=>c.cat==='Grid span'&&c.v==='fail'))?`; longer grids exceed the practical span (RC ${W.set.spanRC} m / steel ${W.set.spanSt} m)`:''}.</div>
  <div class="note">Options: (1) accept a longer steel span as a special case — raise “Steel: max. column spacing” in Site &amp; settings (e.g. 20 m) to get a long-span steel layout; (2) check the question for other requirements that change the grid (spacing zones, ramps, loading bays); (3) choose two schemes manually below and justify the difference.</div></div>`;
  return `<div class="card rec ${ok?'pass':'fail'}"><b>Answer: RC <a href="#" data-go="${r.a.sc.id}">${esc(r.a.sc.id)}</a> ${V_ICON[r.a.R.worst]} + STEEL <a href="#" data-go="${r.b.sc.id}">${esc(r.b.sc.id)}</a> ${V_ICON[r.b.R.worst]}</b> — ${ok?`✅ distinct, difference score ${sc} / ${mx}`:'❌ NOT distinct (same layout and transfer — pick another one in the lists below)'}.
  <table class="mini" style="margin:6px 0"><tr><th>Aspect</th><th>Different?</th><th>RC ${esc(r.a.sc.id)} | Steel ${esc(r.b.sc.id)}</th></tr>${as.map(x=>`<tr class="${x.on?'v-pass':''}"><td>${x.txt}</td><td>${x.on?'✅':'—'}</td><td>${esc(x.detail)}</td></tr>`).join('')}</table>
  <button data-cmp="${r.a.sc.id}|${r.b.sc.id}" class="noprint">Compare side by side</button><div class="note">Choose one RC and one steel scheme in the two lists below. HKIE: load path and framing plan must differ; RC vs steel with the same layout is NOT distinct.</div></div>`;
}
function appraisalHTML(L){
  const C0=L[0].C, M0=L[0].M;
  const zrows=[]; let cur=null; for(let k=M0.nL-1;k>=1;k--){ const z=Math.round(M0.depth[k]*1000), name=M0.L[k-1].name; if(cur&&cur.z===z) cur.to=name; else { cur={from:name,to:name,z}; zrows.push(cur); } }
  const uses=[...new Set(C0.lv.map(l=>String(l.use||'').toUpperCase()).filter(Boolean))];
  return `<div class="card"><h2>Design appraisal — ${esc(W.title)}</h2><table class="mini"><tr><th style="width:40%">Client requirement</th><th>Design implication</th></tr>
  <tr><td>1) COLUMN GRID</td><td>${(W.types||[]).map(t=>`${esc(t.floors||'all')}: ${t.minSp?`min. ${t.minSp} m ${t.spType==='e'?'CLEAR':'C/C'}`:'NO RESTRICTION'}`).join('<br>')}${(W.cons||[]).filter(c=>c.kind==='colfree'||c.kind==='void'||c.kind==='nocol').map(c=>`<br>${esc(c.floors||'all')}: NO COLUMN IN ${esc((c.name||'').toUpperCase())}`).join('')}</td></tr>
  <tr><td>2) MIN. HEADROOM → ALLOWABLE STRUCTURAL ZONE</td><td>${zrows.map(r=>`${esc(r.to)}${r.from!==r.to?' ~ '+esc(r.from):''}: <b>${f0(r.z)} mm</b>`).join('<br>')}</td></tr>
  <tr><td>3) IMPOSED LOAD (kPa)</td><td>${uses.map(u=>`${esc(u)}: ${IMPOSED[u]??'—'}`).join('; ')}</td></tr>
  <tr><td>4) COLUMN LAYOUTS TRIED</td><td>${RES.lays.map(l=>`<b>${l.id}</b>: ${esc(l.short)}`).join('<br>')}</td></tr></table></div>`;
}
function naReason(e){ const m=e.sc.must; if(m==='PLATE') return 'No transfer level: no column above is discontinued (columns over the atrium / cinema simply stop), so there is no load to collect on a plate — long-span girders are used instead';
  if(m==='INCL') return 'No small column offset between floors that an inclined column could take'; if(m==='HANG') return 'No floor that can be hung from a roof truss in this building';
  if(m==='STRUSS') return 'No long-span member that needs a storey-deep truss (no plant / refuge floor depth at that level)'; if(m==='PT') return 'No long-span member needing PT'; return 'Not needed in this building'; }
function compareHTML(L){
  const app=L.filter(feasibleE).sort((a,b)=>V_RANK[a.R.worst]-V_RANK[b.R.worst]);
  const r=recPair(L)||{};
  if (!view.cmpSel||!view.cmpSel.length) view.cmpSel=[r.a,r.b].filter(Boolean).map(e=>e.sc.id);
  const sel=app.filter(e=>view.cmpSel.includes(e.sc.id));
  let h=`<div class="card"><h2>Compare schemes</h2><div class="hint noprint">Tick the schemes to compare (all viable schemes are listed). Distinct = different column spacing / layout or transfer vs no transfer or a different transfer principle. Material alone is NOT distinct.</div>
  <div class="cmplist noprint">${app.map(e=>`<label><input type="checkbox" data-cmpsel="${e.sc.id}" ${view.cmpSel.includes(e.sc.id)?'checked':''}> <b>${e.sc.id}</b> ${V_ICON[e.R.worst]} ${esc(e.sc.name.toLowerCase())} — <span class="note">${esc(e.lay.short.toLowerCase())}</span></label>`).join('')}</div>`;
  if (!sel.length) return h+'<p>Select at least one scheme.</p></div>';
  // pairwise distinctness
  if (sel.length>1){ h+=`<h3>Distinct?</h3><table class="mini"><tr><th></th>${sel.map(e=>`<th>${e.sc.id}</th>`).join('')}</tr>${sel.map(a=>`<tr><th>${a.sc.id}</th>${sel.map(b=>{ if(a===b) return '<td>—</td>'; const d=distinctBy(a,b); return d.length?`<td class="v-pass">✅ ${esc(d.map(t=>t.split(' (')[0]).join(', '))}</td>`:weakDiff(a,b)?'<td class="v-marg">⚠️ weak (member type only)</td>':`<td class="v-fail">❌ not distinct${a.sc.mat!==b.sc.mat?' (material only)':''}</td>`; }).join('')}</tr>`).join('')}</table>`; }
  const cell=e=>{ const sg=sigOf(e), pc=prosCons(e); const cols=e.R.checks.filter(c=>c.cat==='Column').map(c=>esc(c.item.replace('COLUMN ',''))).join('<br>');
    const mem=Object.values(e.R.ch).filter(c=>c&&c.tag).map(c=>`${c.tag} ${esc(c.m.level)} ${esc(c.txt)}`).join('<br>')||'—';
    const worst=e.R.checks.filter(c=>c.v!=='pass').slice(0,4).map(c=>`${V_ICON[c.v]} ${esc(c.item)}`).join('<br>')||'—';
    return {res:`${V_ICON[e.R.worst]} ${V_TXT[e.R.worst]}`,name:esc(e.sc.name),lay:`<b>${e.lay.id}</b> ${esc(e.lay.short)}`,mat:e.sc.mat==='rc'?'REINFORCED CONCRETE':'STRUCTURAL STEEL (COMPOSITE)',tm:sg.tm,tr:sg.tr,
      typ:e.R.typ.map(t=>`${esc(t.type)}: SLAB ${e.sc.mat==='rc'?W.set.slabRC:W.set.slabComp}, SB ${esc(t.sec)}, MB ${esc(t.main)}`).join('<br>'),mem,cols,worst,
      load:`SLAB → SECONDARY BEAM → MAIN BEAM${sg.tm==='TRANSFER'?' → COLUMN → TRANSFER ('+esc(sg.tr)+')':''} → COLUMN / CORE → FOUNDATION`,
      pro:pc.P.map(x=>'+ '+esc(x)).join('<br>'),con:pc.C.map(x=>'− '+esc(x)).join('<br>')}; };
  const cs=sel.map(cell);
  const rows=[['Result','res'],['Scheme','name'],['Column layout','lay'],['Material','mat'],['Transfer?','tm'],['Transfer / long-span system','tr'],['Vertical load path','load'],['Typical members','typ'],['Long-span / transfer members','mem'],['Columns','cols'],['Issues','worst'],['Advantages','pro'],['Disadvantages','con']];
  h+=`<div style="overflow-x:auto"><table class="mini cmp"><tr><th style="width:130px"></th>${sel.map(e=>`<th>${e.sc.id}</th>`).join('')}</tr>${rows.map(([l,k])=>`<tr><th>${l}</th>${cs.map(c=>`<td>${c[k]}</td>`).join('')}</tr>`).join('')}</table></div>`;
  // every floor, side by side: a new row wherever any selected scheme starts a new plan group
  const starts=new Set(); sel.forEach(e=>planGroups(e.M).forEach(g=>starts.add(g.k1))); const ks=[...starts].sort((a,b)=>a-b); const nL=sel[0].M.nL;
  h+=`<h3>Framing plans side by side (all floors)</h3>`;
  ks.forEach((k,i)=>{ const k2=(ks[i+1]||nL)-1; const nm=`${sel[0].M.L[k].name}${k2>k?' ~ '+sel[0].M.L[k2].name:''}`;
    h+=`<h3 class="u" style="margin-top:18px">${esc(nm)}</h3><div class="sbs">${sel.map(e=>{ const pp=planSVG2(e,k,{k1:k,k2}); return `<div><div class="ptitle">${e.sc.id}: ${esc(pp.title)}</div>${pp.svg}${planNotes(e,{k1:k,k2})}</div>`; }).join('')}</div>`; });
  h+='</div>';
  return h;
}
function renderOut(){
  const h=$('#out'); if (!RES) return;
  if (RES.err){ h.innerHTML=`<div class="card">${RES.err.map(e=>`<div class="err">${esc(e)}</div>`).join('')}</div>`; return; }
  const L=RES.list; view.tab=view.tab||'schemes';
  let html=`<div class="outtabs noprint">${[['appraisal','1. Design appraisal'],['schemes','2. Schemes'],['compare','3. Compare two schemes']].map(([k,l])=>`<button data-tab="${k}" class="${view.tab===k?'on':''}">${l}</button>`).join('')}</div>`;
  if (view.tab==='appraisal') html+=appraisalHTML(L);
  else if (view.tab==='compare') html+=compareHTML(L);
  else {
    html+=recHTML(L);
    const order=L.slice().sort((a,b)=>(b.R.applicable-a.R.applicable)||V_RANK[a.R.worst]-V_RANK[b.R.worst]||(a.lay.id<b.lay.id?-1:a.lay.id>b.lay.id?1:0));
    const rowH=e=>{ const worst=e.R.checks.filter(c=>c.v===e.R.worst&&e.R.worst!=='pass').slice(0,2); const cols=e.R.checks.filter(c=>c.cat==='Column');
      const res=!e.R.applicable?'<span class="na">— NOT APPLICABLE</span>':`${V_ICON[e.R.worst]} ${V_TXT[e.R.worst]}`;
      return `<tr data-id="${e.sc.id}" class="${view.scheme===e.sc.id?'sel':''} ${!e.R.applicable?'dim':''}"><td>${e.sc.id}</td><td>${esc(e.sc.name)}${e.sc.note?`<div class="note">${esc(e.sc.note)}</div>`:''}</td><td>${e.lay.id}</td><td style="white-space:nowrap">${res}</td><td>${!e.R.applicable?esc(naReason(e)):worst.map(c=>`${esc(c.item)} — ${esc(c.where)}: ${esc(c.calc)}`).join('<br>')||'—'}</td><td style="white-space:nowrap">${cols.map(c=>esc(c.item.replace('COLUMN ',''))).join('<br>')}</td></tr>`; };
    const app=order.filter(feasibleE), bad=order.filter(e=>e.R.applicable&&e.R.worst==='fail'), na=order.filter(e=>!e.R.applicable);
    html+=`<div class="card"><h2>Column layouts with viable schemes (${RES.lays.filter(l=>L.some(e=>e.lay===l&&feasibleE(e))).length} of ${RES.lays.length} checked)</h2><div class="hint">Generated from the building length, the minimum column spacing, end cantilevers and the core / restricted-zone edges, then screened (spacing, cantilever, spans). Only the most varied layouts are fully checked (setting “Max. column layouts”).</div><details ${view.layOpen?'open':''} id="layDet"><summary>Show the layout list</summary><table class="mini"><tr><th></th><th>Grid X (bays)</th><th>Grid Y (bays)</th><th>Above transfer level</th><th>Columns over restricted zones</th><th>Viable schemes</th></tr>${RES.lays.filter(l=>L.some(e=>e.lay===l&&feasibleE(e))).map(l=>{ const es=L.filter(e=>e.lay===l&&feasibleE(e)); return `<tr><td><b>${l.id}</b></td><td>${esc(l.bays.x)}${l.arch?' (as given)':''}</td><td>${esc(l.bays.y)}</td><td>${l.band?`from ${esc(L[0].C.names[l.band.u])}: X ${esc(l.ux.txt)}; Y ${esc(l.uy.txt)}`:'—'}${l.band3?`<br>from ${esc(L[0].C.names[l.band3.u])}: X ${esc(l.band3.top.x.txt)}; Y ${esc(l.band3.top.y.txt)}`:''}</td><td>${esc(l.ttxt)}</td><td>${es.map(e=>`<a href="#" data-go="${e.sc.id}">${e.sc.base}</a> ${V_ICON[e.R.worst]}`).join(', ')||'<span class="ng">none</span>'}</td></tr>`; }).join('')}</table></details></div>`;
    const myL=RES.lays.filter(l=>l.custom);
    if (myL.length||(RES.myErr||[]).length) html+=`<div class="card"><h2>My column layouts</h2><div class="hint">Every scheme on your own layouts, pass or fail. Click a row to show its plans and report below.</div>${(RES.myErr||[]).map(e=>`<div class="err">${esc(e)}</div>`).join('')}${myL.map(l=>{ const es=L.filter(e=>e.lay===l&&e.R.applicable);
      return `<h3>${esc(l.id)} — ${esc(l.myName)}</h3><div class="note">${esc(l.short)}</div><table class="mini cat">${es.map(e=>{ const fails=e.R.checks.filter(c=>c.v==='fail'); const why=e.R.worst==='fail'?fails.slice(0,3).map(c=>`${esc(c.cat)}: ${esc(c.item)} — ${esc(c.where)}${c.calc?` (${esc(c.calc)})`:''}`).join('<br>')+(fails.length>3?`<br>… and ${fails.length-3} more`:''):e.R.worst==='marg'?e.R.checks.filter(c=>c.v==='marg').slice(0,2).map(c=>`${esc(c.item)} — ${esc(c.where)}`).join('<br>'):'—';
        return `<tr data-id="${e.sc.id}" class="${view.scheme===e.sc.id?'sel':''}"><td><b>${e.sc.id}</b></td><td>${esc(e.sc.name.toLowerCase())}</td><td style="white-space:nowrap">${V_ICON[e.R.worst]} ${V_TXT[e.R.worst]}</td><td>${why}</td></tr>`; }).join('')||'<tr><td>no applicable scheme</td></tr>'}</table>`; }).join('')}</div>`;
    const rp=recPair(L)||{}; const shown=e=>e.R.worst==='pass'||view.showMarg;
    const pickRow=(e,role)=>{ const cols=e.R.checks.filter(c=>c.cat==='Column').map(c=>esc(c.item.replace('COLUMN ','').replace(' (ENCASED)',''))).join(', '); const on=(role==='rc'?rp.a:rp.b)===e;
      const dd=role==='st'&&rp.a?distinctBy(rp.a,e):role==='rc'&&rp.b?distinctBy(e,rp.b):[];
      return `<tr data-pick="${role}" data-id="${e.sc.id}" class="${on?'sel':''} ${view.scheme===e.sc.id?'cur':''}"><td><input type="radio" name="pk_${role}" ${on?'checked':''}></td><td><b>${e.sc.id}</b> ${V_ICON[e.R.worst]}<div class="note">${esc(e.sc.name.toLowerCase())}</div><div class="note">${esc(e.lay.short.toLowerCase())}</div><div class="note">${cols}</div></td><td style="white-space:nowrap">${dd.length?`✅ ${aScore(role==='st'?aspects(rp.a,e):aspects(e,rp.b))} pts`:'<span class="ng">same as other</span>'}</td></tr>`; };
    const col=(list,role,ttl)=>`<div><h3>${ttl} (${list.filter(shown).length})</h3><table class="mini cat pick">${list.filter(shown).map(e=>pickRow(e,role)).join('')}</table></div>`;
    const nm=app.filter(e=>e.R.worst==='marg').length;
    html+=`<div class="card"><h2>Choose your two schemes</h2><div class="hint">Left: RC schemes. Right: steel schemes. Click a row to choose it (and to show its plans below). Hidden: ${bad.length+na.length} not feasible / not applicable, ${L.filter(e=>e.R.meaningless).length} with a transfer or grid change that is not needed (the same material works without it).</div>
    <div class="sbs">${col(rp.rc||[],'rc','RC SCHEMES')}${col(rp.stl||[],'st','STEEL SCHEMES')}</div>${nm?`<p class="noprint"><button id="bMarg">${view.showMarg?'Hide':'Show'} ${nm} slightly-off schemes</button></p>`:''}</div>`;
    const E=L.find(e=>e.sc.id===view.scheme)||order[0]; view.scheme=E.sc.id;
    html+=schemeHTML(E);
    h.innerHTML=html; bindOut(); bindReport(E); return;
  }
  h.innerHTML=html; bindOut();
}
function bindOut(){
  const h=$('#out');
  const bm=$('#bMarg'); if(bm) bm.onclick=ev=>{ ev.stopPropagation(); view.showMarg=!view.showMarg; renderOut(); };
  h.querySelectorAll('details.sec').forEach(d=>d.ontoggle=()=>{ if(d.open) view.secOpen.add(d.dataset.sec); else view.secOpen.delete(d.dataset.sec); });
  const ld=$('#layDet'); if(ld) ld.ontoggle=()=>{ view.layOpen=ld.open; };
  h.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ view.tab=b.dataset.tab; renderOut(); });
  h.querySelectorAll('.cat tr[data-id]').forEach(tr=>tr.onclick=()=>{ view.scheme=tr.dataset.id; if(tr.dataset.pick==='rc') view.pickRC=tr.dataset.id; if(tr.dataset.pick==='st') view.pickST=tr.dataset.id; renderOut(); });
  h.querySelectorAll('[data-go]').forEach(a=>a.onclick=ev=>{ ev.preventDefault(); view.scheme=a.dataset.go; view.tab='schemes'; renderOut(); });
  h.querySelectorAll('[data-cmp]').forEach(b=>b.onclick=ev=>{ ev.preventDefault(); view.cmpSel=b.dataset.cmp.split('|'); view.tab='compare'; renderOut(); });
  h.querySelectorAll('input[data-cmpsel]').forEach(c=>c.onchange=()=>{ const id=c.dataset.cmpsel; view.cmpSel=(view.cmpSel||[]).filter(x=>x!==id); if(c.checked) view.cmpSel.push(id); renderOut(); });
  h.querySelectorAll('input[data-ly]').forEach(c=>c.onchange=()=>{ const id=c.dataset.ly; if(c.checked) view.hide.delete(id); else view.hide.add(id); applyLayers(); });
  applyLayers();
}
function applyLayers(){ const h=$('#out'); ['zone','sp','ct','ng','req'].forEach(id=>h.classList.toggle('hide-'+id,view.hide.has(id))); h.querySelectorAll('input[data-ly]').forEach(c=>c.checked=!view.hide.has(c.dataset.ly)); }
function schemeHTML(E){
  const {sc,M,R}=E;
  const groups=planGroups(M);
  let h=`<div class="card sheet"><h2>Scheme ${sc.id}: ${esc(sc.name)} — ${R.applicable?V_ICON[R.worst]+' '+V_TXT[R.worst]:'— NOT APPLICABLE'}</h2>`;
  h+=`<p><b>COLUMN LAYOUT ${esc(E.lay.id)}:</b> ${esc(E.lay.short)} &nbsp; <b>FLOOR:</b> ${sc.floor==='flat'?'FLAT SLAB (NO BEAMS)':'BEAM AND SLAB'}</p>`;
  h+=`<h3>A. Material</h3><p class="u">${sc.mat==='rc'?'RC is selected because it provides high strength / low cost structure with good rigidity and robustness; durable and resists weathering; low maintenance cost.':'Steel is selected because of its high strength to weight ratio, simplicity of assembly, and light weight which reduces foundation cost.'}</p>`;
  h+=`<h3>B. Floor plans</h3>${LEGEND}`;
  groups.forEach(g=>{ const p=planSVG2(E,g.k1,g); h+=`<div class="planbox"><div class="planimg">${p.svg}<div class="ptitle">${esc(p.title)}</div>${planNotes(E,g)}</div><div class="side">${keyPlan(M,g)}${planSide(E,g)}</div></div>`; });
  h+=`<h3>Sections</h3>`+sectionsHTML(E);
  h+=`<h3>Member summary</h3><table class="mini"><tr><th>Floor type</th><th>Slab</th><th>Secondary beam</th><th>Main beam</th><th>Zone</th></tr>${R.typ.map(t=>`<tr><td>${esc(t.type)} (${esc(t.floors)})</td><td>${sc.mat==='rc'?W.set.slabRC:W.set.slabComp} THK @ ${f2(t.ls)} m</td><td>${esc(t.sec)}</td><td>${esc(t.main)}</td><td>${f0(t.zone*1000)}</td></tr>`).join('')}</table>`;
  { const nf=R.checks.filter(c=>c.v==='fail').length, nm=R.checks.filter(c=>c.v==='marg').length;
    h+=`<details class="sec" data-sec="feas" ${view.secOpen.has('feas')?'open':''}><summary><b>FEASIBILITY (YOUR TEMPLATE RULES)</b> — ${R.checks.filter(c=>c.cat!=='Column offset').length} checks${nf?`, <span class="ng">${nf} not OK</span>`:''}${nm?`, <span class="mg">${nm} slightly off</span>`:''}${!nf&&!nm?', <span class="ok">all OK</span>':''}</summary>`; }
  h+=`<table class="mini"><tr><th></th><th>Item</th><th>Where</th><th>Check</th><th>Ratio</th><th>If slightly off</th></tr>${R.checks.filter(c=>c.cat!=='Column offset').sort((a,b)=>V_RANK[b.v]-V_RANK[a.v]).map(c=>`<tr class="v-${c.v}"><td>${V_ICON[c.v]}</td><td>${esc(c.item)}</td><td>${esc(c.where)}</td><td>${esc(c.calc)}</td><td>${c.ratio>0?f2(c.ratio):''}</td><td>${c.v==='marg'?esc(c.fix):''}</td></tr>`).join('')}${(()=>{ const o=R.checks.filter(c=>c.cat==='Column offset'); return o.length?`<tr><td>✅</td><td>COLUMN OFFSETS (${o.length} NOS.)</td><td colspan="4">faces kept outside restricted zones and inside the building edge; whole column lines moved together<details><summary>list</summary>${o.map(c=>`${esc(c.item.replace('COLUMN ',''))} — ${esc(c.calc)}`).join('<br>')}</details></td></tr>`:''; })()}</table></details>`;
  const tr=[...R.used].filter(u=>['RCWALL','PLATE','INCL','HANG','STRUSS','PT'].includes(u));
  h+=`<h3>C. Functional frame</h3><p class="u">${sc.mat==='rc'?'RC slab spanning 1-way between secondary beams. Secondary beams supported by main beams on the column grid.':'Steel decking with in-situ concrete topping provided as floor slab; shear studs provide composite action; moment joints between columns and main beams, secondary beams pinned.'}
  ${M.members.length?` Long-span / transfer members (G-tags on plans) are provided at ${[...new Set(M.members.map(m=>m.level))].join(', ')}.`:''}
  ${tr.includes('PLATE')?' A transfer plate collects the columns / walls above.':''}${tr.includes('STRUSS')?' Storey-deep steel trusses in the plant / refuge floor carry the floors above and below.':''}${tr.includes('RCWALL')?' Storey-deep RC transfer walls in the plant / refuge floor act as deep beams.':''}${tr.includes('HANG')?' Lower floors are hung from trusses above by hanger columns.':''}${tr.includes('INCL')?' Columns with small offsets are inclined to land on the columns below.':''}
  ${sc.mat==='rc'?'RC core (vertical cantilever) and beam-column frame (portal frame action)':'Braced core (strut and tie action) and beam-column frame (portal frame action)'} provide vertical and horizontal stability.</p>`;
  if (M.lateral&&M.lateral.cores.length&&(M.lateral.rx>0.1||M.lateral.ry>0.1)) h+=`<p class="u">Torsion: the core is eccentric (ex = ${f1(M.lateral.ex)} m, ey = ${f1(M.lateral.ey)} m) — twisting of the core to be checked in detailed design.</p>`;
  h+='</div>'; h+=reportHTML(E); return h;
}
function initApp(){
  document.querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>{ if(!confirm('Replace the current input?')) return; W=normW(b.dataset.ex==='q2'?EX_Q2:EX_BLANK); saveW(); view.scheme=null; renderSteps(); run(); });
  $('#bSave').onclick=()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(W,null,1)],{type:'application/json'})); a.download=(W.title||'question').replace(/[^\w\- ]+/g,'_')+'.json'; a.click(); };
  $('#bOpen').onclick=()=>$('#fOpen').click();
  $('#fOpen').onchange=e=>{ const fl=e.target.files[0]; if(!fl) return; const r=new FileReader(); r.onload=()=>{ try{ W=normW(JSON.parse(r.result)); saveW(); renderSteps(); run(); }catch(err){ alert('Could not open: '+err.message); } }; r.readAsText(fl); e.target.value=''; };
  $('#bPrint').onclick=()=>window.print();
  $('#title').oninput=e=>{ W.title=e.target.value; changedW(); }; $('#title').value=W.title;
  renderSteps(); run();
}

/* =====================================================================
   Editable calculation report (works like a spreadsheet in report form)
   Yellow cells are inputs: edit and press Enter / Tab → the block recalculates.
   Overrides are saved with the question (W.ovr), free text in W.txt.
   ===================================================================== */
function reportBlocks(E){
  const {sc,R}=E, st=W.set, B=[]; const mm=x=>Math.round(x*1000);
  // typical members: one block set per distinct typical bay
  const seen=new Set();
  R.typ.forEach(t=>{ const key=`${f2(t.ls)}|${t.shortD}|${t.longD}|${t.sec}|${t.main}|${t.zone}`; if(seen.has(key)) return; seen.add(key);
    const tag=R.typ.filter(x=>`${f2(x.ls)}|${x.shortD}|${x.longD}|${x.sec}|${x.main}|${x.zone}`===key).map(x=>x.type).join(', ');
    if (t.flat){ B.push({id:'flat_'+key,kind:'flat',title:`FLAT SLAB WITH DROP PANELS (${tag})`,v:{L:mm(t.flat.Lf),t:mm(t.flat.t),drop:mm(t.flat.drop),Ld:mm(t.flat.Ld),Z:mm(t.zone)}}); return; }
    B.push({id:'slab_'+key,kind:'slab',title:`SLAB (${tag})`,v:{L:mm(t.ls),t:mm(t.tSlab)}});
    if (sc.mat==='rc'){
      B.push({id:'sb_'+key,kind:'sb',title:`SECONDARY BEAM B1 (${tag})`,v:{L:mm(t.shortD),D:mm(t.Ds),B:mm(t.Bs),Z:mm(t.zone)}});
      B.push({id:'mb_'+key,kind:'mb',title:`MAIN BEAM B2 (${tag})`,v:{L:mm(t.longD),D:mm(t.Dm),B:mm(t.Bm),Z:mm(t.zone)}});
    } else {
      B.push({id:'ssb_'+key,kind:'ssb',title:`SECONDARY BEAM SB (${tag})`,v:{L:t.shortD,ls:+t.ls.toFixed(2),w:st.kSt,ll:5,Z:mm(t.zone)}});
      B.push({id:'smb_'+key,kind:'smb',title:`MAIN BEAM MB (${tag})`,v:{L:t.longD,Lsb:t.shortD,ls:+t.ls.toFixed(2),n:Math.max(1,t.nSec-1),w:st.kSt,ll:5,Z:mm(t.zone)}});
    }
  });
  R.cants.forEach((c,i)=>B.push({id:`cb_${c.type}_${c.side}`,kind:'cb',title:`CANTILEVER BEAM CB (${c.type}, ${c.side} edge)`,v:{L:mm(c.len),D:mm(c.D),B:mm(Math.max(c.D/2,0.25)),max:sc.mat==='rc'?st.cantRC:st.cantSt}}));
  Object.values(R.ch).filter(c=>c&&c.tag).forEach(c=>{ const m=c.m, base={L:mm(m.span),Z:mm(m.avail)}; const ttl=`${c.tag} — ${m.level} GRID ${m.lineLabel} (${m.ends.join('–')})`;
    if (c.sys==='RC') B.push({id:'g_'+c.tag,kind:'rcg',title:ttl,v:{...base,D:mm(c.D),B:mm(c.B),w:c.wTrib,q:st.kRC,tf:st.tf,P:Math.round(c.P),fcu:st.fcuB}});
    else if (c.sys==='PT') B.push({id:'g_'+c.tag,kind:'pt',title:ttl,v:{...base,D:mm(c.D),B:mm(c.B)}});
    else if (c.sys==='RCWALL') B.push({id:'g_'+c.tag,kind:'wall',title:ttl,v:{L:mm(m.span),H:mm(c.D)}});
    else if (c.sys==='STRUSS') B.push({id:'g_'+c.tag,kind:'truss',title:ttl,v:{L:m.span,H:c.D,w:c.wTrib,q:st.kSt,fl:c.where==='above'?2:1,tf:st.tf,P:Math.round(c.P)}});
    else if (c.sys==='ST') B.push({id:'g_'+c.tag,kind:'stg',title:ttl,v:{L:m.span,w:c.wTrib,q:st.kSt,ll:5,P:Math.round(c.P),Z:mm(m.avail)}});
  });
  const plate=R.checks.find(c=>c.cat==='Transfer plate'); if (plate) B.push({id:'plate',kind:'plate',title:`TRANSFER PLATE (${plate.where})`,v:{L:mm(plate.need*W.set.plateRatio),t:mm(plate.need),Z:mm(plate.have)}});
  Object.values(R.groups||{}).sort((a,b)=>a.id.localeCompare(b.id)).forEach(G=>{ const c=G.crit; if(!c) return;
    B.push({id:'col_'+G.id,kind:'col',title:`COLUMN ${G.id}${G.desc?' — '+G.desc:''} (${G.count} NOS., GOVERNING ${c.p.label} AT ${E.M.L[c.s].name})`,v:{n:c.nfl,A:Math.round(c.area/Math.max(1,c.nfl)),q:sc.mat==='rc'?st.kRC:st.kSt,ef:st.ef,k:sc.mat==='rc'?st.nRC:st.nComp,side:mm(G.side),H:mm(E.M.L[c.s].h),P:Math.round(c.load-(sc.mat==='rc'?st.kRC:st.kSt)*c.area*st.ef)}}); });
  Object.values(R.groups||{}).sort((a,b)=>a.id.localeCompare(b.id)).forEach(G=>{ if(!G.punch) return; B.push({id:'pun_'+G.id,kind:'punch',title:`PUNCHING SHEAR AT COLUMN ${G.id}`,v:{V:Math.round(G.punch.V),c:mm(G.side),d:mm(G.punch.d),beta:G.punch.beta,vc:st.vcFlat,fcu:st.fcuB}}); });
  (R.ramps||[]).forEach((rp,i)=>B.push({id:'ramp_'+i,kind:'ramp',title:`${rp.z.name.toUpperCase()} (${E.M.L[rp.z.s1].name} → ${E.M.L[rp.z.s2].name})`,v:{rise:mm(rp.rise),run:mm(rp.run),n:rp.n,w:mm(rp.sw),t:mm(rp.t),Lb:mm(rp.Lb),D:mm(rp.Db)}}));
  // apply saved overrides
  const ov=((W.ovr||{})[sc.id])||{};
  B.forEach(b=>{ b.def={...b.v}; Object.assign(b.v,ov[b.id]||{}); b.ovr=ov[b.id]||{}; });
  return B;
}
function calcBlock(b){
  const v=b.v, st=W.set, tol=st.tol; let L=[], ratio=0;
  const I=k=>`<input class="cell${b.ovr[k]!==undefined?' ovr':''}" data-b="${esc(b.id)}" data-f="${k}" value="${esc(v[k])}" size="${String(v[k]).length+1}">`;
  const okTxt=r=>{ const vd=verdictOf(r,tol); return vd==='pass'?'<span class="ok">∴ OK.</span>':vd==='marg'?'<span class="mg">∴ SLIGHTLY OFF — ADJUST.</span>':'<span class="ng">∴ NOT OK.</span>'; };
  const n=x=>num(x)??0;
  const lt=(a,b)=>a<=b+1e-9?'<':'>';
  switch(b.kind){
    case 'slab': { const r=n(v.L)/n(v.t); ratio=r/st.sdSlab; L=[`SLAB : ${I('t')}mm THK.`,`S/D = ${I('L')} / ${n(v.t)} = ${f1(r)} ${lt(r,st.sdSlab)} ${st.sdSlab}    ${okTxt(ratio)}`]; break; }
    case 'sb': case 'mb': { const base=b.kind==='sb'?st.sdSec:st.sdMain, Lm=n(v.L)/1000, lim=lsr(base,Lm), r=n(v.L)/n(v.D); ratio=Math.max(r/lim,n(v.D)/n(v.Z));
      L=[`${b.kind==='sb'?'SECONDARY':'MAIN'} BEAM : ${I('D')} x ${I('B')}   (ZONE ${I('Z')} mm)`,`S/D = ${I('L')} / ${n(v.D)} = ${f1(r)} ${lt(r,lim)} ${base} x (10 / ${f1(Lm)}) = ${f1(lim)}    ${okTxt(r/lim)}`,`D = ${n(v.D)} ${n(v.D)<=n(v.Z)?'≤':'>'} ZONE ${n(v.Z)}    ${okTxt(n(v.D)/n(v.Z))}`]; break; }
    case 'cb': { const r=n(v.L)/n(v.D); ratio=Math.max(r/st.sdCant,n(v.L)/1000/n(v.max)); L=[`CANTILEVER BEAM : ${I('D')} x ${I('B')}`,`S/D = ${I('L')} / ${n(v.D)} = ${f1(r)} ${lt(r,st.sdCant)} ${st.sdCant}    ${okTxt(r/st.sdCant)}`,`SPAN ${f2(n(v.L)/1000)} m ≤ ${I('max')} m (MAX.)    ${okTxt(n(v.L)/1000/n(v.max))}`]; break; }
    case 'rcg': { const Lm=n(v.L)/1000, lim=lsr(st.sdMain,Lm), r=n(v.L)/n(v.D); const V=n(v.tf)*n(v.q)*n(v.w)*Lm/2+n(v.P)/2, d=n(v.D)-70, vv=V*1000/(n(v.B)*d), vmax=0.8*Math.sqrt(n(v.fcu));
      ratio=Math.max(r/lim,n(v.D)/n(v.Z),vv/vmax);
      L=[`RC GIRDER : ${I('D')} x ${I('B')}   (ZONE ${I('Z')} mm)`,`S/D = ${I('L')} / ${n(v.D)} = ${f1(r)} ${lt(r,lim)} 26 x (10 / ${f1(Lm)}) = ${f1(lim)}    ${okTxt(r/lim)}`,`D = ${n(v.D)} ${n(v.D)<=n(v.Z)?'≤':'>'} ZONE ${n(v.Z)}    ${okTxt(n(v.D)/n(v.Z))}`,`ASSUME ${I('q')} kPa / FLOOR, LOAD WIDTH ${I('w')} m, FACTOR ${I('tf')}, POINT LOAD FROM ABOVE P = ${I('P')} kN`,`V = ${n(v.tf)} x ${n(v.q)} x ${n(v.w)} x ${f1(Lm)} / 2 + ${n(v.P)} / 2 = ${f0(V)} kN`,`v = V / bd = ${f0(V)}E3 / (${n(v.B)} x ${d}) = ${f2(vv)} MPa ${lt(vv,vmax)} 0.8√${I('fcu')} = ${f2(vmax)} MPa    ${okTxt(vv/vmax)}`]; break; }
    case 'pt': { const r=n(v.L)/n(v.D); ratio=Math.max(r/st.sdPT,n(v.D)/n(v.Z)); L=[`POST-TENSIONED GIRDER : ${I('D')} x ${I('B')}   (ZONE ${I('Z')} mm)`,`S/D = ${I('L')} / ${n(v.D)} = ${f1(r)} ≤ ${st.sdPT} (PT, PRELIMINARY)    ${okTxt(r/st.sdPT)}`,`D = ${n(v.D)} ${n(v.D)<=n(v.Z)?'≤':'>'} ZONE ${n(v.Z)}    ${okTxt(n(v.D)/n(v.Z))}`]; break; }
    case 'wall': { const r=n(v.L)/n(v.H); ratio=r/st.wallRatio; L=[`STOREY-DEEP RC TRANSFER WALL / DEEP BEAM, H = ${I('H')} mm`,`L / H = ${I('L')} / ${n(v.H)} = ${f2(r)} ${r<=st.wallRatio?'≤':'>'} ${st.wallRatio}    ${okTxt(ratio)}`,`OPENINGS IN THE WALL TO BE COORDINATED WITH PLANT / REFUGE REQUIREMENTS.`]; break; }
    case 'truss': { const w=n(v.q)*n(v.w)*n(v.fl)*n(v.tf), M=w*n(v.L)**2/8+n(v.P)*n(v.L)/4, Cf=M/n(v.H), A=Cf*1000/(0.8*st.py)/100, u=UC_AREA.find(x=>x[1]>=A); ratio=u?A/u[1]:A/808;
      L=[`STOREY-DEEP STEEL TRUSS, SPAN ${I('L')} m, H = ${I('H')} m`,`w = ${I('q')} x ${I('w')} x ${I('fl')} FLOORS x ${I('tf')} = ${f0(w)} kN/m;  P = ${I('P')} kN`,`M = wL² / 8 + PL / 4 = ${f0(M)} kNm`,`∴ COMPRESSION FORCE = M / H = ${f0(Cf)} kN`,`Ag,min = C / (0.8 py) = ${f0(A)} cm2  →  ${u?`PROVIDE ${u[0]} (Ag = ${u[1]} cm2, S${st.py})  ${okTxt(ratio)}`:'<span class="ng">EXCEEDS UC 356x406x634 — USE COMPOUND SECTION / DEEPER TRUSS</span>'}`]; if(!u) ratio=A/808; break; }
    case 'stg': { const Lm=n(v.L), wl=n(v.q)*n(v.w), Mreq=wl*Lm*Lm/8/1.6+n(v.P)*Lm/4/1.6, Ireq=2.29*n(v.ll)*n(v.w)*Lm**3/2.8; const sec=pickSec(UB355,Mreq,Ireq); const D=sec?secDepth(sec[0])*1000:Lm*1000/15; ratio=D/n(v.Z);
      L=[`STEEL GIRDER, SPAN ${I('L')} m, LOAD WIDTH ${I('w')} m, WULS ${I('q')} kPa, LL ${I('ll')} kPa, P = ${I('P')} kN`,`MREQ. = w x l x L² / 8 / 1.6 + PL / 4 / 1.6 = ${f0(Mreq)} kNm`,`IREQ. = 2.29 x (wLL x l) x L³ / 2.8 = ${f0(Ireq)} cm4`,sec?`∴ USE ${sec[0]} (GRADE S355) (MC = ${f0(sec[2])} kNm, I = ${f0(sec[1])} cm4); D = ${f0(D)} ≤ ZONE ${I('Z')}    ${okTxt(ratio)}`:`NO ROLLED SECTION → PLATE GIRDER D ≈ L/15 = ${f0(D)} mm ≤ ZONE ${I('Z')}    ${okTxt(ratio)}`]; break; }
    case 'ssb': { const Lm=n(v.L), Mreq=n(v.w)*n(v.ls)*Lm*Lm/8/1.6, Ireq=2.29*(n(v.ll)*n(v.ls))*Lm**3/2.8, sec=pickSec(UB355,Mreq,Ireq); const D=sec?secDepth(sec[0])*1000:Lm*1000/15; ratio=D/n(v.Z);
      L=[`SPAN ${I('L')} m, SLAB SPAN ${I('ls')} m, WULS ${I('w')} kPa, LL ${I('ll')} kPa`,`MREQ. = ${n(v.w)} x ${n(v.ls)} x ${Lm}² / 8 / 1.6 = ${f0(Mreq)} kNm`,`IREQ. = 2.29 x (${n(v.ll)} x ${n(v.ls)}) x ${Lm}³ / 2.8 = ${f0(Ireq)} cm4`,sec?`∴ USE ${sec[0]} (GRADE S355) (MC = ${f0(sec[2])} kNm, I = ${f0(sec[1])} cm4)   D ≤ ZONE ${I('Z')}  ${okTxt(ratio)}`:`NO ROLLED SECTION → PLATE GIRDER`]; break; }
    case 'smb': { const Lm=n(v.L), np=Math.max(1,Math.round(n(v.n))), k1=[0,3.66,3.12,2.9,2.77][Math.min(np,4)], k2=[0,0.25,0.333,0.5,0.6][Math.min(np,4)], P=n(v.w)*n(v.ls)*n(v.Lsb), PL=n(v.ll)*n(v.ls)*n(v.Lsb), Mreq=k2*P*Lm/1.6, Ireq=np*k1*PL*Lm*Lm/2.8, sec=pickSec(UB355,Mreq,Ireq); const D=sec?secDepth(sec[0])*1000:Lm*1000/15; ratio=D/n(v.Z);
      L=[`SPAN ${I('L')} m, ${I('n')} POINT LOADS FROM SB (SB SPAN ${I('Lsb')} m, SLAB SPAN ${I('ls')} m), WULS ${I('w')} kPa, LL ${I('ll')} kPa`,`PSB = ${f0(P)} kN (BOTH SIDES);  k1 = ${k1}, k2 = ${k2}`,`MREQ. = k2 x PSB x L / 1.6 = ${f0(Mreq)} kNm`,`IREQ. = n x k1 x PSB,LL x L² / 2.8 = ${f0(Ireq)} cm4`,sec?`∴ USE ${sec[0]} (GRADE S355) (MC = ${f0(sec[2])} kNm, I = ${f0(sec[1])} cm4)   D ≤ ZONE ${I('Z')}  ${okTxt(ratio)}`:`NO ROLLED SECTION → PLATE GIRDER`]; break; }
    case 'flat': { const d=n(v.t)-40, r=n(v.L)/d; ratio=Math.max(r/st.sdFlat,n(v.drop)/n(v.Z));
      L=[`FLAT SLAB : ${I('t')} THK., DROP PANEL ${I('drop')} THK. x ${I('Ld')} SQ. (≈ L/3)`,`L / d = ${I('L')} / ${d} = ${f1(r)} ${lt(r,st.sdFlat)} ${st.sdFlat} (CONTINUOUS, WITH DROPS)    ${okTxt(r/st.sdFlat)}`,`DROP ${n(v.drop)} ${n(v.drop)<=n(v.Z)?'≤':'>'} ZONE ${I('Z')}    ${okTxt(n(v.drop)/n(v.Z))}`]; break; }
    case 'punch': { const c=n(v.c), d=n(v.d), u1=4*(c+3*d), v1=n(v.beta)*n(v.V)*1000/(u1*d), v0=n(v.V)*1000/(4*c*d), vm=0.8*Math.sqrt(n(v.fcu)); ratio=Math.max(v1/(2*n(v.vc)),v0/vm);
      L=[`V = ${I('V')} kN (PER FLOOR), COLUMN ${I('c')} SQ., d = ${I('d')} (AT DROP)`,`u1 = 4 (c + 3d) = ${f0(u1)} mm;  β = ${I('beta')}`,`v = βV / (u1 d) = ${f2(v1)} MPa ${lt(v1,2*n(v.vc))} 2vc = 2 x ${I('vc')} = ${f2(2*n(v.vc))} MPa (WITH SHEAR LINKS)    ${okTxt(v1/(2*n(v.vc)))}`,`v0 = V / (4c d) = ${f2(v0)} MPa ${lt(v0,vm)} 0.8√${I('fcu')} = ${f2(vm)} MPa    ${okTxt(v0/vm)}`]; break; }
    case 'ramp': { const g=n(v.rise)/n(v.run), r1=n(v.w)/n(v.t), lim=lsr(st.sdMain,n(v.Lb)/1000), r2=n(v.Lb)/n(v.D); ratio=Math.max(g*n(v.n),r1/st.sdSlab,r2/lim);
      L=[`GRADIENT = RISE / RUN = ${I('rise')} / ${I('run')} = 1 : ${f1(1/g)} ${g<=1/n(v.n)+1e-9?'≤':'>'} 1 : ${I('n')}    ${okTxt(g*n(v.n))}`,`RAMP SLAB : ${I('t')} THK., SPAN BETWEEN INCLINED BEAMS ${I('w')} mm;  S/D = ${f1(r1)} ${lt(r1,st.sdSlab)} ${st.sdSlab}    ${okTxt(r1/st.sdSlab)}`,`INCLINED BEAM : ${I('D')} DEEP, SLOPED SPAN ${I('Lb')} mm;  S/D = ${f1(r2)} ${lt(r2,lim)} ${f1(lim)}    ${okTxt(r2/lim)}`,`HORIZONTAL THRUST AT THE LOW / HIGH END TO BE TIED INTO THE FLOOR DIAPHRAGMS.`]; if(g*n(v.n)>1+1e-9) ratio=99; break; }
    case 'plate': { const r=n(v.L)/n(v.t); ratio=Math.max(n(v.t)/n(v.Z),(st.plateRatio/r)>1?1:r/st.plateRatio*0); L=[`TRANSFER PLATE : ${I('t')} THK., MAX. SPAN ${I('L')} mm`,`SPAN / THK = ${f1(r)} (≤ ${st.plateRatio} ASSUMED)`,`THK. ${n(v.t)} ≤ AVAILABLE ${I('Z')} mm    ${okTxt(n(v.t)/n(v.Z))}`]; ratio=n(v.t)/n(v.Z); break; }
    case 'col': { const P=n(v.q)*n(v.A)*n(v.n)*n(v.ef)+n(v.P), Ac=P*1000/n(v.k), prov=n(v.side)**2; ratio=Math.max(Ac/prov,(n(v.H)/n(v.side))/st.slenderBraced);
      L=[`NO. OF STOREY = ${I('n')}`,`TRIBUTARY AREA = ${I('A')} m2`,`ASSUME ${I('q')} kPa / FLOOR`,`LOADING = ${n(v.q)} x ${n(v.A)} x ${n(v.n)} x ${I('ef')} + ${I('P')} (FROM TRANSFER) = ${f0(P)} kN`,`N = ${I('k')} Ac  →  Ac = ${f0(Ac)} mm2`,`∴ PROVIDE ${I('side')} x ${n(v.side)} (Ac,PROV = ${f0(prov)} mm2)    ${okTxt(Ac/prov)}`,`SLENDERNESS = H / D = ${I('H')} / ${n(v.side)} = ${f1(n(v.H)/n(v.side))} ${lt(n(v.H)/n(v.side),st.slenderBraced)} ${st.slenderBraced} (BRACED)    ${okTxt(n(v.H)/n(v.side)/st.slenderBraced)}`]; break; }
  }
  return {html:L.join('\n'),v:verdictOf(ratio,tol)};
}
function reportHTML(E){
  const blocks=reportBlocks(E); const txt=((W.txt||{})[E.sc.id])||{};
  const ed=(k,def)=>`<div contenteditable="true" data-t="${k}">${txt[k]!==undefined?txt[k]:esc(def)}</div>`;
  let h=`<div class="card"><details class="sec" data-sec="rep" ${view.secOpen.has('rep')?'open':''}><summary><b>CALCULATION REPORT (EDITABLE)</b> — ${blocks.length} blocks${blocks.some(b=>calcBlock(b).v==='fail')?', <span class="ng">some not OK</span>':''}</summary><div style="overflow:hidden;margin-top:6px"><button id="bCopyRep" class="noprint" style="float:right">Copy report</button> <button id="bResetRep" class="noprint" style="float:right;margin-right:6px">Reset this scheme</button></div>
  <div class="hint noprint">Yellow cells are inputs — change a value and press Enter or Tab; the block recalculates and the verdict updates. Changed cells turn orange and are saved with the question. Text paragraphs can be edited directly.</div><div class="rep" id="rep">`;
  h+=`<div class="blk"><b>SCHEME ${E.sc.id}:</b> ${ed('name',E.sc.name)}</div>`;
  h+=`<div class="blk"><b>FEASIBILITY CHECK</b></div>`;
  blocks.forEach(b=>{ const r=calcBlock(b); h+=`<div class="blk ${r.v}" data-blk="${esc(b.id)}"><b>${esc(b.title)}</b> ${V_ICON[r.v]}\n<span class="body">${r.html}</span></div>`; });
  h+=`<div class="blk"><b>D. VERTICAL LOAD TRANSFER AND STABILITY</b>\n${ed('vert',E.sc.floor==='flat'?'IT IS PROVIDED BY COLUMN AND CORE WALL DOWN TO FOUNDATION.\nFLAT SLAB (WITH DROP PANELS) → COLUMN / TRANSFER MEMBER → COLUMN / CORE WALL → PILE CAP → FOUNDATION.':E.sc.mat==='rc'?'IT IS PROVIDED BY COLUMN AND CORE WALL DOWN TO FOUNDATION.\nSLAB → SECONDARY BEAM → MAIN BEAM / TRANSFER MEMBER → COLUMN / CORE WALL → PILE CAP → FOUNDATION.':'IT IS PROVIDED BY COMPOSITE COLUMN AND BRACED CORE WALL DOWN TO FOUNDATION.\nSLAB → SECONDARY BEAM → MAIN BEAM / TRANSFER TRUSS → COMPOSITE COLUMN / BRACED CORE WALL → PILE CAP → FOUNDATION.')}</div>`;
  h+=`<div class="blk"><b>E. HORIZONTAL LOAD TRANSFER AND STABILITY</b>\n${ed('hor','IT IS PROVIDED BY BEAM-COLUMN FRAMEWORK AND CORE WALL DOWN TO FOUNDATION. FRAMEWORK WILL CARRY SMALL PORTION OF WIND FORCE DUE TO RELATIVELY SMALL STIFFNESS AND WILL NOT DOMINATE THE DESIGN.\nWIND LOAD → EXTERNAL CLADDING → SLAB (DIAPHRAGM ACTION) → CORE WALL / BEAM-COLUMN FRAMEWORK → PILE CAP → FOUNDATION.')}</div>`;
  h+=`<div class="blk"><b>F. ROBUSTNESS</b>\n${ed('rob','EFFECTIVE HORIZONTAL AND VERTICAL TIES; DESIGN FOR MIN. HORIZONTAL FORCE; PROVIDE ALTERNATIVE LOAD PATH; DESIGNED TO ACT AS A MONOLITHIC STRUCTURE.')}</div>`;
  h+=`<div class="blk"><b>G. OTHER CONSIDERATION</b>\n${ed('oth',(E.M.lateral&&E.M.lateral.cores.length&&(E.M.lateral.rx>0.1||E.M.lateral.ry>0.1)?`TORSION: TWISTING OF THE CORE DUE TO THE UNSYMMETRICAL LAYOUT OF THE CORE (EX = ${f1(E.M.lateral.ex)} m) SHALL BE CHECKED IN DETAILED DESIGN STAGE.\n`:'')+'DEFLECTION: ACTUAL DEFLECTION OF CORE AND TRANSFER / LONG-SPAN MEMBERS SHALL BE CHECKED IN DETAILED DESIGN STAGE.\nFIRE RESISTANCE: '+(E.sc.mat==='rc'?'PROVIDE SUFFICIENT CONCRETE COVER.':'MINERAL FIBRE SPRAY / INTUMESCENT PAINT. CORROSION: PAINT COATING / HOT-DIP GALVANIZING.'))}</div>`;
  h+='</div></details></div>'; return h;
}
function bindReport(E){
  const root=document.getElementById('rep'); if(!root) return;
  const sid=E.sc.id; W.ovr=W.ovr||{}; W.txt=W.txt||{};
  root.addEventListener('change',ev=>{ const el=ev.target; if(!el.classList.contains('cell')) return;
    const bid=el.dataset.b, fk=el.dataset.f; const o=(W.ovr[sid]=W.ovr[sid]||{}); const ob=(o[bid]=o[bid]||{});
    const val=num(el.value)!==null?num(el.value):el.value; ob[fk]=val; saveW();
    const blocks=reportBlocks(E); const b=blocks.find(x=>x.id===bid); if(!b) return; const r=calcBlock(b);
    const div=root.querySelector(`[data-blk="${CSS.escape(bid)}"]`); if(div){ div.className=`blk ${r.v}`; div.innerHTML=`<b>${esc(b.title)}</b> ${V_ICON[r.v]}\n<span class="body">${r.html}</span>`; } });
  root.addEventListener('input',ev=>{ const el=ev.target; if(el.dataset&&el.dataset.t){ (W.txt[sid]=W.txt[sid]||{})[el.dataset.t]=el.innerHTML; saveW(); } else if(el.classList&&el.classList.contains('cell')) el.size=Math.max(3,el.value.length+1); });
  const cp=document.getElementById('bCopyRep'); if(cp) cp.onclick=()=>{ const c=root.cloneNode(true); c.querySelectorAll('input').forEach(i=>i.replaceWith(document.createTextNode(i.value))); const t=c.innerText.replace(/[✅⚠️❌]/g,''); (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>alert('Report copied'),()=>{ const ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); alert('Report copied'); }); };
  const rs=document.getElementById('bResetRep'); if(rs) rs.onclick=()=>{ if(!confirm('Discard your edits for this scheme?')) return; delete W.ovr[sid]; delete W.txt[sid]; saveW(); renderOut(); };
}
