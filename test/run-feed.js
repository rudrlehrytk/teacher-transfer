// 실시간 피드: 글쓰기·점수 첨부·필터·삭제·신고·넓은 화면 고정/좁은 화면 버튼
const {chromium}=require('playwright');const fs=require('fs');
const feedMock=`
  window.__feed=[{id:1,anon_no:3,body:'4년 6월로 수원 1희망 넣었어요',tag:'관외 · 수원',score_label:'4년 6월',created_at:new Date(Date.now()-600000).toISOString(),is_mine:false,reports:0}];
  window.__calls=[];
  async function feedRpc(name,args){ window.__calls.push(name);
    if(name==='get_feed') return {data:window.__feed.filter(p=>!args.p_tag||p.tag===args.p_tag).slice().sort((a,b)=>b.id-a.id),error:null};
    if(name==='post_feed'){ window.__feed.push({id:window.__feed.length+1,anon_no:7,body:args.p_body,tag:args.p_tag,score_label:args.p_score,created_at:new Date().toISOString(),is_mine:true,reports:0}); return {data:1,error:null}; }
    if(name==='delete_feed'){ window.__feed=window.__feed.filter(p=>p.id!==args.p_id); return {data:null,error:null}; }
    if(name==='report_feed') return {data:null,error:null};
    return null; }`;
const mock=fs.readFileSync('test/mock-supabase.js','utf8').replace('(function () {','(function () {'+feedMock).replace('async rpc() {','async rpc(n,a) { const f=await feedRpc(n,a); if(f) return f;');
(async()=>{const b=await chromium.launch();
for (const [w,label] of [[1600,'wide'],[420,'phone']]) {
  const p=await b.newPage({viewport:{width:w,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/supabase.min.js',r=>r.fulfill({contentType:'application/javascript',body:mock}));
  await p.route('https://fonts.**',r=>r.abort());
  await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(600);
  const vis=await p.locator('#feed').evaluate(e=>e.getBoundingClientRect().left<innerWidth);
  console.log(label,'panel visible',vis,'fab',await p.locator('#feedFab').isVisible());
  if(!vis){await p.click('#feedFab');await p.waitForTimeout(400);}
  console.log(' items',await p.locator('.feed-item').count(),'|',(await p.locator('.feed-item').first().textContent()).replace(/\s+/g,' ').trim());
  await p.selectOption('#zone','gap');await p.fill('#startDate','2022-03-01');await p.dispatchEvent('#startDate','change');
  await p.fill('#feedBody','군포의왕 4년 9월이면 안정권일까요?');await p.selectOption('#feedTag','관외 · 군포의왕');await p.check('#feedScore');
  await p.click('#feedSend');await p.waitForTimeout(400);
  console.log(' after post',await p.locator('.feed-item').count(),'|',(await p.locator('.feed-item').first().textContent()).replace(/\s+/g,' ').trim());
  await p.fill('#feedBody','연락주세요 010-1234-5678');await p.click('#feedSend');await p.waitForTimeout(200);console.log(' pii:',await p.textContent('#feedMsg'));
  await p.selectOption('#feedFilter','관외 · 수원');await p.waitForTimeout(300);console.log(' filter 수원',await p.locator('.feed-item').count());
  await p.selectOption('#feedFilter','');await p.waitForTimeout(300);
  await p.locator('.feed-item.mine button[data-act=del]').click();await p.locator('.feed-item.mine button[data-act=del]').click();await p.waitForTimeout(300);
  console.log(' after delete',await p.locator('.feed-item').count(),'report btn',await p.locator('button[data-act=report]').count());
  await p.screenshot({path:`${process.argv[2]}/feed-${label}.png`});
  console.log(' errors',errs);await p.close();
}
await b.close();})();
