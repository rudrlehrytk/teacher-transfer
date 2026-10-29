// 경기 시·군간(관외) 전보년수 계산 — 2026학년도 도 세부기준(66차, 2025.7.14.)
// 근거 조항은 각 줄 주석 참고.

function parseDate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3] };
}

// start(포함) ~ end(불포함) 사이를 {months, days}로. 달력 월 기준.
function diffMD(a, b) {
  let months = (b.y - a.y) * 12 + (b.m - a.m);
  let days = b.d - a.d;
  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(b.y, b.m - 1, 0).getDate();
    days += prevMonthDays;
  }
  if (months < 0) return { months: 0, days: 0 };
  return { months, days };
}

function addDay(d) {
  const t = new Date(d.y, d.m - 1, d.d + 1);
  return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() };
}

function cmp(a, b) {
  return (a.y - b.y) || (a.m - b.m) || (a.d - b.d);
}

// 현임교 근무기간: 발령일~기준일(전보일 전날까지), 휴직·파견 제외 (13조⑥)
function serviceMD(start, ref, exclusions) {
  let { months, days } = diffMD(start, ref);
  for (const ex of exclusions || []) {
    const s = parseDate(ex.start), e = parseDate(ex.end);
    if (!s || !e || cmp(e, s) < 0) continue;
    const x = diffMD(s, addDay(e));
    months -= x.months;
    days -= x.days;
  }
  while (days < 0) { months -= 1; days += 30; }
  while (days >= 30) { months += 1; days -= 30; }
  if (months < 0) { months = 0; days = 0; }
  return { months, days };
}

// 15일 이상 1월, 미만 버림 (13조⑥)
function roundMonths(md) {
  return md.months + (md.days >= 15 ? 1 : 0);
}

const REGION_RATE = { gap: 0, eul: 0.5, byeongDaRa: 0.7, byeongGaNa: 1.0 }; // 지역가산표
const SMALL_RATE = 0.3; // 5학급 이하·분교장

