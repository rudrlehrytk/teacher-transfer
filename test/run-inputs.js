// 모든 페이지에서 보이는 가산 입력칸을 하나씩 넣어 보고 전보년수가 바뀌는지 확인
const {chromium}=require('playwright');const fs=require('fs');
const pages=['index','anyang','suwon','gunpo','seongnam','goyang','yongin','hwaseong','bucheon','pyeongtaek','gwangmyeong','siheung','gwangjuhanam','paju'];
(async()=>{const b=await chromium.launch();let bad=0;
for(const k of pages){const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/supabase.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('test/mock-district.js','utf8')}));
await p.route('https://fonts.**',r=>r.abort());
await p.goto('file://'+process.cwd()+'/'+k+'.html');await p.waitForTimeout(300);
if(await p.locator('#btnClear').count()) await p.click('#btnClear');
await p.fill('#startDate','2022-03-01');if(k==='index')await p.selectOption('#zone','gap');await p.waitForTimeout(50);
const total=async()=>(await p.textContent('#sheet')).replace(/\s+/g,' ').match(/전보년수 (\d+년 \d+월)/)?.[1];
const base=await total();
const ids=await p.$$eval('#f input[type=number]',els=>els.filter(e=>e.offsetParent!==null && e.type==='number').map(e=>e.id));
const dead=[];
for(const id of ids){ if(!id)continue; await p.fill('#'+id,'12'); await p.waitForTimeout(40); const t=await total(); if(t===base) dead.push(id); await p.fill('#'+id,'0'); }
// 체크박스·셀렉트도
const chks=await p.$$eval('#f input[type=checkbox]',els=>els.filter(e=>e.offsetParent!==null).map(e=>e.id));
for(const id of chks){ if(['gapExempt','wasTuk','noiseSchool'].includes(id))continue; await p.check('#'+id); await p.waitForTimeout(40); if(await total()===base) dead.push('☑'+id); await p.uncheck('#'+id); }
console.log(k.padEnd(13),'base',base,'| 안 바뀌는 칸:',dead.join(', ')||'없음',errs.length?errs:'');if(dead.length)bad++;await p.close();}
await b.close();})();
