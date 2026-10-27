// 안양과천 관내전보 모의 지원 (Supabase)
const SUPABASE_URL = 'https://ibpycwlzrxqtxlmbfemh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0RvlXiRgdJMZnDi1Gm1zBA_pWw9z5gV';
const CYCLE = '2027-03';
const DISTRICT = 'anyang';
// 2027 안양과천 관내 초등 47교 (모두 갑구역). 출처: 도 기준 [별표1] + 2027 안양과천 원칙(과천율목 을→갑)
const SCHOOLS = [
  '관양', '귀인', '나눔', '달안', '덕천', '동안', '만안', '명학', '민백', '박달', '범계', '벌말', '부림', '비산',
  '삼봉', '삼성', '샘모루', '석수', '신안', '안양', '안양관악', '안양남', '안양덕현', '안양동', '안양부안', '안양부흥',
  '안양서', '안양신기', '안양양지', '안양중앙', '안양호암', '안일', '연현', '인덕원', '평촌', '해오름', '호계', '호성',
  '호원', '화창', '희성',
  '과천', '과천갈현', '과천율목', '관문', '문원', '청계',
].map(s => s + '초');

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let myApp = null;

// ── 계산기를 안양과천 관내 기준으로 맞춘다 ──
(function adaptCalculator() {
  const rowOf = (id) => $(id) && $(id).closest('.row');
  // 전 학교 갑구역 → 지역가산 없음. 구역은 갑으로 고정하고 갑 근무 시작일만 받는다
  $('zone').value = 'gap';
  rowOf('zone').hidden = true;
  rowOf('smallSchool').hidden = true;
  const note = document.createElement('div');
  note.className = 'row';
  note.innerHTML = '<span class="lab">인사구역</span><div class="ctl"><span class="hint">안양과천 초등학교는 2027학년도에 모두 갑구역이라 지역가산이 없어요.</span></div>';
  rowOf('zone').after(note);
  // 관외용 항목 숨김
  $('wishRegion').value = '';
  rowOf('wishRegion').closest('fieldset').hidden = true;
  rowOf('couple').hidden = true;
  $('couple').checked = false;
  // 표창: 장관 이상 3월 / 교육감 2월 / 교육장 1월
  const units = $('awardPM').closest('.ctl').querySelectorAll('.unit');
  units[0].textContent = '장관 이상'; units[1].textContent = '교육감'; units[2].textContent = '교육장';
  $('awardSupt').value = 0;
  document.querySelector('.tag').textContent = '2027학년도 안양과천 관내전보 원칙 · 33차 개정';
  document.querySelector('header p').textContent = '안양과천 안에서 학교를 옮길 때 쓰는 전보년수(현임교 근무년수 + 가산년수)를 계산해요. 원칙에 없는 항목은 경기도 기준을 따랐어요.';
})();

const _gather = gather;
gather = function () { return { ..._gather(), zone: 'gap', smallSchool: false, couple: false, awardLabels: ['장관↑', '교육감', '교육장'] }; };

function currentCalc() { return calc(gather()); }

function schoolOptions(sel, placeholder) {
  sel.innerHTML = `<option value="">${placeholder}</option>` + SCHOOLS.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
}
schoolOptions($('curSchool'), '선택하세요');

const isExpiredKind = () => $('kindExpired').checked;
let kindTouched = false;

function renderWishInputs() {
  const r = currentCalc();
  if (!kindTouched && r.sameSchoolExpired) $('kindExpired').checked = true;
  const n = isExpiredKind() ? 4 : 1;
  const box = $('wishBox');
  const prev = [...box.querySelectorAll('select')].map(s => s.value);
  box.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('select');
    s.id = 'wish' + i;
    s.setAttribute('aria-label', `${i + 1}희망`);
    schoolOptions(s, `${i + 1}희망${i ? ' (선택)' : ''}`);
    s.value = prev[i] || '';
    s.addEventListener('change', renderApplySummary);
    box.appendChild(s);
  }
  $('wishHint').textContent = isExpiredKind()
    ? '현임교 만기내신은 1~4희망까지 쓸 수 있고, 일반내신자보다 먼저 배정돼요. 4희망까지 밀리면 다른 학교로 배정돼요.'
    : '일반내신은 1희망만 쓸 수 있고, 밀리면 잔류해요.';
  renderApplySummary();
}