function calc(input) {
  const ref = parseDate(input.refDate);
  const start = parseDate(input.startDate);
  const out = { items: [], warnings: [], errors: [] };
  if (!ref || !start) { out.errors.push('전보일과 현임교 발령일을 입력하세요.'); return out; }
  if (cmp(start, ref) >= 0) { out.errors.push('현임교 발령일이 전보일보다 늦습니다.'); return out; }

  const md = serviceMD(start, ref, input.exclusions);
  const rawMonths = roundMonths(md);
  out.serviceMD = md;
  out.eligible = md.months >= 24; // 2년 이상(하루라도 부족 시 내신 불가)
  out.sameSchoolExpired = md.months >= 60;
  const base = Math.min(rawMonths, 60); // 5년 상한
  out.baseMonths = base;
  out.baseCapped = rawMonths > 60;

  const add = (label, months, basis) => {
    const m = Math.max(0, Math.floor(months + 1e-9));
    if (m > 0) out.items.push({ label, months: m, basis });
  };
  const capM = (v) => Math.min(Math.max(+v || 0, 0), base);

  // 지역가산 (16조③ 지역가산표) — 구역 비율과 5학급 이하 30% 중 큰 값 1개
  // 지원청별로 학교마다 비율을 줄 수 있다(input.regionRate/regionLabel, input.smallRate/smallLabel)
  const zr = input.regionRate !== undefined ? input.regionRate : (REGION_RATE[input.zone] ?? 0);
  const sr = input.smallSchool ? (input.smallRate ?? SMALL_RATE) : 0;
  const rate = Math.max(zr, sr);
  if (rate > 0) {
    const name = { eul: '을구역', byeongDaRa: '병구역 다·라', byeongGaNa: '병구역 가·나' }[input.zone];
    const label = sr > zr ? `지역가산(${input.smallLabel || '5학급 이하·분교장'})` : `지역가산(${input.regionLabel || name})`;
    const pctTxt = Math.abs(rate * 12 - Math.round(rate * 12)) < 1e-9 && Math.round(rate * 100) !== rate * 100
      ? `1년당 ${Math.round(rate * 12)}월` : `${Math.round(rate * 100)}%`;
    add(label, base * rate, `현임교 ${base}개월 × ${pctTxt}`);
  }

  // 업무가산 — 비율형
  const pct = [
    ['bokSik', '복식학급 담당', 0.3, () => input.zone === 'gap' || input.zone === 'eul'],
    ['sunhoe', '순회담당(특수·전문상담)', 0.3],
    ['tonghap', '통합학급', 0.3],
  ];
  for (const [k, label, r, ok] of pct) {
    const v = capM(input[k]);
    if (!v) continue;
    if (ok && !ok()) { out.warnings.push(`${label} 가산은 갑·을구역만 해당돼 빠졌습니다.`); continue; }
    add(label, v * r, `${v}개월 × ${r * 100}%`);
  }
  // 지원청별 추가 비율 가산(수원: 체육교과전담 50%, 소음피해학교 50% 등) — [{label, months, rate}]
  for (const e of input.extraPct || []) {
    const v = capM(e.months);
    if (v) add(e.label, v * e.rate, `${v}개월 × ${Math.round(e.rate * 100)}%`);
  }
  const wee = Math.min(Math.max(+input.weeMonths || 0, 0), 60);
  if (wee) add('특수교육지원센터·Wee센터', wee, `${wee}개월 × 100%`);

  // 업무가산 — 1년 단위형 (1년에 3월, 6월~1년 미만 2월)
  const yearly = [
    ['bujang', '부장교사'],
    ['grade6', '6학년 담임'],
    ['big43', '보건·사서·전문상담 43학급 이상'],
  ];
  const YR = input.yearlyRates || {}; // 지원청별 1년·6월 단위 월수 (성남 부장 6월/4월 등)
  for (const [k, label] of yearly) {
    const full = Math.max(0, Math.floor(+input[k + 'Full'] || 0));
    const half = Math.max(0, Math.floor(+input[k + 'Half'] || 0));
    const [fm, hm] = YR[k] || [3, 2];
    if (full || half) add(label, full * fm + half * hm, `1년 ${full}회 × ${fm}월 + 6월~1년 미만 ${half}회 × ${hm}월`);
  }
  // 지원청별 고정 월수 가산 [{label, months, basis}]
  for (const e of input.extraFixed || []) if (e.months > 0) add(e.label, e.months, e.basis);
  if (+input.yearsTotal > 5) out.warnings.push('1년 단위 경력 합계가 현임교 근무년수보다 깁니다. 현임교 경력만 인정됩니다.');

  const silseup = Math.max(0, Math.floor(+input.silseup || 0));
  const silRate = input.silseupPerYear || 1; // 도 1년 1월, 수원 1년 3월
  if (silseup) add('교육실습학교 직접 지도', silseup * silRate, `${silseup}년 × ${silRate}월`);
  const damunhwa = Math.max(0, Math.floor(+input.damunhwa || 0));
  if (damunhwa) add('다문화특별학급 담임', damunhwa, `${damunhwa}년 × 1월`);

  // 혁신학교
  const hm = capM(input.hyeoksinMonths);
  const HR = input.hyeoksinRule; // 지원청별 혁신학교 규칙 {label, rate, min}
  if (HR) {
    if (hm && hm >= HR.min) add(`혁신학교(${HR.label})`, hm * HR.rate, `${hm}개월 × ${Math.round(HR.rate * 100)}%`);
    else if (hm) out.warnings.push(`혁신학교(${HR.label}) 가산은 지정 후 ${HR.min / 12}년 이상 근무해야 합니다.`);
  } else if (hm && input.hyeoksin === 'before2017') {
    if (hm >= 36) add('혁신학교(2017 이전 지정)', hm, `${hm}개월 × 100%`);
    else out.warnings.push('혁신학교(2017 이전 지정) 가산은 지정 후 3년 이상 근무해야 합니다.');
  } else if (hm && input.hyeoksin === '2017to2020') {
    if (hm >= 12) add('혁신학교(2017~2020 지정)', hm * 0.5, `${hm}개월 × 50%`);
    else out.warnings.push('혁신학교(2017년 이후 지정) 가산은 지정 후 1년 이상 근무해야 합니다.');
  }

  // 늘봄전담실장 (2027학년도부터)
  const nb = Math.max(0, +input.neulbomMonths || 0);
  if (nb) {
    if (cmp(ref, { y: 2027, m: 3, d: 1 }) >= 0) add('늘봄전담실장 경력', nb * 0.5, `${nb}개월 × 50%`);
    else out.warnings.push('늘봄전담실장 가산은 2027.3.1.자 전보부터 적용됩니다.');
  }

  // 기타가산
  if (input.couple) {
    if (input.spouseRegion && input.wishRegion && input.spouseRegion === input.wishRegion) {
      add('부부공무원', base * 0.3, `현임교 ${base}개월 × 30%`);
    } else {
      out.warnings.push('부부 가산은 배우자가 근무하는 시·군을 희망할 때만 붙습니다.');
    }
  }
  const kid = input.threeKids ? 0.5 : 0, baby = input.twoInfants ? 0.5 : 0;
  if (kid || baby) {
    const label = kid ? '세 자녀 이상' : '영유아 2명(7세 이하)';
    add(label, base * 0.5, `현임교 ${base}개월 × 50%`);
    if (kid && baby) out.warnings.push('세 자녀와 영유아 가산은 중복되지 않아 1개(50%)만 넣었습니다.');
  }
  const pm = Math.max(0, Math.floor(+input.awardPM || 0));
  const mn = Math.max(0, Math.floor(+input.awardMinister || 0));
  const sp = Math.max(0, Math.floor(+input.awardSupt || 0));
  // 3월·2월·1월 단계의 이름은 기준마다 다르다(도: 총리↑/장관/교육감, 안양과천: 장관↑/교육감/교육장)
  const AL = input.awardLabels || ['총리↑', '장관', '교육감'];
  if (input.awardTiers) { // 지원청별 표창 단계 [{label, count, months}] (수원: 총리4/장관3/교육감2/교육장1)
    const t = input.awardTiers.map(a => ({ ...a, count: Math.max(0, Math.floor(+a.count || 0)) }));
    const sum = t.reduce((s, a) => s + a.count * a.months, 0);
    if (sum) add('표창', sum, t.filter(a => a.count).map(a => `${a.label} ${a.count}건×${a.months}월`).join(', '));
  } else if (pm || mn || sp) add('표창', pm * 3 + mn * 2 + sp, `${AL[0]} ${pm}건×3월, ${AL[1]} ${mn}건×2월, ${AL[2]} ${sp}건×1월`);

  out.bonusMonths = out.items.reduce((s, i) => s + i.months, 0);
  if (input.bonusCapPct && out.bonusMonths > Math.floor(base * input.bonusCapPct)) { // 용인: 가산 합계 ≤ 근무년수 100%
    const cap = Math.floor(base * input.bonusCapPct);
    out.warnings.push(`가산년수 합계가 현임교 근무년수의 ${Math.round(input.bonusCapPct * 100)}%를 넘어 ${cap}개월로 줄였습니다.`);
    out.items.push({ label: '가산 상한 적용', months: cap - out.bonusMonths, basis: `현임교 ${base}개월 × ${Math.round(input.bonusCapPct * 100)}%까지만` });
    out.bonusMonths = cap;
  }
  out.totalMonths = base + out.bonusMonths;

  // 갑구역 만기 (10조①2) — 현 지원청 갑구역 근무 10년
  const gs = parseDate(input.gapStart);
  if (input.zone === 'gap' && gs && cmp(gs, ref) < 0) {
    const g = roundMonths(diffMD(gs, ref));
    out.gapMonths = g;
    out.gapExpired = g >= 120 && !input.gapExempt;
  }
  out.wishCount = out.gapExpired ? '1~4희망' : '1희망';
  return out;
}

function fmtYM(months) {
  const y = Math.floor(months / 12), m = months % 12;
  return `${y}년 ${m}월`;
}

if (typeof module !== 'undefined') module.exports = { calc, fmtYM, serviceMD, diffMD, parseDate };
