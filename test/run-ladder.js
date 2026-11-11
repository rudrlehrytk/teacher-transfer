// 순위 12명 넘을 때: 내가 12위 밖이면 전체가 펼쳐지고, 접기/펼치기 동작
const {chromium}=require('playwright');const fs=require('fs');
const many=Array.from({length:20},(_,i)=>`{ user_id: 'x${i}', current_region: '성남', wishes: ['수원'], is_gap_expired: false, has_priority: false, total_months: ${200+i} },`).join('\n');
const mock=fs.readFileSync('test/mock-supabase.js','utf8').replace('const others = [','const others = [\n'+many);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:1600}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/supabase.min.js',r=>r.fulfill({contentType:'application/javascript',body:mock}));
await p.route('https://fonts.**',r=>r.abort());
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(500);await p.selectOption('#zone','gap');
await p.selectOption('#curRegion','안양(과천)');await p.selectOption('#wish0','수원');await p.check('#confirmOnce');
await p.click('#btnSubmit');await p.waitForTimeout(500);
const count=async()=>p.$$eval('#regionCards ol.ladder li',ls=>[ls.length,ls.filter(l=>!l.hidden).length,ls.findIndex(l=>l.classList.contains('me'))+1]);
const btn=p.locator('#regionCards .ladder-more').first();
console.log('open(me>12):',await count(),await btn.textContent());
await btn.click();console.log('after fold:',await count(),await btn.textContent());
await btn.click();console.log('after unfold:',await count());
await p.locator('#regionCards').screenshot({path:process.argv[2]||'test/ladder.png'});
console.log('errors',errs);await b.close();})();
