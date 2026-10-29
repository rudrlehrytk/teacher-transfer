// 수원 관내전보 모의 지원 (Supabase)
const SUPABASE_URL = 'https://ibpycwlzrxqtxlmbfemh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0RvlXiRgdJMZnDi1Gm1zBA_pWw9z5gV';
const CYCLE = '2027-03';
const DISTRICT = 'suwon';
// 2027 수원 초등 100교 (갑 98 + 을 2: 매교·규장). 출처: 2027 수원 세부원칙 [별표1]
const SCHOOLS = ['고색', '고현', '곡반', '곡선', '곡정', '광교', '광교호수', '구운', '권선', '규장', '글빛', '남수원', '남창', '능실', '다솔', '당수', '대선', '대평', '동수원', '망포', '매교', '매산', '매여울', '매원', '매탄', '매현', '명당', '명인', '산남', '산의', '상률', '상촌', '서평', '서호', '선행', '세곡', '세류', '송림', '송원', '송정', '송죽', '수성', '수원', '수원가온', '수원금곡', '수원금호', '수원동신', '수원매화', '수원선일', '수원신곡', '수원중촌', '수일', '숙지', '신성', '신영', '신풍', '안룡', '연무', '영덕', '영동', '영일', '영통', '영화', '오목', '오현', '우만', '원일', '원천', '율전', '율현', '이의', '인계', '일월', '입북', '잠원', '정자', '정천', '조원', '지동', '창용', '천일', '천천', '청명', '칠보', '탑동', '태장', '파장', '팔달', '한일', '호매실', '화서', '화양', '화홍', '황곡', '효동', '효성', '효원', '효정', '효천', '효탑'].map(s => s + '초');
const EUL = ['매교초', '규장초'];
// 소음피해학교 14교 — 현임교 근무년수 50% (2020.3.1. 이후 경력)
const NOISE = ['고색', '고현', '구운', '당수', '서평', '서호', '수원금곡', '수원중촌', '안룡', '일월', '칠보', '탑동', '호매실', '효탑'].map(s => s + '초');

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let myApp = null;

// ── 계산기를 수원 관내 기준으로 맞춘다 ──
(function adaptCalculator() {
  const rowOf = (id) => $(id) && $(id).closest('.row');
  const hideRow = (id) => { rowOf(id).hidden = true; if ($(id).type === 'checkbox') $(id).checked = false; else $(id).value = 0; };
  // 갑 98 + 을 2지만 지역가산 없음. 5학급 이하 30%는 2027.3.1. 이후 경력부터라 이번 전보엔 0
  $('zone').value = 'gap';
  rowOf('zone').hidden = true;
  hideRow('smallSchool');
  const note = document.createElement('div');
  note.className = 'row';
  note.innerHTML = '<span class="lab">인사구역</span><div class="ctl"><span class="hint">수원은 갑구역 98교, 을구역 2교(매교·규장)인데 지역가산은 없어요. 5학급 이하 30%는 2027.3.1. 이후 경력부터라 이번 전보에는 해당이 없어요. 매교·규장 근무자는 갑구역 근무 시작일을 비워 두세요.</span></div>';
  rowOf('zone').after(note);
  window.TUK_DEFAULT = true; $('wasTuk').checked = true; // 수원: 2026.3.1. 특구역→갑구역
  $('gapExempt').closest('label').lastChild.textContent = ' 계속근무·유예 대상 (58세 이상, 중증장애, 세 자녀 유예)';
  // 관외용·수원에 없는 항목 숨김
  $('wishRegion').value = '';
  rowOf('wishRegion').closest('fieldset').hidden = true;
  for (const id of ['couple', 'bokSik', 'sunhoe', 'weeMonths', 'neulbomMonths']) hideRow(id);
  rowOf('silseup').querySelector('.hint').textContent = '1년에 3월';
  // 수원에만 있는 업무가산
  const add = (html) => { const d = document.createElement('div'); d.className = 'row'; d.innerHTML = html; return d; };
  rowOf('tonghap').after(
    add('<label for="peMonths">체육교과전담<span class="hint">2014.3.1.자부터, 체육 경력 50%</span></label><div class="ctl"><input type="number" min="0" max="60" id="peMonths" value="0"><span class="unit">개월</span></div>'),
    add('<label for="bokhapMonths">복합특수학급 특수교사<span class="hint">담당 기간 50%</span></label><div class="ctl"><input type="number" min="0" max="60" id="bokhapMonths" value="0"><span class="unit">개월</span></div>'),
    add('<label for="afterMonths">방과후학교 업무담당<span class="hint">2018.2.까지 경력만, 30%</span></label><div class="ctl"><input type="number" min="0" max="60" id="afterMonths" value="0"><span class="unit">개월</span></div>'),
    add('<span class="lab">소음피해학교<span class="hint">2020.3.1. 이후 현임교 근무 50%. 아래 현임교를 고르면 자동으로 체크돼요.</span></span><div class="ctl"><label class="check"><input type="checkbox" id="noiseSchool"> 현임교가 소음피해학교 (고색·고현·구운·당수·서평·서호·수원금곡·수원중촌·안룡·일월·칠보·탑동·호매실·효탑)</label></div>'),
  );
  // 표창: 총리↑4 / 장관3 / 교육감2 / 교육장1
  const ctl = $('awardPM').closest('.ctl');
  const units = ctl.querySelectorAll('.unit');
  units[0].textContent = '총리 이상'; units[1].textContent = '장관'; units[2].textContent = '교육감';
  const eduLab = document.createElement('span'); eduLab.className = 'unit'; eduLab.textContent = '교육장';
  const edu = document.createElement('input'); Object.assign(edu, { type: 'number', min: 0, max: 5, id: 'awardEdu', value: 0 });
  $('awardSupt').after(eduLab, edu);
  $('awardSupt').value = 0;
  rowOf('awardPM').querySelector('.hint').textContent = '총리↑4월·장관3월·교육감2월·교육장1월. 1년에 가장 높은 표창 1개만, 12.31. 기준';
  const basis = [...document.querySelectorAll('.fine p')].find(e => e.textContent.startsWith('근거'));
  if (basis) basis.textContent = '근거: 2027학년도 경기도수원교육공무원인사관리세부원칙(유치원, 초등) 제6·7·9·12조와 가산표.';
  document.querySelector('.tag').textContent = '2027학년도 수원 관내전보 세부원칙 · 2026.8.18. 개정';
  document.querySelector('header p').textContent = '수원 안에서 학교를 옮길 때 쓰는 전보년수(현임교 근무년수 + 가산년수)를 계산해요. 2027학년도 수원 세부원칙의 가산표를 따랐어요.';
})();

