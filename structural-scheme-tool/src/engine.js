/* Geometry engine (from v1, unchanged): storeys, grids, zones, walls, column status,
   transfer points, long-span / transfer members, uplift, lateral, foundation. */
function parseAxis(labStr, spStr, name, err){
  const labels = String(labStr||'').split(/[,，\s]+/).map(s=>s.trim()).filter(Boolean);
  const sp = String(spStr||'').split(/[,，\s]+/).map(s=>s.trim()).filter(Boolean).map(num);
  if (labels.length < 2) err.push(`${name}: at least two grid lines are required`);
  if (sp.length !== labels.length-1 || sp.some(v=>v===null||v<=0)) err.push(`${name}: number of spacings must equal number of grid lines minus one, all positive`);
  const pos=[0]; for (let i=0;i<labels.length-1;i++) pos.push(pos[i]+(sp[i]||0));
  return {labels,pos,sp};
}

function buildModel(S){
  const err=[]; const P=S.params;
  const L=(S.levels||[]).map(l=>({name:String(l.name??'').trim(),h:num(l.h),head:num(l.head),svc:num(l.svc)??0,free:!!l.free,use:l.use||''}));
  const nL=L.length;
  if (nL<2) err.push('The floor table needs at least two levels (including the roof)');
  for (let s=0;s<nL-1;s++){
    if (!L[s].name) err.push(`Floor table row ${s+1} has no name`);
    if (L[s].h===null||L[s].head===null) err.push(`${L[s].name||'Row '+(s+1)}: floor-to-floor height and headroom are required`);
  }
  const sIdx=n=>{const i=L.findIndex(l=>l.name===String(n??'').trim());return (i>=0&&i<nL-1)?i:-1;};
  const range=(a,b,what)=>{ let s1=String(a??'').trim()?sIdx(a):0, s2=String(b??'').trim()?sIdx(b):nL-2; if(s1<0||s2<0){err.push(`${what}: floors must be chosen from the floor table (not the top level)`);return null;} return [Math.min(s1,s2),Math.max(s1,s2)]; };

  const grids=[];
  (S.grids||[]).forEach((g,gi)=>{
    const nm=String(g.name||'').trim()||('G'+(gi+1));
    const ax=parseAxis(g.xLabels,g.xSp,`Grid "${nm}" X`,err), ay=parseAxis(g.yLabels,g.ySp,`Grid "${nm}" Y`,err);
    const ox=num(g.ox)||0, oy=num(g.oy)||0;
    const r=range(g.s1,g.s2,`Grid "${nm}"`)||[0,nL-2];
    grids.push({name:nm,gx:{labels:ax.labels,pos:ax.pos.map(p=>p+ox),sp:ax.sp},gy:{labels:ay.labels,pos:ay.pos.map(p=>p+oy),sp:ay.sp},s1:r[0],s2:r[1],cols:g.cols!==false&&g.cols!=='false',idx:gi});
  });
  if (!grids.length) err.push('At least one grid is required');
  const M={err,L,nL,grids,S};
  if (err.length) return M;

  const coord=(str,axis)=>{
    let s=String(str??'').replace(/\s+/g,''); if(!s) return null;
    if (s[0]==='@') return num(s.slice(1));
    let g=grids[0]; const c=s.search(/[:：]/);
    if (c>0){ const gn=s.slice(0,c); g=grids.find(x=>x.name===gn)||grids.find(x=>x.name.toUpperCase()===gn.toUpperCase()); s=s.slice(c+1); if(!g) return null; }
    const ax=axis==='x'?g.gx:g.gy;
    const m=s.match(/^(.+?)([+-]\d+(?:\.\d+)?)?$/); if(!m) return null;
    let idx=ax.labels.indexOf(m[1]); if(idx<0) idx=ax.labels.findIndex(l=>l.toUpperCase()===m[1].toUpperCase());
    if (idx<0) return null;
    return ax.pos[idx]+(m[2]?parseFloat(m[2]):0);
  };
  const axLabel=(v,axis)=>{
    for (const g of grids){ const ax=axis==='x'?g.gx:g.gy; const i=ax.pos.findIndex(p=>Math.abs(p-v)<TOL); if(i>=0) return (g===grids[0]?'':g.name+':')+ax.labels[i]; }
    const ax=axis==='x'?grids[0].gx:grids[0].gy; let i=0; while(i<ax.pos.length-1&&ax.pos[i+1]<v) i++;
    const d=v-ax.pos[i]; return `${ax.labels[i]}${d>=0?'+':''}${+d.toFixed(2)}`;
  };
  const ptLabel=(x,y)=>{
    for (const g of grids){ const i=g.gx.pos.findIndex(p=>Math.abs(p-x)<TOL), j=g.gy.pos.findIndex(p=>Math.abs(p-y)<TOL); if(i>=0&&j>=0) return (g===grids[0]?'':g.name+':')+g.gx.labels[i]+'/'+g.gy.labels[j]; }
    return axLabel(x,'x')+'/'+axLabel(y,'y');
  };
  Object.assign(M,{coord,axLabel,ptLabel,sIdx});

  // Zones
  const zones=[];
  (S.zones||[]).forEach((z,zi)=>{
    const x1=coord(z.x1,'x'),x2=coord(z.x2,'x'),y1=coord(z.y1,'y'),y2=coord(z.y2,'y');
    const nm=z.name||ZONE_NAME[z.type]||'Zone';
    if ([x1,x2,y1,y2].some(v=>v===null)){err.push(`Zone "${nm}": grid position not recognised (e.g. 3, B, 3+5, T:T2, @12.5)`);return;}
    const r=range(z.s1,z.s2,`Zone "${nm}"`); if(!r) return;
    zones.push({src:zi,type:z.type,name:nm,x1:Math.min(x1,x2),x2:Math.max(x1,x2),y1:Math.min(y1,y2),y2:Math.max(y1,y2),s1:r[0],s2:r[1],head:num(z.head),svc:num(z.svc),ramp:z.ramp||null,minSp:z.minSp??null,spType:z.spType||'c',periph:!!z.periph,parts:z.parts||null});
  });
  // Walls
  const walls=[];
  (S.walls||[]).forEach((w,wi)=>{
    const nm=w.name||`Wall ${wi+1}`;
    const x1=coord(w.x1,'x'),y1=coord(w.y1,'y'),x2=coord(w.x2,'x'),y2=coord(w.y2,'y');
    if ([x1,y1,x2,y2].some(v=>v===null)){err.push(`Wall "${nm}": position not recognised`);return;}
    const r=range(w.s1,w.s2,`Wall "${nm}"`); if(!r) return;
    const n=Math.max(1,Math.round(num(w.n)||1)), dx=num(w.dx)||0, dy=num(w.dy)||0;
    for (let i=0;i<n;i++) walls.push({src:wi,inst:i,rowN:n,name:n>1?`${nm} #${i+1}`:nm,x1:x1+i*dx,y1:y1+i*dy,x2:x2+i*dx,y2:y2+i*dy,s1:r[0],s2:r[1]});
  });
  // Column points
  const pts=[], pmap=new Map(), extraCols=[];
  const pkey=(x,y)=>`${Math.round(x*20)}|${Math.round(y*20)}`;
  const addPt=(x,y,s1,s2)=>{ const k=pkey(x,y); let p=pmap.get(k); if(!p){p={id:pts.length,x,y,key:k,label:ptLabel(x,y),ranges:[]};pts.push(p);pmap.set(k,p);} p.ranges.push([s1,s2]); };
  grids.forEach(g=>{ if(!g.cols) return; g.gx.pos.forEach(x=>g.gy.pos.forEach(y=>addPt(x,y,g.s1,g.s2))); });
  (S.columns||[]).forEach((c,ci)=>{
    const x=coord(c.x,'x'),y=coord(c.y,'y'); if(x===null||y===null){ if(c.x||c.y) err.push(`Extra column "${c.name||ci+1}": position not recognised`); return; }
    const r=range(c.s1,c.s2,`Extra column "${c.name||ci+1}"`); if(r){ addPt(x,y,r[0],r[1]); extraCols.push({src:ci,x,y,s1:r[0],s2:r[1]}); }
  });
  const removed=[];
  (S.removed||[]).forEach((c,ci)=>{
    const x=coord(c.x,'x'),y=coord(c.y,'y'); if(x===null||y===null){ err.push(`Removed column row ${ci+1}: position not recognised`); return; }
    const r=range(c.s1,c.s2,`Removed column row ${ci+1}`); if(r) removed.push({src:ci,x,y,s1:r[0],s2:r[1]});
  });
  const inR=(p,s)=>p.ranges.some(r=>r[0]<=s&&s<=r[1]);
  Object.assign(M,{zones,walls,pts,pmap,pkey,inR,extraCols,removed});
  if (err.length) return M;

  const zAct=(z,s)=>z.s1<=s&&s<=z.s2;
  const inside=(z,x,y,mode)=> mode==='int'
    ? (x>z.x1+EPS&&x<z.x2-EPS&&y>z.y1+EPS&&y<z.y2-EPS)
    : (x>=z.x1-TOL&&x<=z.x2+TOL&&y>=z.y1-TOL&&y<=z.y2+TOL);
  const gridsAt=s=>grids.filter(g=>g.s1<=s&&s<=g.s2);
  const active=(s,x,y)=>{
    if (s<0||s>nL-2) return false;
    const fps=zones.filter(z=>z.type==='footprint'&&zAct(z,s));
    const inB=fps.length?fps.some(z=>inside(z,x,y,'cl')):gridsAt(s).some(g=>x>=g.gx.pos[0]-EPS&&x<=g.gx.pos.at(-1)+EPS&&y>=g.gy.pos[0]-EPS&&y<=g.gy.pos.at(-1)+EPS);
    return inB&&!zones.some(z=>z.type==='outside'&&zAct(z,s)&&inside(z,x,y,'int'));
  };
  const quad=fn=>(x,y)=>fn(x-DQ,y-DQ)||fn(x+DQ,y-DQ)||fn(x-DQ,y+DQ)||fn(x+DQ,y+DQ);
  const slabAt=(k,x,y)=>{
    if (k===0) return active(0,x,y);
    const b=active(k-1,x,y), a=k<=nL-2&&active(k,x,y);
    if (!a&&!b) return false;
    if (k<=nL-2&&zones.some(z=>(z.type==='void'||z.type==='dbl')&&zAct(z,k-1)&&zAct(z,k)&&inside(z,x,y,'int'))) return false;
    return true;
  };
  const nodeSlab=(k,x,y)=>quad((a,b)=>slabAt(k,a,b))(x,y);
  const nodeActive=(s,x,y)=>quad((a,b)=>active(s,a,b))(x,y);
  const present=st=>st==='col'||st==='edge'||st==='core';
  const REMOVED=new Set(['void','colfree','nosupport','manual']);

  // Column status per storey
  const col=[];
  for (let s=0;s<nL-1;s++){
    col[s]=[];
    const zs=zones.filter(z=>zAct(z,s));
    for (const p of pts){
      let st;
      if (!inR(p,s)||!nodeActive(s,p.x,p.y)) st='none';
      else if (zs.some(z=>z.type==='core'&&inside(z,p.x,p.y,'cl'))) st='core';
      else if (removed.some(r=>r.s1<=s&&s<=r.s2&&Math.abs(r.x-p.x)<TOL&&Math.abs(r.y-p.y)<TOL)) st='manual';
      else if (zs.some(z=>z.type==='void'&&inside(z,p.x,p.y,'int'))) st='void';
      else if (zs.some(z=>z.type==='colfree'&&inside(z,p.x,p.y,'int'))) st='colfree';
      else if (S.rules.autoStop&&s>0&&REMOVED.has(col[s-1][p.id])&&!zs.some(z=>z.type==='keep'&&inside(z,p.x,p.y,'cl'))) st='nosupport';
      else if (zs.some(z=>z.type==='colfree'&&inside(z,p.x,p.y,'cl'))) st='edge';
      else st='col';
      col[s][p.id]=st;
    }
  }
  const wallsAt=s=>walls.filter(w=>w.s1<=s&&s<=w.s2);
  const onSeg=(w,x,y)=>{ const vx=w.x2-w.x1,vy=w.y2-w.y1,l2=vx*vx+vy*vy; let t=l2?((x-w.x1)*vx+(y-w.y1)*vy)/l2:0; t=Math.max(0,Math.min(1,t)); return Math.hypot(w.x1+t*vx-x,w.y1+t*vy-y)<=TOL; };
  const supportAt=(s,x,y)=>{
    if (s<0) return true;
    const p=pmap.get(pkey(x,y)); if (p&&present(col[s][p.id])) return true;
    if (wallsAt(s).some(w=>onSeg(w,x,y))) return true;
    return zones.some(z=>z.type==='core'&&zAct(z,s)&&inside(z,x,y,'cl'));
  };
  const lineSupports=(s,dir,c,extra=[])=>{
    const iv=[]; const tq=(x,y)=>dir==='X'?[x,y]:[y,x];
    for (const p of pts){ if(!present(col[s][p.id])) continue; const [t,q]=tq(p.x,p.y); if(Math.abs(q-c)<=TOL) iv.push([t,t]); }
    for (const w of [...wallsAt(s),...extra]){
      const [t1,q1]=tq(w.x1,w.y1),[t2,q2]=tq(w.x2,w.y2);
      if (Math.abs(q1-q2)<=TOL){ if(Math.abs(q1-c)<=TOL) iv.push([Math.min(t1,t2),Math.max(t1,t2)]); }
      else if ((c-q1)*(c-q2)<=TOL*TOL){ const t=t1+(t2-t1)*(c-q1)/(q2-q1); iv.push([t,t]); }
    }
    for (const z of zones){ if(z.type!=='core'||!zAct(z,s)) continue; const [ta,qa]=tq(z.x1,z.y1),[tb,qb]=tq(z.x2,z.y2); if(c>=Math.min(qa,qb)-TOL&&c<=Math.max(qa,qb)+TOL) iv.push([Math.min(ta,tb),Math.max(ta,tb)]); }
    return iv;
  };
  const sides=(iv,v)=>{ let on=false,a=-Infinity,b=Infinity; for(const [p,q] of iv){ if(p-TOL<=v&&v<=q+TOL) on=true; if(q<v-TOL&&q>a) a=q; if(p>v+TOL&&p<b) b=p; } return {on,a:Number.isFinite(a)?a:null,b:Number.isFinite(b)?b:null}; };
  Object.assign(M,{col,present,active,slabAt,nodeSlab,nodeActive,zAct,inside,wallsAt,onSeg,supportAt,REMOVED});

  // Available structural depth
  M.depth=L.map((l,k)=>k===0?null:(L[k-1].h-L[k-1].head-L[k-1].svc));
  const availAt=(k,x,y)=>{
    let a=M.depth[k], why='';
    for (const z of zones){
      if ((z.type==='void'||z.type==='dbl')&&z.s2===k-1&&z.head!==null&&inside(z,x,y,'int')){
        let H=0; for(let s=z.s1;s<=z.s2;s++) H+=L[s].h;
        a=H-z.head-(z.svc??L[k-1].svc); why=z.name;
      }
    }
    return {a,why};
  };

  // Transfer points and long-span members
  const tpoints=[], members=[], levelInfo={}, mseen=new Map(), wallOnCols=[];
  const mkMember=(k,dir,c,a,b,t,cant,secondary)=>{
    const key=`${k}|${dir}|${Math.round(c*20)}|${Math.round(a*20)}|${Math.round(b*20)}`;
    let m=mseen.get(key);
    if (m){ if(!m.pts.includes(t.key)){m.pts.push(t.key);m.nodes.push(t.label);} m.carries=m.carries||t.carries; return m; }
    const [x1,y1,x2,y2]=dir==='X'?[a,c,b,c]:[c,a,c,b];
    const span=Math.abs(b-a); const av=availAt(k,(x1+x2)/2,(y1+y2)/2);
    m={key,id:members.length,k,level:L[k].name,dir,lineLabel:axLabel(c,dir==='X'?'y':'x'),ends:[ptLabel(x1,y1),ptLabel(x2,y2)],x1,y1,x2,y2,span,avail:av.a,voidName:av.why,
       carries:t.carries,cant,secondary,pts:[t.key],nodes:[t.label],above:(k<=nL-2&&L[k].free)?L[k].h:0,below:L[k-1].free?L[k-1].h:0,special:false};
    mseen.set(key,m); members.push(m); return m;
  };
  for (let k=1;k<nL;k++){
    const tmap=new Map();
    const addT=(x,y,label,carries,kind)=>{ const key=pkey(x,y); let t=tmap.get(key); if(!t){t={key,x,y,label,carries:false,kinds:new Set(),k,ms:[]};tmap.set(key,t);} t.carries=t.carries||carries; t.kinds.add(kind); if(label&&!t.label) t.label=label; };
    if (k<=nL-2) for (const p of pts){ const st=col[k][p.id]; if((st==='col'||st==='edge')&&!supportAt(k-1,p.x,p.y)) addT(p.x,p.y,p.label,true,'col'); }
    if (k<=nL-2) for (const w of wallsAt(k)){
      if (w.s1!==k) continue;
      const ends=[[w.x1,w.y1],[w.x2,w.y2]]; let unsup=0;
      ends.forEach(([x,y])=>{ if(!supportAt(k-1,x,y)){ addT(x,y,ptLabel(x,y),true,'wall'); unsup++; } });
      if (!unsup&&!wallsAt(k-1).some(v=>onSeg(v,(w.x1+w.x2)/2,(w.y1+w.y2)/2))) wallOnCols.push({w,k});
    }
    for (const p of pts){
      if (!(inR(p,k-1)||(k<=nL-2&&inR(p,k)))) continue;
      if (!nodeSlab(k,p.x,p.y)||present(col[k-1][p.id])||supportAt(k-1,p.x,p.y)) continue;
      addT(p.x,p.y,p.label,k<=nL-2&&(col[k][p.id]==='col'||col[k][p.id]==='edge'),'slab');
    }
    const lvPts=[...tmap.values()];
    const unresolved=[];
    const solve=(t,extra,secondary)=>{
      const sx=sides(lineSupports(k-1,'X',t.y,extra),t.x), sy=sides(lineSupports(k-1,'Y',t.x,extra),t.y);
      const out=[];
      if (sx.a!==null&&sx.b!==null) out.push(['X',t.y,sx.a,sx.b,false]);
      if (sy.a!==null&&sy.b!==null) out.push(['Y',t.x,sy.a,sy.b,false]);
      if (!out.length){
        const c=[];
        [[sx,'X',t.y,t.x],[sy,'Y',t.x,t.y]].forEach(([sd,dir,cc,v])=>{ const s=sd.a!==null?sd.a:sd.b; if(s!==null&&Math.abs(v-s)<=P.cantMax+EPS) c.push([dir,cc,Math.min(s,v),Math.max(s,v),true]); });
        c.sort((p,q)=>(p[3]-p[2])-(q[3]-q[2])); if(c.length) out.push(c[0]);
      }
      // a missing column that carries nothing only needs one beam: keep the shorter direction
      // one beam is enough: keep the shorter direction (for a carried column too — a 36 m girder is never chosen over a 14 m one)
      if (out.length===2&&!out[0][4]&&!out[1][4]){ const sp=o=>o[3]-o[2]; out.splice(sp(out[0])<=sp(out[1])?1:0,1); }
      out.forEach(([dir,c,a,b,cant])=>{ const m=mkMember(k,dir,c,a,b,t,cant,secondary); if(!t.ms.includes(m.id)) t.ms.push(m.id); });
      return out.length>0;
    };
    const pass2=[];
    lvPts.forEach(t=>{ if(!solve(t,[],false)) pass2.push(t); });
    if (pass2.length){
      const segs=members.filter(m=>m.k===k).map(m=>({x1:m.x1,y1:m.y1,x2:m.x2,y2:m.y2}));
      pass2.forEach(t=>{ if(!solve(t,segs,true)) unresolved.push(t); });
    }
    // Inclined columns and hangers
    lvPts.forEach(t=>{
      if (t.carries){
        let best=null;
        const cand=[];
        pts.forEach(p=>{ if(present(col[k-1][p.id])) cand.push([p.x,p.y,p.label]); });
        wallsAt(k-1).forEach(w=>{ cand.push([w.x1,w.y1,ptLabel(w.x1,w.y1)]); cand.push([w.x2,w.y2,ptLabel(w.x2,w.y2)]); });
        cand.forEach(([x,y,lb])=>{ const d=Math.hypot(x-t.x,y-t.y); if(d>TOL&&(!best||d<best.d)) best={d,x,y,label:lb}; });
        if (best){ const r=best.d/L[k-1].h; t.incl={...best,h:L[k-1].h,ratio:r,ok:r<=P.inclMax+EPS}; }
      }
      for (let fl=k+1;fl<=nL-2;fl++){
        let blocked=false;
        for (let s=k;s<fl;s++) if (zones.some(z=>(z.type==='void'||z.type==='colfree')&&zAct(z,s)&&inside(z,t.x,t.y,'int'))) {blocked=true;break;}
        if (blocked) break;
        if (L[fl].free){
          const spans=t.ms.map(id=>members[id].span); const sp=spans.length?Math.min(...spans):null;
          if (sp!==null) t.hang={f:fl,span:sp,req:sp/P.storeyTruss,H:L[fl].h,ok:sp/P.storeyTruss<=L[fl].h+EPS};
          break;
        }
      }
    });
    const lvMembers=members.filter(m=>m.k===k);
    const carriesN=lvPts.filter(t=>t.carries).length;
    let plate=null;
    if (carriesN>0){
      const maxSpan=lvMembers.length?Math.max(...lvMembers.map(m=>m.cant?m.span*2:m.span)):2*P.cantMax;
      const t=maxSpan/P.plate, H=(L[k-1].free?L[k-1].h:0)||(k<=nL-2&&L[k].free?L[k].h:0);
      plate={t,maxSpan,avail:M.depth[k],H,ok:t<=M.depth[k]+EPS||(H>0&&t<=H+EPS),inFree:!(t<=M.depth[k]+EPS),suggested:carriesN>=P.plateMin||unresolved.length>0||lvMembers.some(m=>m.secondary)};
    }
    if (lvPts.length||lvMembers.length) levelInfo[k]={k,pts:lvPts,members:lvMembers,carries:carriesN,unresolved,plate};
    tpoints.push(...lvPts);
  }
  // Stacked transfer: a member's support is itself a transfer point at the level below
  members.forEach(m=>{
    const li=levelInfo[m.k-1]; if(!li) return;
    const keys=new Set(li.pts.map(t=>t.key));
    m.stacked=[[m.x1,m.y1],[m.x2,m.y2]].some(([x,y])=>keys.has(pkey(x,y)));
  });
  (S.specials||[]).forEach((sp,si)=>{
    const span=num(sp.span), avail=num(sp.avail);
    if (span===null||avail===null){ if(sp.name||sp.span) err.push(`Special member "${sp.name||si+1}": span and available depth are required`); return; }
    members.push({key:'sp'+si,id:members.length,k:-1,level:sp.level||'',dir:'',lineLabel:'',ends:[],span,avail,voidName:'',carries:!!sp.carries,cant:!!sp.cant,pts:[],nodes:[],
      above:num(sp.trussH)||0,below:0,special:true,name:sp.name||`Special member ${si+1}`});
  });
  members.forEach(m=>m.opts=options(m,P));
  Object.assign(M,{members,tpoints,levelInfo,wallOnCols});

  // Omitted column summary
  const omit=[], edges=[];
  for (const p of pts){
    let run=null;
    for (let s=0;s<=nL-1;s++){
      const st=s<nL-1?col[s][p.id]:'end';
      if (REMOVED.has(st)){ if(!run) run={node:p.label,s1:s,s2:s,why:new Set()}; run.s2=s; run.why.add(st); }
      else if (run){ omit.push(run); run=null; }
    }
    const es=[]; for(let s=0;s<nL-1;s++) if(col[s][p.id]==='edge') es.push(s);
    if (es.length) edges.push({node:p.label,s1:es[0],s2:es[es.length-1]});
  }
  M.omit=omit; M.edges=edges;

  // Cells (drawing, uplift, eccentricity)
  const xs=new Set(), ys=new Set();
  grids.forEach(g=>{g.gx.pos.forEach(v=>xs.add(+v.toFixed(3)));g.gy.pos.forEach(v=>ys.add(+v.toFixed(3)));});
  zones.forEach(z=>{xs.add(+z.x1.toFixed(3));xs.add(+z.x2.toFixed(3));ys.add(+z.y1.toFixed(3));ys.add(+z.y2.toFixed(3));});
  M.xs=[...xs].sort((a,b)=>a-b); M.ys=[...ys].sort((a,b)=>a-b);
  M.cells=[]; for(let i=0;i<M.xs.length-1;i++) for(let j=0;j<M.ys.length-1;j++){ const w=M.xs[i+1]-M.xs[i],h=M.ys[j+1]-M.ys[j]; if(w>EPS&&h>EPS) M.cells.push({x1:M.xs[i],x2:M.xs[i+1],y1:M.ys[j],y2:M.ys[j+1],cx:(M.xs[i]+M.xs[i+1])/2,cy:(M.ys[j]+M.ys[j+1])/2,a:w*h}); }

  const ri=L.findIndex(l=>l.name===S.site.refLevel); const refMpd=num(S.site.refMpd);
  M.elev=null; M.ri=ri>=0?ri:0;
  if (ri>=0&&refMpd!==null){ const e=[]; e[ri]=refMpd; for(let k=ri+1;k<nL;k++) e[k]=e[k-1]+(L[k-1].h||0); for(let k=ri-1;k>=0;k--) e[k]=e[k+1]-(L[k].h||0); M.elev=e; }
  M.uplift={rc:uplift(M,P.dlRC,P.dlRC), st:uplift(M,P.dlRC,P.dlST)};
  M.lateral=lateral(M);
  M.found=foundation(M);
  M.issues=issues(M);
  return M;
}

