const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{}); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+require('path').resolve(__dirname,'../index.html')); await p.waitForSelector('.cat',{timeout:120000});
  console.log(await p.evaluate(()=>{ W=normW({title:'Hotel (user-like)',floors:{basements:2,ground:'G/F',top:10,skip:'',roof:'R/F',h:3.5,hr:2.5,sv:0.3,use:'HOTEL',ll:2},
      exc:[{floors:'B2/F~B1/F',h:6.5,hr:3,sv:0.5,use:'CARPARK',ll:3},{floors:'G/F~1/F',h:6.5,hr:4.5,sv:0.5,use:'LOBBY',ll:5},{floors:'2/F',h:6.5,use:'LOBBY',ll:5}],
      grid:{xl:'1-6',xs:'7.5,7,7,7,7.5',yl:'A-E',ys:'7,5,2,4'},
      types:[{name:'Podium',floors:'B2/F~2/F',x:'',y:'',minSp:'',spType:'c'},{name:'Typical',floors:'3/F~10/F',x:'',y:'B~E',minSp:7,spType:'c'}],
      cons:[{kind:'core',name:'Service core',x:'1~6',y:'D~E',floors:''},{kind:'periph',name:'Atrium',x:'1~6',y:'A~D',floors:'G/F~2/F'},{kind:'periph',name:'Typical',x:'1~6',y:'B~C',floors:'3/F~10/F',px:'3.75,3.75,3.5,3.5,3.5,3.5,3.5,3.5,3.75,3.75'}],
      mylays:[]});
    W.set.cantGrid=3; RES=evaluate(W);
    const L=RES.list; const bl=RES.lays.filter(l=>l.bands); let o='layouts '+RES.lays.length+', banded '+bl.length+'\n';
 bl.forEach(l=>{ const es=L.filter(e=>e.lay===l&&e.R.applicable); const f=es.filter(e=>e.R.worst!=='fail'); o+=l.id+' '+l.short.slice(0,170)+'\n   ok:'+f.map(e=>e.sc.base+(e.R.meaningless?'[NN:'+e.R.meaningless.slice(0,90)+']':'')).join(', ')+'\n   fail: '+[...new Set(es.filter(e=>e.R.worst==='fail').flatMap(e=>e.R.checks.filter(c=>c.v==='fail').map(c=>c.cat+':'+c.item.replace(/G\d+: /,'').slice(0,50))))].slice(0,3).join(' | ')+'\n'; });
 return o; }));
  console.log('ERR',errs); await b.close(); })();
