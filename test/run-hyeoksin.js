// 혁신학교 가산이 모든 관내·관외 페이지에서 계산되는지 확인
const {chromium}=require('playwright');const fs=require('fs');
const pages=['index','anyang','suwon','gunpo','goyang','yongin','hwaseong','bucheon','pyeongtaek','gwangmyeong','siheung','gwangjuhanam'];
(async()=>{const b=await chromium.launch();let fail=0;
for(const k of pages){const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/supabase.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('test/mock-district.js','utf8')}));
await p.route('https://fonts.**',r=>r.abort());
await p.goto('file://'+process.cwd()+'/'+k+'.html');await p.waitForTimeout(300);
const opts=await p.$$eval('#hyeoksin option',o=>o.map(x=>x.value));
await p.fill('#startDate','2021-03-01');
await p.selectOption('#hyeoksin',opts[opts.length-1]);await p.fill('#hyeoksinMonths', k==='gwangmyeong' ? '36' : '12');await p.waitForTimeout(50);
const t=(await p.textContent('#sheet')).replace(/\s+/g,' ');const m=t.match(/혁신학교[^+]*\+(\d+)월/);
console.log(k.padEnd(13),m?`혁신 +${m[1]}월`:'혁신 가산 없음 ✗',errs.length?errs:'');if(!m)fail++;await p.close();}
console.log('fail',fail);await b.close();})();