function options(m,P){
  const o=(sys,ratio)=>{const req=m.span/ratio;return {sys,req,ok:req<=m.avail+1e-9};};
  const r=[
    o('RC', m.cant?P.rcCant:m.carries?P.rcT:P.rc),
    o('PT', m.cant?P.ptCant:m.carries?P.ptT:P.pt),
    o('ST', m.cant?P.stCant:m.carries?P.stT:P.st),
    o('TRUSS', m.cant?P.trussCant:P.truss)
  ];
  const H=m.above||m.below, where=m.above?'above':'below';
  const reqT=m.span/(m.cant?P.storeyTruss/2:P.storeyTruss);
  r.push({sys:'STRUSS',req:reqT,ok:H>0&&reqT<=H+1e-9,H,where});
  const reqW=m.span/(m.cant?P.rcWall/2:P.rcWall);
  r.push({sys:'RCWALL',req:reqW,ok:H>0&&reqW<=H+1e-9,H,where});
  return r;
}

function uplift(M,dlBelow,dlAbove){
  const {nL,S,elev}=M; const gwl=num(S.site.gwl), raftT=num(S.site.raftT)||0;
  if (!elev||gwl===null) return null;
  const under=elev[0]-raftT, U=10*(gwl-under);
  if (U<=0) return {U:0,under,groups:[]};
  const groups=new Map();
  for (const c of M.cells){
    if (!M.slabAt(0,c.cx,c.cy)) continue;
    let W=25*raftT, n=0;
    for (let k=1;k<nL;k++) if (M.slabAt(k,c.cx,c.cy)){ W+=(k>M.ri?dlAbove:dlBelow); n++; }
    const key=W.toFixed(1);
    if (!groups.has(key)) groups.set(key,{W,n,cells:[],area:0});
    const g=groups.get(key); g.cells.push(c); g.area+=c.a;
  }
  const out=[...groups.values()].map(g=>{
    const x1=Math.min(...g.cells.map(c=>c.x1)),x2=Math.max(...g.cells.map(c=>c.x2)),y1=Math.min(...g.cells.map(c=>c.y1)),y2=Math.max(...g.cells.map(c=>c.y2));
    return {...g,fos:g.W/U,where:`${M.axLabel(x1,'x')}–${M.axLabel(x2,'x')} / ${M.axLabel(y1,'y')}–${M.axLabel(y2,'y')}`};
  }).sort((a,b)=>a.fos-b.fos);
  return {U,under,groups:out};
}

