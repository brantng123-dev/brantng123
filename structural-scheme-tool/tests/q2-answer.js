const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
  const p = await b.newPage({viewport:{width:1300,height:1000}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+require('path').resolve(__dirname,'../index.html')); await p.waitForSelector('.cat',{timeout:120000});
  console.log(await p.textContent('.rec'));
  console.log(await p.evaluate(()=>RES.lays.map(l=>l.id+' | '+l.ttxt+' | '+RES.list.filter(e=>e.lay===l&&feasibleE(e)).map(e=>e.sc.base+(e.R.worst==='marg'?'~':'')).join(',')).join('\n')));
  console.log(await p.evaluate(()=>[...document.querySelectorAll('.cat.pick')].map(t=>[...t.rows].map(r=>r.cells[1].innerText.split('\n')[0]+' '+r.cells[2].innerText).join(' ; ')).join('\n=====\n')));
  const rows=await p.$$('.cat.pick tr[data-pick="st"]'); if(rows[2]){ await rows[2].click(); await p.waitForTimeout(500); console.log('after click:', await p.textContent('.rec')); }
  await p.screenshot({path:'pick.png'});
  console.log('ERR',errs); await b.close();
})();
