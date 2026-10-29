// 지원청별 관내전보 모의 지원 — 공통 코드. 지원청마다 다른 점은 src/districts/*.js 의 DCFG 설정에 둔다.
const SUPABASE_URL = 'https://ibpycwlzrxqtxlmbfemh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0RvlXiRgdJMZnDi1Gm1zBA_pWw9z5gV';
const CYCLE = '2027-03';
const C = DCFG;
const DISTRICT = C.key;
// 학교 목록: [{name, zone, rate, label}] — zone은 'gap' | 'eul', rate는 지역가산 비율
const SCHOOLS = C.schools;
const schoolOf = (n) => SCHOOLS.find(s => s.name === n);
const KINDS = C.kinds; // [{id, tier, label, wishes, hint}] tier 0 일반, 1 학교만기, 2 구역만기

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let myApp = null;

// ── 계산기를 이 지원청 기준으로 맞춘다 ──
(function adaptCalculator() {
  const rowOf = (id) => $(id) && $(id).closest('.row');
  const clear = (id) => { const el = $(id); if (!el) return; if (el.type === 'checkbox') el.checked = false; else if (el.tagName === 'SELECT') el.selectedIndex = 0; else el.value = 0; };
  const hideRow = (id) => { rowOf(id).hidden = true; clear(id); };
  const mk = (html) => { const d = document.createElement('div'); d.className = 'row'; d.innerHTML = html; return d; };

  $('zone').value = 'gap';
  rowOf('zone').hidden = true;
  rowOf('zone').after(mk(`<span class="lab">인사구역·지역가산</span><div class="ctl"><span class="hint" id="zoneNote">${C.zoneNote} 아래 모의 지원에서 현임교를 고르면 지역가산이 자동으로 맞춰져요.</span></div>`));
  if (C.tuk) { window.TUK_DEFAULT = true; $('wasTuk').checked = true; }
  if (C.gapHint) $('gapStart').closest('.row').querySelector('.hint').textContent = C.gapHint;

  // 학교 규모 가산 (지원청마다 기준이 다름) — 없으면 숨김
  if (C.small && C.small.length) {
    const r = rowOf('smallSchool');
    r.querySelector('.ctl').innerHTML = `<select id="smallSel">${['<option value="">해당 없음</option>', ...C.small.map((o, i) => `<option value="${i}">${o.label}</option>`)].join('')}</select>`;
    r.querySelector('.lab').innerHTML = `학교 규모<span class="hint">${C.smallHint || '학급 수 자료가 없어 직접 골라요'}</span>`;
    const hidden = document.createElement('input'); hidden.type = 'checkbox'; hidden.id = 'smallSchool'; hidden.hidden = true; r.appendChild(hidden);
  } else hideRow('smallSchool');

  $('wishRegion').value = '';
  rowOf('wishRegion').closest('fieldset').hidden = true;
  for (const id of ['couple', ...(C.hide || [])]) hideRow(id);

  for (const [id, text] of Object.entries(C.hints || {})) { const h = rowOf(id).querySelector('.hint'); if (h) h.textContent = text; }
  for (const [id, text] of Object.entries(C.labels || {})) { const l = rowOf(id).querySelector('label, .lab'); if (l) l.firstChild.textContent = text; }
  if (C.exclusionHint) rowOf('exList').querySelector('.hint').textContent = C.exclusionHint;

  // 혁신학교 선택지
  if (C.hyeoksin === null) hideRow('hyeoksin');
  else if (C.hyeoksin) {
    $('hyeoksin').innerHTML = '<option value="none">해당 없음</option>' + C.hyeoksin.map((o, i) => `<option value="${i}">${o.text}</option>`).join('');
  }

  // 지원청에만 있는 가산 입력칸
  let anchor = rowOf('tonghap').hidden ? rowOf('tonghap') : rowOf('tonghap');
  for (const e of C.extra || []) {
    const unit = e.type === 'pct' ? '개월' : '년';
    const max = e.type === 'pct' ? 60 : 5;
    const row = mk(`<label for="${e.id}">${e.label}<span class="hint">${e.hint}</span></label><div class="ctl"><input type="number" min="0" max="${max}" id="${e.id}" value="0"><span class="unit">${unit}</span></div>`);
    anchor.after(row); anchor = row;
  }

  // 표창 단계
  const ar = rowOf('awardPM');
  ar.querySelector('.hint').textContent = C.awards.map(a => `${a.label} ${a.months}월`).join('·') + '. 1년에 가장 높은 표창 1개만, 12.31. 기준';
  ar.querySelector('.ctl').innerHTML = C.awards.map((a, i) => `<span class="unit">${a.label}</span><input type="number" min="0" max="5" id="award${i}" value="0">`).join('') + '<span class="unit">건</span>'
    + '<input type="hidden" id="awardPM" value="0"><input type="hidden" id="awardMinister" value="0"><input type="hidden" id="awardSupt" value="0">';

  const basis = [...document.querySelectorAll('.fine p')].find(e => e.textContent.startsWith('근거'));
  if (basis) basis.textContent = '근거: ' + C.basis;
  document.querySelector('.tag').textContent = C.tag;
  document.querySelector('header p').textContent = C.intro;
})();