function lateral(M){
  const {nL,ri}=M; const cnt=new Map();
  for (let s=ri;s<nL-1;s++){ const sig=M.cells.map(c=>M.active(s,c.cx,c.cy)?'1':'0').join(''); const e=cnt.get(sig)||{n:0,s}; e.n++; cnt.set(sig,e); }
  let best=-1,bs=-1; for (const e of cnt.values()) if(e.n>bs){bs=e.n;best=e.s;}
  if (best<0) return null;
  let A=0,sx=0,sy=0,xmin=1e9,xmax=-1e9,ymin=1e9,ymax=-1e9;
  M.cells.forEach(c=>{ if(!M.active(best,c.cx,c.cy)) return; A+=c.a;sx+=c.a*c.cx;sy+=c.a*c.cy; xmin=Math.min(xmin,c.x1);xmax=Math.max(xmax,c.x2);ymin=Math.min(ymin,c.y1);ymax=Math.max(ymax,c.y2); });
  if (!A) return null;
  const cores=M.zones.filter(z=>z.type==='core'&&M.zAct(z,best));
  const r={storey:best,cx:sx/A,cy:sy/A,xmin,xmax,ymin,ymax,cores};
  if (cores.length){
    let ca=0,cx=0,cy=0; cores.forEach(z=>{const a=(z.x2-z.x1)*(z.y2-z.y1);ca+=a;cx+=a*(z.x1+z.x2)/2;cy+=a*(z.y1+z.y2)/2;});
    r.kx=cx/ca; r.ky=cy/ca; r.ex=Math.abs(r.kx-r.cx); r.ey=Math.abs(r.ky-r.cy); r.rx=r.ex/(xmax-xmin); r.ry=r.ey/(ymax-ymin);
  }
  r.edgeX=[M.axLabel(xmin,'x'),M.axLabel(xmax,'x')]; r.edgeY=[M.axLabel(ymin,'y'),M.axLabel(ymax,'y')];
  r.freeStoreys=M.L.slice(0,nL-1).map(l=>l.free?l.name:null).filter(Boolean);
  r.wallsN=M.wallsAt(best).length;
  return r;
}

