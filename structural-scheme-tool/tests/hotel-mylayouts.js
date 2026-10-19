const { chromium } = require('playwright');
const file=process.argv[2], cg=+process.argv[3], my=process.argv[4]==='my';
(async()=>{
  const b = await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
  const p = await b.newPage({viewport:{width:1300,height:1000}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+file); await p.waitForSelector('.cat',{timeout:120000});
  console.log(await p.evaluate(([cg,my])=>{ W=normW({title:'Hotel (user-like)',floors:{basements:2,ground:'G/F',top:10,skip:'',roof:'R/F',h:3.5,hr:2.5,sv:0.3,use:'HOTEL',ll:2},
      exc:[{floors:'B2/F~B1/F',h:6.5,hr:3,sv:0.5,use:'CARPARK',ll:3},{floors:'G/F~2/F',h:6.5,hr:4.5,sv:0.5,use:'LOBBY',ll:5}],
      grid:{xl:'1-6',xs:'7.5,7,7,7,7.5',yl:'A-E',ys:'7,5,2,4'},
      types:[{name:'Podium',floors:'B2/F~2/F',x:'',y:'',minSp:'',spType:'c'},{name:'Typical',floors:'3/F~10/F',x:'',y:'B~E',minSp:7,spType:'c'}],
      cons:[{kind:'core',name:'Service core',x:'1~6',y:'D~E',floors:''},{kind:'periph',name:'Atrium',x:'1~6',y:'A~D',floors:'G/F~2/F'},{kind:'periph',name:'Typical',x:'1~6',y:'B~C',floors:'3/F~10/F',px:'3.75,3.75,3.5,3.5,3.5,3.5,3.5,3.5,3.75,3.75'}],
      mylays:my?[{name:'RC idea',x:'3c,10,10,10,3c',y:'',from:'3/F',xu:'7.5,7,7,7,7.5',yu:''},{name:'Steel idea',x:'12,12,12',y:''},{name:'Bad',x:'10,10'}]:[]});
    W.set.cantGrid=cg;
    RES=evaluate(W); if(RES.err) return RES.err.join(';'); view.pickRC=null; view.pickST=null; view.scheme=null; renderOut();
    const L=RES.list; const has=(x)=>L.filter(e=>e.lay.gx&&JSON.stringify(e.lay.gx.pos.map(v=>+v.toFixed(2)))===x);
    let o=document.querySelector('.rec').innerText.slice(0,300)+'\nlayouts '+RES.lays.length+'\n';
    ['[3,13,23,33]','[0,12,24,36]'].forEach(x=>{ const es=has(x); o+=x+': '+es.map(e=>e.sc.id+(e.lay.band?'(band@'+e.C.names[e.lay.band.u]+' up '+e.lay.ux.txt+')':'')+':'+e.R.worst+(e.R.meaningless?'[NN]':'')).join(', ')+'\n'; });
    o+=RES.lays.filter(l=>l.custom).length+' custom; errs '+JSON.stringify(RES.myErr)+'\n';
    const c=[...document.querySelectorAll('.card h2')].find(h=>h.textContent==='My column layouts'); if(c) o+=c.parentElement.innerText.slice(0,3500);
    return o; },[cg,my]));
  console.log('ERR',errs); await b.close();
})();
