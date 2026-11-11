// 다시 로그인했는데 이 페이지에 지원 기록이 없을 때: 다른 페이지 기록 안내 / 없으면 다른 이메일 안내
const {chromium}=require('playwright');const fs=require('fs');
const base=fs.readFileSync('test/mock-supabase.js','utf8').replace("const rows = [...others];","const rows = [];");
const withIn=base.replace("from() {\n          const q = {","from(t) {\n          const res = t === 'gwannae_applications' ? { data: [{ district: 'suwon' }], error: null } : { data: [], error: null };\n          const q = {\n            limit() { return q; }, then(f, r) { return Promise.resolve(res).then(f, r); },");
const noIn=base.replace("from() {\n          const q = {","from(t) {\n          const q = {\n            limit() { return q; }, then(f, r) { return Promise.resolve({ data: [], error: null }).then(f, r); },");
(async()=>{const b=await chromium.launch();
for (const [name,mock] of [['다른 페이지 기록',withIn],['기록 없음',noIn]]) {
  const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/supabase.min.js',r=>r.fulfill({contentType:'application/javascript',body:mock}));
  await p.route('https://fonts.**',r=>r.abort());
  await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(700);
  const box=p.locator('.elsewhere');
  console.log(name,'| visible',await box.isVisible(),'|',(await box.textContent()).replace(/\s+/g,' ').trim(),'| links',await box.locator('a').evaluateAll(a=>a.map(x=>x.getAttribute('href'))),'| errors',errs);
  await p.close();
}
await b.close();})();