function parseN(s){ const m=String(s??'').match(/(\d+(?:\.\d+)?)/g); if(!m) return null; return Math.max(...m.map(Number)); }
function foundation(M){
  const {S,elev}=M; if (!elev) return null;
  const raftT=num(S.site.raftT)||0, under=elev[0]-raftT, ground=num(S.site.refMpd), rock=num(S.site.rock), gwl=num(S.site.gwl);
  const layer=(S.site.soils||[]).find(l=>num(l.top)!==null&&num(l.bot)!==null&&under<=num(l.top)+EPS&&under>=num(l.bot)-EPS)||null;
  const N=layer?parseN(layer.N):null;
  const toRock=rock!==null?under-rock:null;
  return {under,layer,N,goodBearing:N!==null&&N>=S.params.goodN,toRock,rockNear:toRock!==null&&toRock<=S.params.rockNear,exc:ground!==null?ground-under:null,
    gwlAbove:gwl!==null&&gwl>under,adjacent:!!S.site.adjacent,rock,gwl,ground,tall:M.nL>20};
}

const SYS_SHORT={RC:'RC beam',PT:'PT beam',ST:'Steel girder',TRUSS:'Steel truss',STRUSS:'Storey-deep truss',RCWALL:'Storey-deep wall',COVERED:'By truss',PLATE:'Transfer plate',INCL:'Inclined column',HANG:'Hanger + truss',NOTREQ:'Not req. (inclined col.)'};
const SYS_EN={RC:'reinforced concrete girder',PT:'post-tensioned concrete girder',ST:'composite steel plate girder',TRUSS:'steel truss within the floor zone',STRUSS:'storey-deep steel truss',RCWALL:'storey-deep RC transfer wall / deep beam',COVERED:'supported by the storey-deep truss (chord member)',PLATE:'transfer plate',INCL:'not required (load taken by inclined column)',HANG:'hung from storey-deep truss above via steel hangers',NOTREQ:'not required (load taken by inclined column)'};
const WHY_SHORT={void:'atrium / void',colfree:'column-free zone',nosupport:'no column below',manual:'removed manually'};