// 소음피해학교: 2020.3.1. 이후 현임교 근무 개월(15일 이상 1월), 5년 상한은 엔진에서 처리
function noiseMonths(g) {
  const s = parseDate(g.startDate), ref = parseDate(g.refDate);
  if (!s || !ref) return 0;
  let from = cmp(s, { y: 2020, m: 3, d: 1 }) < 0 ? { y: 2020, m: 3, d: 1 } : s;
  if (tukReset(g) && cmp(from, TUK_DATE) < 0) from = TUK_DATE; // 특만기 해당자는 2026.3.1. 이후만
  if (cmp(from, ref) >= 0) return 0;
  return roundMonths(serviceMD(from, ref, g.exclusions));
}

// 희망 수 표시를 수원 기준으로 (학교만기 6희망 / 일반 3희망 이내)
const _calc = calc;
calc = function (input) {
  const r = _calc(input);
  if (!r.errors.length) r.wishCount = r.sameSchoolExpired ? '학교만기전보 · 6희망까지' : '일반전보 · 3희망 이내';
  return r;
};

const _gather = gather;
gather = function () {
  const g = _gather();
  const num = (id) => +$(id).value || 0;
  const extraPct = [
    { label: '체육교과전담', months: num('peMonths'), rate: 0.5 },
    { label: '복합특수학급 특수교사', months: num('bokhapMonths'), rate: 0.5 },
    { label: '방과후학교 업무담당', months: num('afterMonths'), rate: 0.3 },
  ];
  if ($('noiseSchool').checked) extraPct.push({ label: '소음피해학교', months: noiseMonths(g), rate: 0.5 });
  return {
    ...g, zone: 'gap', smallSchool: false, couple: false, bokSik: 0, sunhoe: 0, weeMonths: 0, neulbomMonths: 0,
    silseupPerYear: 3, extraPct,
    awardTiers: [
      { label: '총리↑', count: num('awardPM'), months: 4 }, { label: '장관', count: num('awardMinister'), months: 3 },
      { label: '교육감', count: num('awardSupt'), months: 2 }, { label: '교육장', count: num('awardEdu'), months: 1 },
    ],
  };
};
function currentCalc() { return calc(gather()); }

function schoolOptions(sel, placeholder) {
  sel.innerHTML = `<option value="">${placeholder}</option>` + [...SCHOOLS].sort((a, b) => a.localeCompare(b, 'ko')).map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join(''); // 가나다순
}
schoolOptions($('curSchool'), '선택하세요');

const isExpiredKind = () => $('kindExpired').checked;
let kindTouched = false;

function renderWishInputs() {
  const r = currentCalc();
  if (!kindTouched && r.sameSchoolExpired) $('kindExpired').checked = true;
  const n = isExpiredKind() ? 6 : 3; // 수원: 학교만기 6희망, 일반 3희망 이내
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
    ? '학교만기전보는 6희망까지 써요. 일반전보자보다 먼저 배정되고, 6희망까지 밀리면 다른 학교로 배정돼요.'
    : '일반전보는 3희망 이내로 써요. 만기전보자 배정이 끝난 뒤 배정되고, 3희망까지 밀리면 잔류해요.';
  renderApplySummary();
}

