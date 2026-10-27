// 모의 지원 · 순위 (Supabase)
const SUPABASE_URL = 'https://ibpycwlzrxqtxlmbfemh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0RvlXiRgdJMZnDi1Gm1zBA_pWw9z5gV';
const CYCLE = '2027-03';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let session = null;
let myApp = null;

function currentCalc() { return calc(gather()); }

function regionOptions(sel, placeholder) {
  sel.innerHTML = `<option value="">${placeholder}</option>` + REGIONS.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
}
regionOptions($('curRegion'), '선택하세요');

function isGapKind() { return $('kindGap').checked; }

let kindTouched = false;
function renderWishInputs() {
  const r = currentCalc();
  // 계산기에서 갑 만기로 나오면 처음 한 번은 만기내신을 골라 둔다
  if (!kindTouched && r.gapExpired) $('kindGap').checked = true;
  const n = isGapKind() ? 4 : 1;
  const box = $('wishBox');
  const prev = [...box.querySelectorAll('select')].map(s => s.value);
  if (!prev.length && $('wishRegion').value) prev[0] = $('wishRegion').value;
  box.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('select');
    s.id = 'wish' + i;
    s.setAttribute('aria-label', `${i + 1}희망`);
    regionOptions(s, `${i + 1}희망${i ? ' (선택)' : ''}`);
    s.value = prev[i] || '';
    s.addEventListener('change', renderApplySummary);
    box.appendChild(s);
  }
  $('wishHint').textContent = isGapKind() ? '갑구역 만기내신은 1~4희망까지 쓸 수 있어요. 4희망까지 밀리면 생활근거지를 고려해 임의 배정될 수 있어요.' : '일반내신은 1희망만 쓸 수 있고, 밀리면 잔류해요.';
  renderApplySummary();
}

function readWishes() {
  return [...$('wishBox').querySelectorAll('select')].map(s => s.value).filter(Boolean);
}

function validate() {
  const r = currentCalc();
  const cur = $('curRegion').value;
  const wishes = readWishes();
  if (r.errors.length) return r.errors[0];
  if (!r.eligible) return '현임교 근무가 2년이 안 돼서 지원할 수 없어요.';
  if (!cur) return '현재 근무 지원청을 고르세요.';
  if (!wishes.length) return '희망 시·군을 하나 이상 고르세요.';
  if (new Set(wishes).size !== wishes.length) return '같은 시·군을 두 번 고를 수 없어요.';
  if (wishes.includes(cur)) return '현재 근무 지원청은 관외 희망지로 고를 수 없어요.';
  if (isGapKind() && $('zone').value !== 'gap') return '갑구역 만기내신은 현임교가 갑구역일 때만 고를 수 있어요. 위 계산기의 구역을 확인하세요.';
  if (!$('confirmOnce').checked) return '제출 전 확인란에 체크하세요.';
  return null;
}

function renderApplySummary() {
  const r = currentCalc();
  if (r.errors.length) { $('applySummary').textContent = ''; return; }
  const mismatch = r.gapMonths !== undefined && !r.gapExpired && isGapKind()
    ? ` · <span class="warn-text">계산기상 갑구역 근무가 ${Math.floor(r.gapMonths / 12)}년 ${r.gapMonths % 12}월이라 아직 만기가 아니에요</span>` : '';
  $('applySummary').innerHTML = `지원 점수: <strong>${fmtYM(r.totalMonths)}</strong> (현임교 ${fmtYM(r.baseMonths)} + 가산 ${fmtYM(r.bonusMonths)}) · ${isGapKind() ? '갑구역 만기내신' : '일반내신'}${mismatch}`;
  const err = validate();
  $('btnSubmit').disabled = !!err;
  $('submitMsg').textContent = err || '';
}

async function refreshAuth() {
  const { data } = await sb.auth.getSession();
  session = data.session;
  $('signedOut').hidden = !!session;
  $('signedIn').hidden = !session;
  if (session) {
    $('whoEmail').textContent = session.user.email || '';
    await loadMine();
  } else {
    $('applyForm').hidden = true;
    $('results').hidden = true;
  }
}

async function loadMine() {
  const { data, error } = await sb.from('applications').select('*').eq('cycle', CYCLE).eq('kind', 'gwanoe').maybeSingle();
  if (error) { $('submitMsg').textContent = '지원 내역을 불러오지 못했어요. 새로고침해 주세요.'; return; }
  myApp = data;
  $('applyForm').hidden = !!myApp;
  if (!myApp) { renderWishInputs(); $('results').hidden = true; }
  else await loadRankings();
}

function rankWithin(rows) {
  // 우대 먼저, 그다음 전보년수 내림차순
  // 동점은 근무성적·생년월일을 모르므로 내가 동점자 맨 앞(최선 순위)에 오도록 둔다
  return [...rows].sort((a, b) => (b.has_priority - a.has_priority) || (b.total_months - a.total_months) || (b.is_me - a.is_me));
}

