// 설정형 관내 페이지 5곳 화면 흐름 테스트 (가짜 Supabase)
const {chromium}=require('playwright');const fs=require('fs');
const cases = {
  seongnam: { cur: '금빛초', wish: '서현초', rows: [
    { user_id: 'e1', current_school: '이매초', wishes: ['서현초'], is_expired: true, has_priority: false, total_months: 60 },
    { user_id: 'g1', current_school: '수내초', wishes: ['서현초'], is_expired: false, has_priority: false, total_months: 200 } ] },
  goyang: { cur: '벽제초', wish: '주엽초', zoneKind: true, rows: [
    { user_id: 'z1', current_school: '내유초', wishes: ['주엽초'], is_expired: true, tier: 2, has_priority: false, total_months: 61 },
    { user_id: 'e1', current_school: '대화초', wishes: ['주엽초'], is_expired: true, has_priority: false, total_months: 90 } ] },
  yongin: { cur: '백암초', wish: '수지초', small: true, rows: [
    { user_id: 'g1', current_school: '구성초', wishes: ['수지초'], is_expired: false, has_priority: false, total_months: 70 } ] },
  hwaseong: { cur: '세마초', wish: '동탄초', rows: [
    { user_id: 'e1', current_school: '병점초', wishes: ['동탄초', '청림초'], is_expired: true, has_priority: false, total_months: 70 },
    { user_id: 'g1', current_school: '반송초', wishes: ['동탄초'], is_expired: false, has_priority: false, total_months: 120 } ] },
  bucheon: { cur: '상동초', wish: '중동초', extraWish: true, rows: [
    { user_id: 'g1', current_school: '송내초', wishes: ['중동초'], is_expired: false, has_priority: true, total_months: 40 } ] },
};
(async()=>{const b=await chromium.launch();let fail=0;
for (const [key, c] of Object.entries(cases)) {
  const p=await b.newPage({viewport:{width:1200,height:1700}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(rows => { window.__ROWS = rows; }, c.rows);
  await p.route('**/supabase.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('test/mock-district.js','utf8')}));
  await p.route('https://fonts.**',r=>r.abort());
  await p.goto('file://'+process.cwd()+`/${key}.html`);await p.waitForTimeout(400);
  console.log(`\n== ${key}`, 'schools', await p.$$eval('#curSchool option',o=>o.length-1), 'nav', await p.$$eval('nav.pages a',a=>a.length));
  await p.fill('#startDate','2022-03-01');
  await p.selectOption('#curSchool', c.cur);await p.waitForTimeout(100);
  if (c.small) await p.selectOption('#smallSel', '0');
  if (c.extraWish) await p.check('#extraWish');
  console.log('zone:', await p.textContent('#zoneNote'));
  console.log('sheet:', (await p.textContent('#sheet')).replace(/\s+/g,' ').slice(0,420));
  if (c.zoneKind) { console.log('zone kind visible', await p.isVisible('#kind_zone')); await p.check('#kind_zone'); await p.waitForTimeout(50);
    await p.selectOption('#wish0','대곡초'); await p.check('#confirmOnce'); console.log('eul->eul msg:', await p.textContent('#submitMsg')); await p.uncheck('#confirmOnce'); }
  console.log('wish selects', await p.locator('#wishBox select').count());
  await p.selectOption('#wish0', c.wish);await p.check('#confirmOnce');
  console.log('summary', await p.textContent('#applySummary'), '| msg', await p.textContent('#submitMsg'));
  await p.click('#btnSubmit');await p.waitForTimeout(300);
  const ins = await p.evaluate(()=>window.__INSERTED);
  console.log('inserted', JSON.stringify(ins));
  console.log((await p.textContent('#regionCards')).replace(/\s+/g,' '));
  await p.screenshot({path:`/tmp/claude-0/-home-claude/81544ecf-f055-5a9b-8b00-db0b8a7eb3d0/scratchpad/${key}.png`,fullPage:true});
  if (errs.length || !ins) { fail++; console.log('ERRORS', errs); }
  await p.close();
}
console.log('\nfail', fail); await b.close();})();