function smallOpt() { const el = $('smallSel'); return el && el.value !== '' ? C.small[+el.value] : null; }

const _gather = gather;
gather = function () {
  const g = _gather();
  const num = (id) => +($(id) && $(id).value) || 0;
  const sch = schoolOf($('curSchool').value);
  const sm = smallOpt();
  const extraPct = [], extraFixed = [];
  for (const e of C.extra || []) {
    const v = num(e.id);
    if (!v) continue;
    if (e.type === 'pct') extraPct.push({ label: e.short || e.label, months: v, rate: e.rate });
    else extraFixed.push({ label: e.short || e.label, months: v * e.perYear, basis: `${v}년 × ${e.perYear}월` });
  }
  let hyeoksinRule;
  if (C.hyeoksin && $('hyeoksin').value !== 'none') { const o = C.hyeoksin[+$('hyeoksin').value]; hyeoksinRule = { label: o.short, rate: o.rate, min: o.min }; }
  return {
    ...g, zone: sch ? sch.zone : 'gap', couple: false,
    regionRate: sch ? sch.rate : 0, regionLabel: sch ? sch.label : '',
    smallSchool: !!sm, smallRate: sm ? sm.rate : undefined, smallLabel: sm ? sm.short : undefined,
    extraPct, extraFixed, hyeoksinRule, hyeoksin: hyeoksinRule ? 'custom' : 'none',
    yearlyRates: C.yearlyRates, silseupPerYear: C.silseupPerYear || 1, bonusCapPct: C.bonusCapPct,
    awardTiers: C.awards.map((a, i) => ({ label: a.label, months: a.months, count: num('award' + i) })),
  };
};
const _calc = calc;
calc = function (input) {
  const r = _calc(input);
  if (!r.errors.length) r.wishCount = r.sameSchoolExpired ? `${KINDS.find(k => k.tier === 1).short} · ${KINDS.find(k => k.tier === 1).wishes}희망까지` : `${KINDS[0].short} · ${KINDS[0].wishes === 1 ? '1희망' : KINDS[0].wishes + '희망까지'}`;
  return r;
};
function currentCalc() { return calc(gather()); }

// 가나다순 한 목록. 구역·지역 구분은 학교 이름 뒤에 붙여 보여 준다
const SORTED = [...SCHOOLS].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
function schoolOptions(sel, placeholder) {
  sel.innerHTML = `<option value="">${placeholder}</option>` + SORTED.map(s => {
    const tag = C.groupBy ? s[C.groupBy] : s.label;
    return `<option value="${esc(s.name)}">${esc(s.name)}${tag ? ` (${esc(tag)})` : ''}</option>`;
  }).join('');
}
schoolOptions($('curSchool'), '선택하세요');

// 내신 구분 라디오
$('kindBox').innerHTML = KINDS.map((k, i) => `<label class="check" id="kl_${k.id}"><input type="radio" name="kindSel" id="kind_${k.id}" value="${k.id}"${i === 0 ? ' checked' : ''}> ${k.label}</label>`).join('');
$('kindHint').textContent = C.kindHint;
if (C.extraWish) { $('extraWishRow').hidden = false; $('extraWishLabel').textContent = C.extraWish.label; }
const kind = () => KINDS.find(k => $('kind_' + k.id).checked);
let kindTouched = false;

function kindAvailable(k) { return !k.needZone || (schoolOf($('curSchool').value) || {}).zone === k.needZone; }
function wishLimit() {
  const k = kind();
  if (k.tier === 0 && C.extraWish && $('extraWish').checked) return C.extraWish.wishes;
  return k.wishes;
}

