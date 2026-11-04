const DCFG = {
  key: 'paju', name: '파주',
  tag: '2027학년도 파주 관내전보 세부원칙 · 63차 개정',
  intro: '파주 안에서 학교를 옮길 때 쓰는 전보년수(현임교 근무년수 + 가산년수)를 계산해요. 2027학년도 파주 세부원칙의 가산표를 따랐어요.',
  basis: '경기도파주교육지원청교육공무원인사관리세부원칙(유치원, 초등) 2027학년도판(63차, 2026.8.24.) 제5·6·7·8·9·12조와 가산표. 학교·구역은 2027학년도 도 세부기준(안) 별표1.',
  zoneNote: '파주는 급지마다 지역가산이 달라요. 갑 50%(2017.3.1. 이후 근무), 을 가·나 40%, 을 다 50%, 병 가·나 20%, 병 다 30%, 병 라 40%예요.',
  gapHint: '10년이면 갑 만기(관내 내신 불가). 다른 지원청에서 근무한 갑구역 기간은 넣지 않아요.',
  groupBy: 'label',
  schools: [
    ...schoolList('파주송화 운광 한가람 한빛 해솔 동패 두일 문발 석곶 와석 지산 청석 청암 파주와동 가온 금화 금릉 금향 새금 운정 산내 산들 초롱 다율 별하람 운정해오름', { label: '갑', rate: 0.5 }),
    ...schoolList('도마산 신산 영도 용미 월롱 갈현', { zone: 'eul', label: '을 가', rate: 0.4 }),
    ...schoolList('봉일천 파주대원 덕암 능안 천현 교하 문산 문산동 자유 심학 임진 파주 검산', { zone: 'eul', label: '을 나', rate: 0.4 }),
    ...schoolList('금촌 금신 청미르 숲노을 물향기 운정중앙', { zone: 'eul', label: '을 다', rate: 0.5 }),
    ...schoolList('대성동', { zone: 'byeong', label: '병 가', rate: 0.2 }),
    ...schoolList('마정 탄현 삼성 장파 군내 통일', { zone: 'byeong', label: '병 나', rate: 0.2 }),
    ...schoolList('파평 용연 마지 적서', { zone: 'byeong', label: '병 다', rate: 0.3 }),
    ...schoolList('파양 연풍 웅담 적암', { zone: 'byeong', label: '병 라', rate: 0.4 }),
  ],
  small: [],
  hide: ['bokSik', 'damunhwa', 'neulbomMonths'],
  labels: { weeMonths: '특수교육지원센터·Wee센터' },
  hints: { bujangFull: '1년에 3월(2017.3.1.~), 6월~1년 미만 2월(2018.3.1.~). 갑구역 1년 1월은 2015.3.1. 경력부터 미인정' },
  hyeoksin: [
    { text: '2017학년도 이전 지정 (30%, 3년 이상)', short: '2017 이전 지정', rate: 0.3, min: 36 },
    { text: '2017~2020학년도 지정 (20%, 1년 이상)', short: '2017~2020 지정', rate: 0.2, min: 12 },
  ],
  extra: [
    ...TEACH_PCT,
    { id: 'bokSikPJ', type: 'pct', label: '복식학급 담당', short: '복식학급', hint: '을·병구역, 30%. 개월로 넣어요', rate: 0.3 },
    { id: 'sport1', type: 'pct', label: '체육지도 도 단위 1등급', short: '체육지도(도 1등급)', hint: '직접 지도 기간, 30% (2007.3.1. 이후, 경기도학생체육대회·소년체전 1차평가)', rate: 0.3 },
    { id: 'sport2', type: 'pct', label: '체육지도 도 단위 2등급', short: '체육지도(도 2등급)', hint: '직접 지도 기간, 20%', rate: 0.2 },
    { id: 'sport3', type: 'pct', label: '체육지도 전국 1~3등급', short: '체육지도(전국)', hint: '직접 지도 기간, 50% (전국소년체전)', rate: 0.5 },
    { id: 'research50', type: 'pct', label: '연구·시범 주무(담당) 교육감 표창', short: '연구·시범 교육감 표창', hint: '유공기간 근무년수 50%', rate: 0.5 },
    { id: 'research40', type: 'pct', label: '연구·시범 주무(담당) 교육장 표창', short: '연구·시범 교육장 표창', hint: '유공기간 근무년수 40%', rate: 0.4 },
  ],
  awards: AW4,
  kindHint: '현임교 동일교 근무기간(갑·을 5년, 병 가·나 3년, 병 다 4년, 병 라 5년)이 끝나면 만기전보예요. 파주는 58세 이상·유공교원(우대)을 먼저, 그다음 일반전보자를 전보년수 순으로 배정해요.',
  kinds: [
    { id: 'normal', tier: 0, short: '일반전보', label: '일반전보 (1희망)', wishes: 1, hint: '일반전보는 1희망만 써요. 밀리면 잔류해요.' },
    { id: 'expired', tier: 1, short: '만기전보', label: '동일교·구역 만기전보 (1~3희망)', wishes: 3, hint: '만기자 희망 수는 원문에 숫자가 없어 3희망까지 받아요. 병 가·나 만기자는 병 라 학교만 희망할 수 있어요. 끝까지 경합하면 급지와 관계없이 임의 전보돼요.' },
  ],
  validate({ cur, wishes, k, schoolOf }) {
    const c = schoolOf(cur) || {};
    if (k.tier === 1 && (c.label === '병 가' || c.label === '병 나') && wishes.some(w => (schoolOf(w) || {}).label !== '병 라'))
      return '병 가·나 만기자는 병 라 학교(파양·연풍·웅담·적암)만 희망할 수 있어요.';
    return null;
  },
  order: 'merged',
  lastNormal: '마지막 희망이에요. 여기서 밀리면 잔류해요.',
  lastExpired: '마지막 희망이에요. 여기서도 밀리면 급지와 관계없이 임의 전보돼요.',
};