function issues(M){
  const out=[]; const P=M.S.params; const add=(sev,t)=>out.push({sev,t});
  M.omit.forEach(o=>add('high',`Column ${o.node} omitted between ${M.L[o.s1].name} and ${M.L[o.s2+1].name} (${[...o.why].map(w=>WHY_SHORT[w]).join(', ')})`));
  M.edges.forEach(e=>add('mid',`Column ${e.node} at ${M.L[e.s1].name}${e.s1!==e.s2?'–'+M.L[e.s2].name:''} lies on the edge of a column-free zone: offset it outward so the inner face aligns with the grid line`));
  Object.values(M.levelInfo).forEach(li=>{
    const cols=li.pts.filter(t=>t.kinds.has('col')).length, wl=li.pts.filter(t=>t.kinds.has('wall')).length;
    if (cols||wl) add('high',`${M.L[li.k].name}: ${cols?cols+' column(s)':''}${cols&&wl?', ':''}${wl?wl+' wall end(s)':''} not directly supported below → transfer required (see analysis tables)`);
    if (li.unresolved.length) add('high',`${M.L[li.k].name}: ${li.unresolved.length} transfer point(s) have no support in either direction (e.g. ${li.unresolved.slice(0,3).map(t=>t.label).join(', ')}) → transfer plate or manually arranged secondary transfer beams [MANUAL JUDGEMENT]`);
    if (li.members.some(m=>m.secondary)) add('mid',`${M.L[li.k].name}: secondary transfer beams needed (beam supported on another transfer beam) → complex load path; consider a transfer plate`);
    if (li.plate&&li.plate.suggested) add('mid',`${M.L[li.k].name}: many / irregular transfer points → consider a transfer plate approx. ${f(li.plate.t)} m thick (available ${f(li.plate.avail)} m${li.plate.H?', adjacent plant / refuge storey '+f(li.plate.H,1)+' m':''})${li.plate.ok?'':' → insufficient depth'}`);
    const incl=li.pts.filter(t=>t.incl&&t.incl.ok);
    if (incl.length) add('info',`${M.L[li.k].name}: ${incl.length} column(s) with small offset could be inclined (e.g. ${incl[0].label} → ${incl[0].incl.label}, offset ${f(incl[0].incl.d,1)} m over ${f(incl[0].incl.h,1)} m); slabs must resist the horizontal component [MANUAL JUDGEMENT]`);
  });
  M.members.forEach(m=>{
    const okList=m.opts.filter(o=>o.ok).map(o=>SYS_SHORT[o.sys]);
    const where=m.special?m.name:`${m.level} grid ${m.lineLabel} (${m.ends.join(' to ')})`;
    add(okList.length?(m.carries?'high':'mid'):'high',
      `${where}: ${m.cant?'cantilever':'span'} ${f(m.span,1)} m, available depth ${f(m.avail)} m${m.voidName?' (over '+m.voidName+')':''}${m.carries?', supports column(s) / wall(s) above':''}${m.secondary?', secondary transfer':''}${m.stacked?', [STACKED TRANSFER: its support is also transferred]':''} → feasible: ${okList.join(', ')||'none (revise column layout, use transfer plate or another system)'}`);
  });
  // Columns continuing through a level with no slab around them (void / double height / open edge): longer unbraced length
  const runs=[];
  M.pts.forEach(p=>{
    let r=null;
    for (let k=1;k<=M.nL-2;k++){
      const through=M.present(M.col[k-1][p.id])&&M.present(M.col[k][p.id])&&M.col[k][p.id]!=='core'&&!M.nodeSlab(k,p.x,p.y);
      if (through){ if(!r) r={p,k1:k,k2:k}; r.k2=k; } else if (r){ runs.push(r); r=null; }
    }
    if (r) runs.push(r);
  });
  const byRange=new Map();
  runs.forEach(r=>{ const key=r.k1+'|'+r.k2; if(!byRange.has(key)) byRange.set(key,{k1:r.k1,k2:r.k2,pts:[]}); byRange.get(key).pts.push(r.p.label); });
  byRange.forEach(g=>{
    let H=0; for(let s=g.k1-1;s<=g.k2;s++) H+=M.L[s].h||0;
    add('mid',`${g.pts.length} column(s) (e.g. ${g.pts.slice(0,5).join(', ')}) have no slab at ${M.L.slice(g.k1,g.k2+1).map(l=>l.name).join(', ')} → unbraced over ${f(H,1)} m (${M.L[g.k1-1].name} to ${M.L[g.k2+1].name}): check slenderness / buckling; consider larger sections or tie beams`);
  });
  M.zones.filter(z=>(z.type==='dbl'||z.type==='void')&&z.s2>z.s1).forEach(z=>add('info',`${z.name}: slab edges along the zone boundary at ${M.L.slice(z.s1+1,z.s2+1).map(l=>l.name).join(', ')} need edge beams; balustrade / façade loads at the opening edge`));
  if (M.wallOnCols.length) add('info',`${M.wallOnCols.length} wall(s) supported by columns at both ends but no wall below: the wall can span as a deep beam (check manually)`);
  const allSp=M.grids.flatMap(g=>g.cols?[...g.gx.sp,...g.gy.sp]:[]);
  if (allSp.length){
    const maxSp=Math.max(...allSp); const minDepth=Math.min(...M.depth.filter(d=>d!==null));
    if (maxSp/P.beamCont>minDepth) add('mid',`Typical span ${maxSp} m needs a beam approx. ${f(maxSp/P.beamCont)} m deep, more than the smallest available depth ${f(minDepth)} m: consider flat slab, PT slab or a denser column grid`);
    const minS=num(M.S.rules.minSpacing); if (minS){ const bad=allSp.filter(v=>v<minS-EPS); if(bad.length) add('mid',`Column spacing below the minimum ${minS} m: ${[...new Set(bad)].join(', ')} m`); }
  }
  const la=M.lateral;
  if (la&&la.cores.length&&(la.rx>0.1||la.ry>0.1)) add('mid',`Core eccentricity: ex = ${f(la.ex,1)} m (${f(la.rx*100,0)}%), ey = ${f(la.ey,1)} m (${f(la.ry*100,0)}%) → torsion; provide rigid frames or other lateral elements at the far side`);
  if (la&&!la.cores.length&&!la.wallsN) add('mid','No core or walls: lateral stability must rely on rigid frames or bracing');
  if (M.nL>20) add('info','High-rise: stiffness change at the transfer level, wind load and drift to be checked separately [MANUAL JUDGEMENT]');
  const up=M.uplift.rc;
  if (up&&up.U>0){ const g=up.groups[0]; if(g&&g.fos<P.fosUp) add('high',`Uplift: water pressure ${f(up.U,0)} kPa; worst area ${g.where} dead load approx. ${f(g.W,0)} kPa, FOS ${f(g.fos)} < ${P.fosUp} → tension piles / rock anchors required`); }
  const fd=M.found;
  if (fd&&fd.exc>0&&fd.adjacent) add('mid',`Excavation approx. ${f(fd.exc,1)} m next to adjoining buildings → stiff retaining wall and settlement control required`);
  return out;
}