function renderWishInputs() {
  const r = currentCalc();
  for (const k of KINDS) {
    const ok = kindAvailable(k);
    $('kl_' + k.id).hidden = !ok;
    if (!ok && $('kind_' + k.id).checked) $('kind_' + KINDS[0].id).checked = true;
  }
  if (!kindTouched && r.sameSchoolExpired) $('kind_' + KINDS.find(k => k.tier === 1).id).checked = true;
  const n = wishLimit();
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
  $('wishHint').textContent = kind().hint;
  renderApplySummary();
}

const readWishes = () => [...$('wishBox').querySelectorAll('select')].map(s => s.value).filter(Boolean);

function validate() {
  const r = currentCalc();
  const cur = $('curSchool').value;
  const wishes = readWishes();
  const k = kind();
  if (r.errors.length) return r.errors[0];
  if (!cur) return '현임교를 고르세요.';
  if (r.gapExpired && (schoolOf(cur) || {}).zone === 'gap') return `${C.name} 갑구역 10년 만기라 관내로 낼 수 없어요. 관외 모의지원을 이용해 주세요.`;
  if (!r.eligible) return '현임교 근무가 2년이 안 돼서 지원할 수 없어요.';
  if (!wishes.length) return '희망 학교를 하나 이상 고르세요.';
  if (new Set(wishes).size !== wishes.length) return '같은 학교를 두 번 고를 수 없어요.';
  if (wishes.includes(cur)) return '현임교는 희망 학교로 고를 수 없어요.';
  if (k.wishZoneNot && wishes.some(w => (schoolOf(w) || {}).zone === k.wishZoneNot)) return k.wishZoneMsg;
  if (!$('confirmOnce').checked) return '제출 전 확인란에 체크하세요.';
  return null;
}

