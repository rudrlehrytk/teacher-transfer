// 공개 지원 현황 표: 관외(시·군)·관내(학교) 페이지에 점수 없이 인원만, 15곳 넘으면 접기
const {chromium}=require('playwright');const fs=require('fs');
const patch=`async function countsRpc(n,a){
  if(n==='get_gwanoe_counts') return {data:Array.from({length:17},(_,i)=>({region:'지역'+i,first_count:20-i,total_count:30-i})),error:null};
  if(n==='get_gwannae_counts') return {data:[{school:'가초',first_count:1,total_count:3},{school:'나초',first_count:2,total_count:2}],error:null};
  if(n==='get_apply_totals') return {data:a.p_district?5:300,error:null};
  return null;}`;
const mk=(f)=>fs.readFileSync(f,'utf8').replace('(function () {','(function () {'+patch).replace(/async rpc\(([^)]*)\) \{/,(m,args)=>`async rpc(${args||'n,a'}) { { const __c=await countsRpc(${(args||'n,a').split(',')[0]||'n'},${(args||'n,a').split(',')[1]||'a'}); if(__c) return __c; }`);
(async()=>{const b=await chromium.launch();
for (const [page,mock] of [['index.html','test/mock-supabase.js'],['bucheon.html','test/mock-district.js']]) {
  const p=await b.newPage({viewport:{width:1200,height:1400}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/supabase.min.js',r=>r.fulfill({contentType:'application/javascript',body:mk(mock)}));
  await p.route('https://fonts.**',r=>r.abort());
  await p.goto('file://'+process.cwd()+'/'+page);await p.waitForTimeout(700);
  const rows=await p.locator('#countsBody tr').count();
  console.log(page,'| title',(await p.textContent('#counts h2')).trim(),'| sum',await p.textContent('#countsSum'),'| rows',rows,'| first',(await p.locator('#countsBody tr').first().textContent()).replace(/\s+/g,' ').trim(),'| more',await p.locator('#countsMore').isVisible());
  if(await p.locator('#countsMore').isVisible()){await p.click('#countsMore');console.log('  expanded rows',await p.locator('#countsBody tr').count());}
  console.log('  scoreLeak', /년 \d+월/.test(await p.textContent('#counts')),'errors',errs);
  await p.locator('#counts').screenshot({path:`${process.argv[2]}/counts-${page.replace('.html','')}.png`});await p.close();
}
await b.close();})();
