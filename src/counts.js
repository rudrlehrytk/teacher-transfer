// 공개 지원 현황: 점수 없이 시·군(관외) / 학교(관내)별 지원 인원만. 로그인 없이 누구나 본다.
(function publicCounts() {
  if (typeof sb === 'undefined' || typeof CYCLE === 'undefined') return;
  const apply = document.getElementById('apply');
  if (!apply) return;
  const isGwannae = typeof DISTRICT !== 'undefined';
  const unit = isGwannae ? '학교' : '시·군';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const box = document.createElement('section');
  box.className = 'panel counts';
  box.id = 'counts';
  box.innerHTML = `
    <div class="panel-head"><h2>📋 ${unit}별 지원 현황</h2>
      <p>모의지원에서 <b>${unit}별로 몇 명이 지원했는지</b>만 보여 줘요. 점수와 결원은 보여 주지 않아요. 일부 선생님만 참여한 결과라 <b>실제 지원 인원과 다를 수 있어요.</b></p></div>
    <p class="counts-sum" id="countsSum">불러오는 중…</p>
    <div class="counts-wrap"><table class="counts-table">
      <thead><tr><th>${unit}</th><th>1희망</th><th>전체 희망<small>(2희망 이하 포함)</small></th></tr></thead>
      <tbody id="countsBody"></tbody></table></div>
    <button type="button" class="btn-ghost counts-more" id="countsMore" hidden></button>`;
  apply.after(box);
  const SHOW = 15;
  let expanded = false, rows = [];
  const draw = () => {
    const list = expanded ? rows : rows.slice(0, SHOW);
    const max = Math.max(1, ...rows.map(r => r.first_count));
    document.getElementById('countsBody').innerHTML = list.map(r => `<tr>
        <td>${esc(r.name)}</td>
        <td class="n">${r.first_count ? `<span class="bar" style="width:${Math.max(4, Math.round(r.first_count / max * 80))}px"></span>` : ""}<b>${r.first_count}</b>명</td>
        <td class="n">${r.total_count}명</td></tr>`).join('') || '<tr><td colspan="3" class="muted">아직 지원이 없어요.</td></tr>';
    const more = document.getElementById('countsMore');
    more.hidden = rows.length <= SHOW;
    more.textContent = expanded ? '접기' : `전체 ${rows.length}곳 보기`;
  };
  document.getElementById('countsMore').addEventListener('click', () => { expanded = !expanded; draw(); });
  const load = async () => {
    try {
      const [c, t] = await Promise.all([
        isGwannae ? sb.rpc('get_gwannae_counts', { p_cycle: CYCLE, p_district: DISTRICT }) : sb.rpc('get_gwanoe_counts', { p_cycle: CYCLE }),
        sb.rpc('get_apply_totals', { p_cycle: CYCLE, p_district: isGwannae ? DISTRICT : null }),
      ]);
      if (c.error || t.error) throw c.error || t.error;
      rows = (c.data || []).map(r => ({ name: isGwannae ? r.school : r.region, first_count: r.first_count, total_count: r.total_count }))
        .sort((a, b) => b.first_count - a.first_count || b.total_count - a.total_count || a.name.localeCompare(b.name, 'ko'));
      const now = new Date();
      document.getElementById('countsSum').textContent = `모의지원 ${t.data ?? 0}건 기준 · ${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} 업데이트`;
      draw();
    } catch (e) {
      document.getElementById('countsSum').textContent = '현황을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.';
    }
  };
  load();
  setInterval(() => { if (!document.hidden) load(); }, 60000);
  // 내가 지원하거나 지우면 바로 다시 불러온다
  const cards = document.getElementById('regionCards');
  if (cards) new MutationObserver(() => load()).observe(cards, { childList: true });
})();