function renderApplySummary() {
  const r = currentCalc();
  if (r.errors.length) { $('applySummary').textContent = ''; return; }
  const k = kind();
  let warn = '';
  if (k.tier === 1 && !r.sameSchoolExpired) warn = ' · <span class="warn-text">계산기상 현임교 근무가 5년이 안 돼 아직 학교 만기가 아니에요</span>';
  if (k.tier === 0 && r.sameSchoolExpired) warn = ' · <span class="warn-text">현임교 5년 이상이면 만기 대상이에요</span>';
  $('applySummary').innerHTML = `지원 점수: <strong>${fmtYM(r.totalMonths)}</strong> (현임교 ${fmtYM(r.baseMonths)} + 가산 ${fmtYM(r.bonusMonths)}) · ${k.short}${warn}`;
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

const tierOf = (r) => r.tier ?? (r.is_expired ? 1 : 0);
// 순위 단계: 만기 우선 지원청은 tier가 높을수록 먼저, 통합 명부 지원청은 모두 같은 단계
const stage = (r) => C.order === 'expiredFirst' ? tierOf(r) : 0;
const byScore = (a, b) => (stage(b) - stage(a)) || (b.has_priority - a.has_priority) || (b.total_months - a.total_months) || (b.is_me - a.is_me);
const kindName = (t) => (KINDS.find(k => k.tier === t) || KINDS[0]).short;

async function loadRankings() {
  $('results').hidden = false;
  const a = myApp;
  const myTier = tierOf(a);
  $('myApp').innerHTML = `<div class="mine">
      <div><span class="k">지원 점수</span><span class="v">${fmtYM(a.total_months)}</span></div>
      <div><span class="k">현임교</span><span class="v">${esc(a.current_school)}</span></div>
      <div><span class="k">희망</span><span class="v">${a.wishes.map((w, i) => `${i + 1}. ${esc(w)}`).join(' &nbsp;')}</span></div>
      <div><span class="k">내신 구분</span><span class="v">${kindName(myTier)}${a.has_priority ? ' · 우대' : ''}</span></div>
    </div>`;
  const { data, error } = await sb.rpc('get_school_rankings', { p_cycle: CYCLE, p_district: DISTRICT });
  if (error) { $('regionCards').innerHTML = '<p class="err">순위를 불러오지 못했어요. 새로고침을 눌러 주세요.</p>'; return; }
  const bySchool = {};
  for (const row of data) (bySchool[row.school] ||= []).push(row);

  $('regionCards').innerHTML = a.wishes.map((w, i) => {
    const all = bySchool[w] || [];
    const pool = all.filter(r => r.wish_order === 1 || r.is_me).sort(byScore);
    const me = pool.find(r => r.is_me);
    const ahead = pool.filter(r => !r.is_me && byScore(r, me) < 0).length;
    const ties = pool.filter(r => !r.is_me && stage(r) === stage(me) && r.has_priority === me.has_priority && r.total_months === me.total_months).length;
    const later = all.filter(r => r.wish_order > 1 && !r.is_me);
    const li = (r) => `<li class="${r.is_me ? 'me' : ''}"><span>${fmtYM(r.total_months)}</span>${r.is_me ? '<em>나</em>' : ''}${r.has_priority ? '<em class="p">우대</em>' : ''}${tierOf(r) ? `<em class="g">${tierOf(r) === 2 ? '구역만기' : '만기'}</em>` : ''}</li>`;
    const notes = [];
    if (C.order === 'expiredFirst') {
      const higher = pool.filter(r => stage(r) > stage(me)).length;
      if (higher) notes.push(`이 학교를 1희망으로 쓴 ${stage(me) === 0 ? '만기자' : '구역 만기자'} ${higher}명이 먼저 배정돼요.`);
      const laterHigh = later.filter(r => stage(r) > stage(me)).length;
      if (laterHigh) notes.push(`뒤 희망으로 이 학교를 쓴 ${stage(me) === 0 ? '만기자' : '구역 만기자'} ${laterHigh}명도 앞 희망에서 밀리면 먼저 배정될 수 있어요.`);
      const laterSame = later.filter(r => stage(r) === stage(me)).length;
      if (laterSame) notes.push(`같은 구분에서 뒤 희망으로 이 학교를 쓴 ${laterSame}명도 있어요. 점수가 나보다 높으면 경합할 수 있어요.`);
    } else if (later.length) notes.push(`뒤 희망으로 이 학교를 쓴 ${later.length}명도 있어요. 점수가 나보다 높으면 앞 희망에서 밀렸을 때 경합할 수 있어요.`);
    const last = i === a.wishes.length - 1;
    notes.push(!last ? '여기서 밀리면 다음 희망 학교로 넘어가요.' : (myTier ? C.lastExpired : C.lastNormal));
    return `<article class="card">
      <header><span class="tagw">${i + 1}희망</span><h4>${esc(w)}</h4></header>
      <div class="rank"><span class="big">${ahead + 1}</span><span class="of">/ ${pool.length}명 (1희망 기준${C.order === 'expiredFirst' ? ', 만기자 먼저' : ', 통합 명부'})</span></div>
      <p class="line">내 앞에 ${ahead}명${ties ? `, 동점 ${ties}명` : ''}</p>
      ${notes.map(n => `<p class="line muted">${n}</p>`).join('')}
      <ol class="ladder">${pool.slice(0, 14).map(li).join('')}</ol>
      ${pool.length > 14 ? '<p class="line muted">위 14명까지 표시</p>' : ''}
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
$('curSchool').addEventListener('change', () => {
  const s = schoolOf($('curSchool').value);
  $('zoneNote').textContent = s ? `현임교 ${s.name}: ${s.label || (s.zone === 'eul' ? '을구역' : '갑구역')}, 지역가산 ${s.rate ? (Math.abs(s.rate * 100 - Math.round(s.rate * 100)) > 1e-6 ? '1년당 ' + Math.round(s.rate * 12) + '월' : Math.round(s.rate * 100) + '%') : '없음'}.` : C.zoneNote;
  render(); renderWishInputs();
});
$('confirmOnce').addEventListener('change', renderApplySummary);
$('extraWish').addEventListener('change', renderWishInputs);
$('kindBox').addEventListener('change', () => { kindTouched = true; renderWishInputs(); });
$('f').addEventListener('input', () => { if (!$('applyForm').hidden) renderWishInputs(); });
$('f').addEventListener('change', () => { if (!$('applyForm').hidden) renderWishInputs(); });

$('applyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = validate();
  if (err) { $('submitMsg').textContent = err; return; }
  const r = currentCalc();
  const k = kind();
  $('btnSubmit').disabled = true;
  const { error } = await sb.from('gwannae_applications').insert({
    cycle: CYCLE, district: DISTRICT,
    current_school: $('curSchool').value,
    wishes: readWishes(),
    is_expired: k.tier > 0, tier: k.tier,
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
