// 군포의왕 관내전보 모의 지원 (Supabase)
const SUPABASE_URL = 'https://ibpycwlzrxqtxlmbfemh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0RvlXiRgdJMZnDi1Gm1zBA_pWw9z5gV';
const CYCLE = '2027-03';
const DISTRICT = 'gunpo';
// 2027 군포의왕 초등 42교: 군포 갑 27 / 의왕 갑 14 + 을 1(의왕푸른). 출처: 2027 군포의왕 세부원칙 [별표1]
const SCHOOLS = ['군포', '금정', '산본', '군포양정', '군포화산', '흥진', '능내', '둔전', '광정', '수리', '궁내', '곡란', '신흥', '태을', '오금', '용호', '군포옥천', '당동', '당정', '한얼', '군포신기', '관모', '도장', '군포대야', '둔대', '부곡중앙', '송안', '고천', '의왕부곡', '백운', '내손', '오전', '왕곡', '의왕', '의왕덕성', '갈뫼', '모락', '포일', '내동', '덕장', '백운호수', '의왕푸른'].map(s => s + '초');
const EUL = ['의왕푸른초'];

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let myApp = null;

// ── 계산기를 군포의왕 관내 기준으로 맞춘다 ──
(function adaptCalculator() {
  const rowOf = (id) => $(id) && $(id).closest('.row');
  const hideRow = (id) => { rowOf(id).hidden = true; if ($(id).type === 'checkbox') $(id).checked = false; else $(id).value = 0; };
  // 구역은 현임교로 정한다: 의왕푸른만 을구역(50%), 나머지 갑
  $('zone').value = 'gap';
  rowOf('zone').hidden = true;
  const note = document.createElement('div');
  note.className = 'row';
  note.innerHTML = '<span class="lab">인사구역</span><div class="ctl"><span class="hint" id="zoneNote">군포의왕은 의왕푸른초만 을구역(현임교 근무년수 50%)이고 나머지는 갑구역이에요. 아래 모의 지원에서 현임교를 고르면 자동으로 맞춰져요.</span></div>';
  rowOf('zone').after(note);
  $('gapStart').closest('.row').querySelector('.hint').textContent = '10년이면 갑 만기. 다른 지원청에서 근무한 갑구역 기간은 넣지 않아요.';
  // 관외용·군포의왕에 없는 항목 숨김
  $('wishRegion').value = '';
  rowOf('wishRegion').closest('fieldset').hidden = true;
  hideRow('couple');
  // 혁신학교: 2017학년도부터 지정(50%)만 있음
  $('hyeoksin').querySelector('option[value="before2017"]').remove();
  rowOf('neulbomMonths').querySelector('.hint').textContent = '2027.3.1. 이후 임용된 늘봄전담실장은 제외, 50%';
  rowOf('weeMonths').querySelector('label').firstChild.textContent = '특수교육순회교사(교육지원청)·Wee센터';
  rowOf('exList').querySelector('.hint').textContent = '현임교 근무년수에서 빠져요. 휴가는 포함. 전보 유예로 더 근무한 기간도 여기에 넣어 빼 주세요.';
  // 군포의왕에만 있는 업무가산 (모두 2018.2.까지 경력)
  const add = (html) => { const d = document.createElement('div'); d.className = 'row'; d.innerHTML = html; return d; };
  rowOf('tonghap').after(
    add('<label for="subjMonths">교과전담 (체육 외)<span class="hint">2018.2.까지 경력만, 30%</span></label><div class="ctl"><input type="number" min="0" max="60" id="subjMonths" value="0"><span class="unit">개월</span></div>'),
    add('<label for="peMonths">체육교과전담<span class="hint">2014.3.~2018.2. 경력, 50%</span></label><div class="ctl"><input type="number" min="0" max="60" id="peMonths" value="0"><span class="unit">개월</span></div>'),
    add('<label for="afterMonths">방과후학교 업무담당<span class="hint">2018.2.까지 경력만, 30%</span></label><div class="ctl"><input type="number" min="0" max="60" id="afterMonths" value="0"><span class="unit">개월</span></div>'),
  );
  // 표창: 장관 이상 3월 / 교육감 2월 / 교육장 1월
  const units = $('awardPM').closest('.ctl').querySelectorAll('.unit');
  units[0].textContent = '장관 이상'; units[1].textContent = '교육감'; units[2].textContent = '교육장';
  $('awardSupt').value = 0;
  const basis = [...document.querySelectorAll('.fine p')].find(e => e.textContent.startsWith('근거'));
  if (basis) basis.textContent = '근거: 2027학년도 경기도군포의왕교육공무원인사관리세부원칙(유치원, 초등) 제7·8·10·13조와 가산표.';
  document.querySelector('.tag').textContent = '2027학년도 군포의왕 관내전보 세부원칙 · 44차 개정';
  document.querySelector('header p').textContent = '군포의왕 안에서 학교를 옮길 때 쓰는 전보년수(현임교 근무년수 + 가산년수)를 계산해요. 2027학년도 군포의왕 세부원칙의 가산표를 따랐어요.';
})();

const curZone = () => EUL.includes($('curSchool').value) ? 'eul' : 'gap';
const _gather = gather;
gather = function () {
  const g = _gather();
  const num = (id) => +$(id).value || 0;
  return {
    ...g, zone: curZone(), couple: false, awardLabels: ['장관↑', '교육감', '교육장'],
    extraPct: [
      { label: '교과전담(체육 외)', months: num('subjMonths'), rate: 0.3 },
      { label: '체육교과전담', months: num('peMonths'), rate: 0.5 },
      { label: '방과후학교 업무담당', months: num('afterMonths'), rate: 0.3 },
    ],
  };
};

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
    ? '현임교 만기내신은 1~4희망까지 쓸 수 있고, 일반내신자보다 먼저 배정돼요. 4희망까지 밀리면 생활근거지를 고려해 다른 학교로 배정돼요.'
    : '일반내신은 1희망만 쓸 수 있고, 밀리면 잔류해요.';
  renderApplySummary();
}

const readWishes = () => [...$('wishBox').querySelectorAll('select')].map(s => s.value).filter(Boolean);

function validate() {
  const r = currentCalc();
  const cur = $('curSchool').value;
  const wishes = readWishes();
  if (r.errors.length) return r.errors[0];
  if (r.gapExpired && !EUL.includes(cur)) return '군포의왕 갑구역 10년 만기라 관내로 낼 수 없어요. 관외 모의지원을 이용해 주세요.';
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
$('curSchool').addEventListener('change', () => { $('zone').value = curZone(); render(); renderWishInputs(); });
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