const readWishes = () => [...$('wishBox').querySelectorAll('select')].map(s => s.value).filter(Boolean);

function validate() {
  const r = currentCalc();
  const cur = $('curSchool').value;
  const wishes = readWishes();
  if (r.errors.length) return r.errors[0];
  if (r.gapExpired && !EUL.includes(cur)) return '수원 갑구역 10년 만기라 관내로 낼 수 없어요. 관외 모의지원을 이용해 주세요.';
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
    ? ` · <span class="warn-text">계산기상 현임교 근무가 5년이 안 돼 아직 만기가 아니에요</span>`
    : (!isExpiredKind() && r.sameSchoolExpired ? ` · <span class="warn-text">현임교 5년 이상이면 학교만기전보 대상이에요</span>` : '');
  $('applySummary').innerHTML = `지원 점수: <strong>${fmtYM(r.totalMonths)}</strong> (현임교 ${fmtYM(r.baseMonths)} + 가산 ${fmtYM(r.bonusMonths)}) · ${isExpiredKind() ? '학교만기전보' : '일반전보'}${mismatch}`;
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
      <div><span class="k">내신 구분</span><span class="v">${a.is_expired ? '학교만기전보' : '일반전보'}${a.has_priority ? ' · 우대' : ''}</span></div>
    </div>`;
  const { data, error } = await sb.rpc('get_school_rankings', { p_cycle: CYCLE, p_district: DISTRICT });
  if (error) { $('regionCards').innerHTML = '<p class="err">순위를 불러오지 못했어요. 새로고침을 눌러 주세요.</p>'; return; }
  const bySchool = {};
  for (const row of data) (bySchool[row.school] ||= []).push(row);

  $('regionCards').innerHTML = a.wishes.map((w, i) => {
    const all = bySchool[w] || [];
    const first = all.filter(r => r.wish_order === 1 || r.is_me);
    const exp1 = first.filter(r => r.is_expired).sort(byScore);
    const gen1 = first.filter(r => !r.is_expired).sort(byScore);
    const expLater = all.filter(r => r.is_expired && r.wish_order > 1 && !r.is_me).length;
    const genLater = all.filter(r => !r.is_expired && r.wish_order > 1 && !r.is_me).length;
    // 배정 순서: 학교만기전보 → 일반전보. 같은 구분 안에서 우대 → 전보년수
    const group = a.is_expired ? exp1 : gen1;
    const me = group.find(r => r.is_me);
    const ahead = (a.is_expired ? 0 : exp1.length) + group.filter(r => !r.is_me && byScore(r, me) < 0).length;
    const ties = group.filter(r => !r.is_me && r.has_priority === me.has_priority && r.total_months === me.total_months).length;
    const total = exp1.length + gen1.length;
    const li = (r) => `<li class="${r.is_me ? 'me' : ''}"><span>${fmtYM(r.total_months)}</span>${r.is_me ? '<em>나</em>' : ''}${r.has_priority ? '<em class="p">우대</em>' : ''}${r.is_expired ? '<em class="g">만기</em>' : ''}</li>`;
    const ladder = [...exp1, ...gen1].slice(0, 14).map(li).join('');
    const notes = [];
    if (!a.is_expired && exp1.length) notes.push(`이 학교를 1희망으로 쓴 만기전보자 ${exp1.length}명이 일반전보자보다 먼저 배정돼요.`);
    if (expLater) notes.push(`2~6희망으로 쓴 만기전보자 ${expLater}명도 앞 희망에서 밀리면 이 학교에 먼저 배정될 수 있어요.`);
    if (!a.is_expired && genLater) notes.push(`2~3희망으로 쓴 일반전보자 ${genLater}명도 있어요. 점수가 나보다 높으면 앞 희망에서 밀렸을 때 경합할 수 있어요.`);
    const last = i === a.wishes.length - 1;
    notes.push(!last ? '여기서 밀리면 다음 희망 학교로 넘어가요.'
      : a.is_expired ? '마지막 희망이에요. 여기서도 밀리면 다른 학교로 배정돼요.' : '마지막 희망이에요. 여기서도 밀리면 잔류해요.');
    return `<article class="card">
      <header><span class="tagw">${i + 1}희망</span><h4>${esc(w)}</h4></header>
      <div class="rank"><span class="big">${ahead + 1}</span><span class="of">/ ${total}명 (1희망 기준, 만기전보자 먼저)</span></div>
      <p class="line">내 앞에 ${ahead}명${ties ? `, 동점 ${ties}명` : ''}</p>
      ${notes.map(n => `<p class="line muted">${n}</p>`).join('')}
      <ol class="ladder">${ladder}</ol>
      ${total > 14 ? '<p class="line muted">위 14명까지 표시</p>' : ''}
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
$('curSchool').addEventListener('change', () => { $('noiseSchool').checked = NOISE.includes($('curSchool').value); render(); renderWishInputs(); });
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