const readWishes = () => [...$('wishBox').querySelectorAll('select')].map(s => s.value).filter(Boolean);

function validate() {
  const r = currentCalc();
  const cur = $('curSchool').value;
  const wishes = readWishes();
  if (r.errors.length) return r.errors[0];
  if (r.gapExpired) return '갑구역 10년 만기라 관내로 낼 수 없어요. 관외 모의지원을 이용해 주세요.';
  if (!r.eligible) return '현임교 근무가 2년이 안 돼서 지원할 수 없어요.';
  if (!cur) return '현임교를 고르세요.';
  if (!wishes.length) return '희망 학교를 하나 이상 고르세요.';
  if (new Set(wishes).size !== wishes.length) return '같은 학교를 두 번 고를 수 없어요.';
  if (wishes.includes(cur)) return '현임교는 희망 학교로 고를 수 없어요.';
  if (!$('confirmOnce').checked) return '제출 전 확인란에 체크하세요.';
  return null;
}

function renderApplySummary() {
  const r = currentCalc();
  if (r.errors.length) { $('applySummary').textContent = ''; return; }
  const mismatch = isExpiredKind() && !r.sameSchoolExpired
    ? ` · <span class="warn-text">계산기상 현임교 근무가 5년이 안 돼 아직 만기가 아니에요</span>` : '';
  $('applySummary').innerHTML = `지원 점수: <strong>${fmtYM(r.totalMonths)}</strong> (현임교 ${fmtYM(r.baseMonths)} + 가산 ${fmtYM(r.bonusMonths)}) · ${isExpiredKind() ? '현임교 만기내신' : '일반내신'}${mismatch}`;
  const err = validate();
  $('btnSubmit').disabled = !!err;
  $('submitMsg').textContent = err || '';
}

async function refreshAuth() {
  const { data } = await sb.auth.getSession();
  const session = data.session;
  $('signedOut').hidden = !!session;
  $('signedIn').hidden = !session;
  if (session) { $('whoEmail').textContent = session.user.email || ''; await loadMine(); }
  else { $('applyForm').hidden = true; $('results').hidden = true; }
}

async function loadMine() {
  const { data, error } = await sb.from('gwannae_applications').select('*').eq('cycle', CYCLE).eq('district', DISTRICT).maybeSingle();
  if (error) { $('submitMsg').textContent = '지원 내역을 불러오지 못했어요. 새로고침해 주세요.'; return; }
  myApp = data;
  $('applyForm').hidden = !!myApp;
  if (!myApp) { renderWishInputs(); $('results').hidden = true; }
  else await loadRankings();
}

// 같은 구분 안에서 우대 → 전보년수. 동점이면 내가 앞(최선 순위)
const byScore = (a, b) => (b.has_priority - a.has_priority) || (b.total_months - a.total_months) || (b.is_me - a.is_me);

