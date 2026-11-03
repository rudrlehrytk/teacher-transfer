const GH_CITY = {}; // 학교 → 광주/하남
const ghList = (names, city, o) => schoolList(names, o).map(s => (GH_CITY[s.name] = city, s));
const DCFG = {
  key: 'gwangjuhanam', name: '광주하남',
  tag: '광주하남 관내전보 세부원칙 2026학년도판 · 55차 개정 (2027판 미확보)',
  intro: '광주·하남 안에서 학교를 옮길 때 쓰는 전보년수(현임교 근무년수 + 가산년수)를 계산해요. 2027판 원칙을 아직 못 구해서 2026학년도 광주하남 세부원칙의 가산표를 따랐고, 학교 목록은 2027 도 기준안 별표로 맞췄어요.',
  basis: '경기도광주하남교육공무원인사관리세부원칙(유치원, 초등) 2026학년도판(55차, 2025.7.30.) 제7·8·10·13조와 가산표. 학교·구역은 2027학년도 도 세부기준(안) 별표1.',
  zoneNote: '광주하남은 구역 가산이 없고, 지정 학교(도척·만선·경안·산곡·서부)만 해당교 3년 이상 근무하면 현임교 근무년수 30%예요. 갑·을 모두 10년이 근무 상한이에요.',
  gapHint: '10년이면 갑 만기(관내 내신 불가). 을구역도 10년이 상한이에요.',
  groupBy: 'label',
  schools: [
    ...ghList('광주 역동 광남 태전 쌍령 탄벌 벌원 태성 한아람 광주푸른 광주송정 고산하늘 능평 고산별빛', '광주', { label: '광주 갑' }),
    ...ghList('오포 광주광명 광주매곡 초월 선동 도곡 도궁 곤지암 도수 분원 남한산 광지원 번천 삼리 양벌 광주도평 신현 쌍동', '광주', { zone: 'eul', label: '광주 을' }),
    ...ghList('도척 만선 경안', '광주', { zone: 'eul', label: '광주 을·가산교(3년 이상 30%)', rate: 0.3 }),
    ...ghList('동부 신장 덕풍 하남천현 하남 창우 신평 하남풍산 나룰 미사강변 미사 미사중앙 위례 윤슬 한홀 청아 망월 감일 위례숲 신우 단샘', '하남', { label: '하남 갑' }),
    ...ghList('산곡 서부', '하남', { zone: 'eul', label: '하남 을·가산교(3년 이상 30%)', rate: 0.3 }),
  ].map(s => (s.rate ? { ...s, minMonths: 36 } : s)),
  small: [],
  hide: ['neulbomMonths'],
  labels: { weeMonths: '특수교육지원센터·Wee센터' },
  hints: { bujangFull: '갑 2007.3.1.~, 갑·을 2017.3.1.~ 1년에 4월 (6월~1년 미만 가산 없음)' },
  yearlyRates: { bujang: [4, 0] },
  extra: [
    ...TEACH_PCT,
    { id: 'neulbomGH', type: 'pct', label: '늘봄전담실장', short: '늘봄전담실장', hint: '2025~2026년 임용자가 임기 후 복귀, 2027.3.1.~, 70%', rate: 0.7 },
    { id: 'coupleGH', type: 'pct', label: '부부교원·부부공무원', short: '부부(광주↔하남 이동)', hint: '광주→하남, 하남→광주로 옮길 때만. 해당하면 현임교 근무 개월 수를 넣으세요, 30%', rate: 0.3 },
  ],
  awards: AW4,
  kindHint: '현임교 5년이면 동일교 만기전보예요. 동일교 만기자를 일반전보자보다 먼저 배정해요.',
  kinds: [
    { id: 'normal', tier: 0, short: '일반전보', label: '일반전보 (1희망)', wishes: 1, hint: '희망 학교 수는 경기형 인사시스템 개통 이후 정해져 원문에 없어서, 일반전보는 1희망으로 받아요. 밀리면 잔류해요.' },
    { id: 'expired', tier: 1, short: '만기전보', label: '동일교 만기전보 (1~3희망)', wishes: 3, hint: '희망 학교 수가 원문에 없어 종전처럼 3희망까지 받아요. 일반전보자보다 먼저 배정되고, 끝까지 경합하면 생활근거지를 고려해 임의 전보될 수 있어요.' },
  ],
  validate({ cur, wishes, r }) {
    if (r.items.some(i => i.label.startsWith('부부')) && wishes.some(w => GH_CITY[w] === GH_CITY[cur]))
      return '부부 가산은 광주↔하남으로 옮길 때만 붙어요. 같은 시 학교를 희망하면 부부 칸을 0으로 해 주세요.';
    return null;
  },
  order: 'expiredFirst',
  lastNormal: '마지막 희망이에요. 여기서 밀리면 잔류해요.',
  lastExpired: '마지막 희망이에요. 여기서도 밀리면 생활근거지를 고려해 임의 전보될 수 있어요.',
};
