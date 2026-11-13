// 실시간 익명 피드 — 모든 페이지 공통. 읽기는 누구나, 쓰기·신고는 로그인한 사람만.
// 화면에는 "익명 교사 N"만 보이고 이메일·계정 번호는 서버에서 내려오지 않는다(get_feed RPC).
(function feed() {
  if (typeof sb === 'undefined') return;
  const POLL_MS = 10000;
  const navLinks = [...document.querySelectorAll('nav.pages a')];
  const cur = navLinks.find(a => a.getAttribute('aria-current') === 'page');
  const isGwanoe = !cur || cur.getAttribute('href') === './';
  const gwannaeTags = navLinks.filter(a => a.getAttribute('href') !== './').map(a => '관내 · ' + a.textContent.trim());
  const gwanoeTags = (typeof REGIONS !== 'undefined' ? REGIONS : []).map(r => '관외 · ' + r.replace(/\(.*\)/, ''));
  const TAGS = [...gwanoeTags, ...gwannaeTags];
  const defaultTag = isGwanoe ? '' : '관내 · ' + cur.textContent.trim();
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const opt = (v, t, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(t)}</option>`;

  const panel = document.createElement('aside');
  panel.className = 'feed';
  panel.id = 'feed';
  panel.setAttribute('aria-label', '실시간 피드');
  panel.innerHTML = `
    <div class="feed-head">
      <strong>💬 실시간 피드</strong>
      <span class="feed-live" id="feedLive">익명</span>
      <button type="button" class="feed-close" id="feedClose" aria-label="피드 닫기">✕</button>
    </div>
    <p class="feed-note">몇 점이면 어디가 안정권인지 익명으로 나눠요. <b>참고용 의견</b>이라 실제 배정과 다를 수 있어요. 이름·학교처럼 누군지 알 수 있는 내용은 쓰지 말아 주세요.</p>
    <label class="feed-filter">보기 <select id="feedFilter">${opt('', '전체 글', !defaultTag)}${TAGS.map(t => opt(t, t, t === defaultTag)).join('')}</select></label>
    <form class="feed-form" id="feedForm">
      <textarea id="feedBody" maxlength="300" rows="3" placeholder="예) 4년 9월로 수원 1희망, 지금 18위예요. 작년 컷 아시는 분?"></textarea>
      <div class="feed-row">
        <select id="feedTag" aria-label="지역 태그">${opt('', '지역 태그 없음', !defaultTag)}${TAGS.map(t => opt(t, t, t === defaultTag)).join('')}</select>
      </div>
      <div class="feed-row">
        <label class="feed-score"><input type="checkbox" id="feedScore"> 내 점수 붙이기 <span id="feedScoreTxt" class="feed-muted"></span></label>
        <span class="feed-count" id="feedCount">0/300</span>
      </div>
      <button type="submit" class="btn" id="feedSend">올리기</button>
      <p class="feed-msg" id="feedMsg"></p>
    </form>
    <ol class="feed-list" id="feedList"><li class="feed-empty">불러오는 중…</li></ol>
    <button type="button" class="btn-ghost feed-more" id="feedMore" hidden>이전 글 더 보기</button>`;
  document.body.appendChild(panel);
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'feed-fab';
  fab.id = 'feedFab';
  fab.innerHTML = '💬 실시간 피드 <span class="feed-badge" id="feedBadge" hidden></span>';
  document.body.appendChild(fab);
  document.body.classList.add('has-feed');

  const $f = (id) => document.getElementById(id);
  let session = null, posts = [], oldest = null, lastTopId = 0, unseen = 0;
  const open = () => { panel.classList.add('open'); unseen = 0; badge(); };
  const close = () => panel.classList.remove('open');
  fab.addEventListener('click', open);
  $f('feedClose').addEventListener('click', close);
  const badge = () => { const b = $f('feedBadge'); b.hidden = !unseen; b.textContent = unseen > 9 ? '9+' : unseen; };

  const myScore = () => {
    try {
      if (typeof currentCalc !== 'function' || typeof fmtYM !== 'function') return '';
      const r = currentCalc();
      if (!r || (r.errors && r.errors.length) || !r.totalMonths) return '';
      const kind = r.gapExpired ? ' · 갑만기' : (r.sameSchoolExpired ? ' · 만기' : '');
      return `${fmtYM(r.totalMonths)}${kind}`;
    } catch (e) { return ''; }
  };
  const syncScore = () => { const s = myScore(); $f('feedScoreTxt').textContent = s ? `(📊 ${s})` : '(계산기에 점수를 먼저 넣어 주세요)'; $f('feedScore').disabled = !s; if (!s) $f('feedScore').checked = false; };
  document.addEventListener('input', (e) => { if (!panel.contains(e.target)) syncScore(); });
  document.addEventListener('change', (e) => { if (!panel.contains(e.target)) syncScore(); });

  const ago = (t) => {
    const s = Math.max(0, (Date.now() - new Date(t).getTime()) / 1000);
    if (s < 60) return '방금';
    if (s < 3600) return `${Math.floor(s / 60)}분 전`;
    if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
    const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  const li = (p) => `<li class="feed-item${p.is_mine ? ' mine' : ''}" data-id="${p.id}">
      <div class="feed-meta"><b>익명 교사 ${p.anon_no}${p.is_mine ? ' (나)' : ''}</b><span>${ago(p.created_at)}</span></div>
      ${p.tag || p.score_label ? `<div class="feed-tags">${p.tag ? `<span class="feed-tag">#${esc(p.tag.replace(' · ', ' '))}</span>` : ''}${p.score_label ? `<span class="feed-tag score">📊 ${esc(p.score_label)}</span>` : ''}</div>` : ''}
      <p>${esc(p.body)}</p>
      <div class="feed-act">${p.is_mine ? '<button type="button" data-act="del">삭제</button>' : (session ? '<button type="button" data-act="report">신고</button>' : '')}</div>
    </li>`;
  const render = () => {
    $f('feedList').innerHTML = posts.length ? posts.map(li).join('') : '<li class="feed-empty">아직 글이 없어요. 첫 글을 남겨 주세요!</li>';
  };

  const fetchPage = async (before) => {
    const { data, error } = await sb.rpc('get_feed', { p_tag: $f('feedFilter').value || null, p_before: before || null, p_limit: 40 });
    if (error) throw error;
    return data || [];
  };
  const refresh = async () => {
    try {
      const rows = await fetchPage(null);
      const top = rows.length ? rows[0].id : 0;
      if (lastTopId && top > lastTopId && !panel.classList.contains('open') && getComputedStyle(fab).display !== 'none') {
        unseen += rows.filter(r => r.id > lastTopId && !r.is_mine).length; badge();
      }
      lastTopId = Math.max(lastTopId, top);
      // 첫 페이지는 새로 받은 것으로 바꾸고, 더 불러온 예전 글은 이어 붙인다
      const older = posts.filter(p => rows.length && p.id < rows[rows.length - 1].id);
      posts = [...rows, ...older];
      if (!oldest || rows.length < 40) oldest = posts.length ? posts[posts.length - 1].id : null;
      $f('feedMore').hidden = rows.length < 40 && !older.length;
      render();
      $f('feedLive').textContent = '● 실시간';
    } catch (e) {
      $f('feedLive').textContent = '연결 끊김';
    }
  };
  $f('feedMore').addEventListener('click', async () => {
    const last = posts[posts.length - 1];
    if (!last) return;
    const rows = await fetchPage(last.id).catch(() => []);
    posts = [...posts, ...rows];
    $f('feedMore').hidden = rows.length < 40;
    render();
  });
  $f('feedFilter').addEventListener('change', () => { posts = []; lastTopId = 0; refresh(); });

  const setMsg = (t, ok) => { const m = $f('feedMsg'); m.textContent = t; m.className = 'feed-msg' + (ok ? ' ok' : ''); };
  const syncAuth = () => {
    const can = !!session;
    $f('feedBody').disabled = !can;
    $f('feedSend').disabled = !can;
    $f('feedBody').placeholder = can ? '예) 4년 9월로 수원 1희망, 지금 18위예요. 작년 컷 아시는 분?' : '글을 쓰려면 왼쪽 모의지원에서 이메일로 로그인해 주세요. (읽기는 누구나 돼요)';
  };
  sb.auth.getSession().then(({ data }) => { session = data.session; syncAuth(); refresh(); });
  sb.auth.onAuthStateChange((_e, s) => { session = s; syncAuth(); refresh(); });
  $f('feedBody').addEventListener('input', () => { $f('feedCount').textContent = `${$f('feedBody').value.length}/300`; });

  $f('feedForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = $f('feedBody').value.trim();
    if (body.length < 2) return setMsg('두 글자 이상 써 주세요.');
    if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(body) || /01[0-9][- .]?[0-9]{3,4}[- .]?[0-9]{4}/.test(body)) return setMsg('이메일이나 전화번호는 올릴 수 없어요.');
    $f('feedSend').disabled = true;
    const { error } = await sb.rpc('post_feed', { p_body: body, p_tag: $f('feedTag').value || null, p_score: $f('feedScore').checked ? myScore() : null });
    $f('feedSend').disabled = !session;
    if (error) return setMsg(error.message && /[가-힣]/.test(error.message) ? error.message : '올리지 못했어요. 잠시 뒤 다시 해 주세요.');
    $f('feedBody').value = ''; $f('feedCount').textContent = '0/300';
    setMsg('올렸어요!', true);
    setTimeout(() => setMsg(''), 2500);
    refresh();
  });
  $f('feedList').addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const id = +b.closest('.feed-item').dataset.id;
    if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = b.dataset.act === 'del' ? '한 번 더 누르면 삭제' : '한 번 더 누르면 신고'; return; }
    const { error } = await sb.rpc(b.dataset.act === 'del' ? 'delete_feed' : 'report_feed', { p_id: id });
    if (error) { b.textContent = '실패했어요'; return; }
    if (b.dataset.act === 'report') { b.textContent = '신고했어요'; b.disabled = true; } else refresh();
  });

  syncScore();
  syncAuth();
  setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