async function loadRankings() {
  $('results').hidden = false;
  const a = myApp;
  $('myApp').innerHTML = `<div class="mine">
      <div><span class="k">지원 점수</span><span class="v">${fmtYM(a.total_months)}</span></div>
      <div><span class="k">현임교</span><span class="v">${esc(a.current_school)}</span></div>
      <div><span class="k">희망</span><span class="v">${a.wishes.map((w, i) => `${i + 1}. ${esc(w)}`).join(' &nbsp;')}</span></div>
      <div><span class="k">내신 구분</span><span class="v">${a.is_expired ? '현임교 만기내신' : '일반내신'}${a.has_priority ? ' · 우대' : ''}</span></div>
    </div>`;
  const { data, error } = await sb.rpc('get_school_rankings', { p_cycle: CYCLE, p_district: DISTRICT });
  if (error) { $('regionCards').innerHTML = '<p class="err">순위를 불러오지 못했어요. 새로고침을 눌러 주세요.</p>'; return; }
  const bySchool = {};
  for (const row of data) (bySchool[row.school] ||= []).push(row);

  $('regionCards').innerHTML = a.wishes.map((w, i) => {
    const all = bySchool[w] || [];
    const exp1 = all.filter(r => r.is_expired && (r.wish_order === 1 || r.is_me)).sort(byScore);
    const expLater = all.filter(r => r.is_expired && r.wish_order > 1 && !r.is_me).length;
    const gen1 = all.filter(r => !r.is_expired && (r.wish_order === 1 || r.is_me)).sort(byScore);
    const group = a.is_expired ? exp1 : gen1;
    const me = group.find(r => r.is_me);
    const ahead = group.filter(r => !r.is_me && byScore(r, me) < 0).length;
    const ties = group.filter(r => !r.is_me && r.has_priority === me.has_priority && r.total_months === me.total_months).length;
    const li = (r) => `<li class="${r.is_me ? 'me' : ''}"><span>${fmtYM(r.total_months)}</span>${r.is_me ? '<em>나</em>' : ''}${r.has_priority ? '<em class="p">우대</em>' : ''}${r.is_expired ? '<em class="g">만기</em>' : ''}</li>`;
    const ladder = [...exp1, ...gen1].slice(0, 14).map(li).join('');
    const notes = [];
    if (!a.is_expired && exp1.length) notes.push(`이 학교를 1희망으로 쓴 만기자 ${exp1.length}명이 일반내신보다 먼저 배정돼요.`);
    if (expLater) notes.push(`2~4희망으로 쓴 만기자 ${expLater}명도 앞 희망에서 밀리면 이 학교에 먼저 배정될 수 있어요.`);
    notes.push(a.is_expired
      ? (i < a.wishes.length - 1 ? '여기서 밀리면 다음 희망 학교로 넘어가요.' : '마지막 희망이에요. 여기서도 밀리면 다른 학교로 배정돼요.')
      : '일반내신은 여기서 밀리면 잔류해요.');
    return `<article class="card">
      <header><span class="tagw">${i + 1}희망</span><h4>${esc(w)}</h4></header>
      <div class="rank"><span class="big">${ahead + 1}</span><span class="of">/ ${group.length}명 (${a.is_expired ? '만기내신' : '일반내신'} 1희망 기준)</span></div>
      <p class="line">내 앞에 ${ahead}명${ties ? `, 동점 ${ties}명` : ''}</p>
      ${notes.map(n => `<p class="line muted">${n}</p>`).join('')}
      <ol class="ladder">${ladder}</ol>
      ${exp1.length + gen1.length > 14 ? '<p class="line muted">위 14명까지 표시</p>' : ''}
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
    ? (error.status === 429 ? '메일을 너무 자주 요청했어요. 1분쯤 뒤에 다시 시도해 주세요.' : '로그인 메일을 보내지 못했어요: ' + error.message)
    : `${email} 로 로그인 링크를 보냈어요. 메일함(스팸함 포함)을 확인하세요.`;
});
$('btnLogout').addEventListener('click', async () => { await sb.auth.signOut(); await refreshAuth(); });
$('btnRefresh').addEventListener('click', loadRankings);
$('curSchool').addEventListener('change', renderApplySummary);
$('confirmOnce').addEventListener('change', renderApplySummary);
for (const id of ['kindNormal', 'kindExpired']) $(id).addEventListener('change', () => { kindTouched = true; renderWishInputs(); });
$('f').addEventListener('input', () => { if (!$('applyForm').hidden) renderWishInputs(); });
$('f').addEventListener('change', () => { if (!$('applyForm').hidden) renderWishInputs(); });

$('applyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = validate();
  if (err) { $('submitMsg').textContent = err; return; }
  const r = currentCalc();
  $('btnSubmit').disabled = true;
  const { error } = await sb.from('gwannae_applications').insert({
    cycle: CYCLE, district: DISTRICT,
    current_school: $('curSchool').value,
    wishes: readWishes(),
    is_expired: isExpiredKind(),
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

sb.auth.onAuthStateChange(() => { setTimeout(refreshAuth, 0); });
render();
refreshAuth();
