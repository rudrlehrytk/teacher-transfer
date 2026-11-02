const DCFG = {
  key: 'gwangmyeong', name: '광명',
  tag: '2027학년도 광명 관내전보 세부원칙 · 53차 개정',
  intro: '광명 안에서 학교를 옮길 때 쓰는 전보년수(현임교 근무년수 + 가산년수)를 계산해요. 2027학년도 광명 세부원칙의 가산표를 따랐어요.',
  basis: '2027학년도 경기도광명교육공무원인사관리세부원칙(유치원, 초등) 제6·7·8·9·12조와 가산표.',
  zoneNote: '광명은 갑구역 23교(가산 없음), 을구역 2교(안서·온신, 현임교 근무년수 50%)예요. 을구역 학교끼리는 전보할 수 없고, 을구역에서 갑구역으로 가면 만기자로 처리돼요.',
  gapHint: '10년이면 갑 만기(관내 내신 불가). 다른 지원청에서 근무한 갑구역 기간은 넣지 않아요.',
  groupBy: 'label',
  schools: [
    ...schoolList('광명 광명광성 도덕 광명남 광명북 광명광덕 광일 광명동 철산 광명서 하안 하안북 가림 연서 하안남 광문 하일 소하 서면 안현 구름산 충현 빛가온', { label: '갑구역' }),
    ...schoolList('안서 온신', { zone: 'eul', label: '을구역', rate: 0.5 }),
  ],
  small: [],
  hide: ['silseup', 'damunhwa', 'neulbomMonths'],
  labels: { weeMonths: '특수교육순회교사(교육지원청)·Wee센터' },
  hints: { bujangFull: '1년에 3월, 6월~1년 미만 2월 (교무·연구부장 1년 6월은 2027.3.1. 이후 경력부터라 이번 전보엔 해당 없음)' },
  hyeoksin: [
    { text: '2017학년도 이전 지정 (100%, 3년 이상)', short: '2017 이전 지정', rate: 1, min: 36 },
    { text: '2017~2020학년도 지정 (50%, 3년 이상)', short: '2017~2020 지정', rate: 0.5, min: 36 },
  ],
  extra: TEACH_PCT,
  awards: AW4,
  kindHint: '현임교 5년이면 만기전보예요. 을구역(안서·온신)에서 갑구역으로 가는 경우도 만기전보로 내요. 학교별로 우대 → 만기 → 일반 순으로 배정해요.',
  kinds: [
    { id: 'normal', tier: 0, short: '일반전보', label: '일반전보 (1희망)', wishes: 1, hint: '일반전보는 1희망만 써요. 밀리면 잔류해요.' },
    { id: 'expired', tier: 1, short: '만기전보', label: '만기전보 (현임교 5년 또는 을→갑, 4희망까지)', wishes: 4, hint: '만기전보는 4희망까지 써요. 일반전보자보다 먼저 배정돼요.' },
  ],
  validate({ cur, wishes, k, schoolOf }) {
    if ((schoolOf(cur) || {}).zone !== 'eul') return null;
    if (wishes.some(w => (schoolOf(w) || {}).zone === 'eul')) return '을구역 학교(안서·온신)끼리는 전보할 수 없어요.';
    if (k.tier === 0) return '을구역에서 갑구역으로 가면 만기자로 처리돼요. 내신 구분을 만기전보로 골라 주세요.';
    return null;
  },
  order: 'priorityFirst',
  lastNormal: '마지막 희망이에요. 여기서 밀리면 잔류해요.',
  lastExpired: '마지막 희망이에요. 여기서도 밀리면 다른 학교로 배정될 수 있어요.',
};