async function loadRankings() {
  $('results').hidden = false;
  const a = myApp;
  $('myApp').innerHTML = `<div class="mine">
      <div><span class="k">지원 점수</span><span class="v">${fmtYM(a.total_months)}</span></div>
      <div><span class="k">현재</span><span class="v">${esc(a.current_region)}</span></div>
      <div><span class="k">희망</span><span class="v">${a.wishes.map((w, i) => `${i + 1}. ${esc(w)}`).join(' &nbsp;')}</span></div>
      <div><span class="k">내신 구분</span><span class="v">${a.is_gap_expired ? '갑구역 만기내신' : '일반내신'}${a.has_priority ? ' · 우대' : ''}</span></div>
    </div>`;
  const { data, error } = await sb.rpc('get_rankings', { p_cycle: CYCLE });
  if (error) { $('regionCards').innerHTML = '<p class="err">순위를 불러오지 못했어요. 새로고침을 눌러 주세요.</p>'; return; }
  const byRegion = {};
  for (const row of data) (byRegion[row.region] ||= []).push(row);

  $('regionCards').innerHTML = a.wishes.map((w, i) => {
    const all = byRegion[w] || [];
    const first = rankWithin(all.filter(r => r.wish_order === 1 || r.is_me));
    const meIdx = first.findIndex(r => r.is_me);
    const me = first[meIdx];
    const ahead = first.filter(r => (r.has_priority > me.has_priority) || (r.has_priority === me.has_priority && r.total_months > me.total_months)).length;
    const ties = first.filter(r => !r.is_me && r.has_priority === me.has_priority && r.total_months === me.total_months).length;
    const later = all.filter(r => r.wish_order > 1 && !r.is_me).length;
    const top = first.slice(0, 12).map(r => `<li class="${r.is_me ? 'me' : ''}${r.has_priority ? ' pri' : ''}"><span>${fmtYM(r.total_months)}</span>${r.is_me ? '<em>나</em>' : ''}${r.has_priority ? '<em class="p">우대</em>' : ''}${r.is_gap_expired ? '<em class="g">만기</em>' : ''}</li>`).join('');
    const label = i === 0 ? '1희망' : `${i + 1}희망`;
    return `<article class="card">
      <header><span class="tagw">${label}</span><h4>${esc(w)}</h4></header>
      <div class="rank"><span class="big">${ahead + 1}</span><span class="of">/ ${first.length}명</span></div>
      <p class="line">내 앞에 ${ahead}명${ties ? `, 동점 ${ties}명` : ''}${i > 0 ? ' (1희망 지원자 기준)' : ''}</p>
      ${later ? `<p class="line muted">이 시·군을 2~4희망으로 쓴 갑 만기자 ${later}명은 1희망 배정이 끝난 뒤 남은 자리를 두고 경합해요.</p>` : ''}
      <p class="line muted">${a.is_gap_expired
        ? (i < a.wishes.length - 1 ? '여기서 밀리면 다음 희망지로 넘어가요.' : '마지막 희망지예요. 여기서도 밀리면 생활근거지를 고려해 임의 배정될 수 있어요.')
        : '일반내신은 여기서 밀리면 잔류해요.'}</p>
      <ol class="ladder">${top}</ol>
      ${first.length > 12 ? `<p class="line muted">위 12명까지 표시</p>` : ''}
    </article>`;
  }).join('');
}

$('btnLogin').addEventListener('click', async () => {
  const email = $('email').value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $('loginMsg').textContent = '이메일 주소를 확인해 주세요.'; return; }
  $('btnLogin').disabled = true;
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
  $('btnLogin').disabled = false;
  $('loginMsg').textContent = error
    ? (error.status === 429 ? '메일을 너무 자주 요청했어요. 잠시 뒤에 다시 시도해 주세요.' : '로그인 메일을 보내지 못했어요: ' + error.message)
    : `${email} 로 로그인 링크를 보냈어요. 메일함(스팸함 포함)을 확인하세요.`;
});
$('btnLogout').addEventListener('click', async () => { await sb.auth.signOut(); await refreshAuth(); });
$('btnRefresh').addEventListener('click', loadRankings);
$('curRegion').addEventListener('change', renderApplySummary);
$('confirmOnce').addEventListener('change', renderApplySummary);
for (const id of ['kindNormal', 'kindGap']) $(id).addEventListener('change', () => { kindTouched = true; renderWishInputs(); });
$('f').addEventListener('input', () => { if (!$('applyForm').hidden) renderWishInputs(); });
$('f').addEventListener('change', () => { if (!$('applyForm').hidden) renderWishInputs(); });

$('applyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = validate();
  if (err) { $('submitMsg').textContent = err; return; }
  const r = currentCalc();
  $('btnSubmit').disabled = true;
  const { error } = await sb.from('applications').insert({
    cycle: CYCLE, kind: 'gwanoe',
    current_region: $('curRegion').value,
    wishes: readWishes(),
    is_gap_expired: isGapKind(),
    has_priority: $('priority').checked,
    base_months: r.baseMonths, bonus_months: r.bonusMonths, total_months: r.totalMonths,
  });
  if (error) {
    $('submitMsg').textContent = error.code === '23505' ? '이미 지원했어요. 한 사람당 한 번만 지원할 수 있어요.' : '지원하지 못했어요: ' + error.message;
    $('btnSubmit').disabled = false;
    if (error.code === '23505') await loadMine();
    return;
  }
  await loadMine();
});

// 콜백 안에서 바로 supabase를 다시 부르면 멈출 수 있어 한 박자 늦춘다
sb.auth.onAuthStateChange(() => { setTimeout(refreshAuth, 0); });
refreshAuth();
