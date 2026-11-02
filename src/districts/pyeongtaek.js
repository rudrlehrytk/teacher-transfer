const PT_HAPDONG = ['부용', '효덕', '갈곶', '현화', '평택송화', '평택안일', '현일', '진위', '청옥'].map(s => s + '초'); // 경합학교 9교
const DCFG = {
  key: 'pyeongtaek', name: '평택',
  tag: '2027 평택 관내전보 세부원칙 · 43차 개정',
  intro: '평택 안에서 학교를 옮길 때 쓰는 전보년수(현임교 근무년수 + 가산년수)를 계산해요. 2027 평택 세부원칙의 가산표를 따랐어요.',
  basis: '2027 경기도평택교육지원청 교육공무원 인사관리세부원칙(유치원, 초등) 제7·8·11·14조와 가산표.',
  zoneNote: '평택은 갑구역 41교(가산 없음), 을구역 32교(현임교 근무년수 50%)예요. 을구역 중 9교는 경합학교라 경합학교끼리는 전보할 수 없어요.',
  gapHint: '10년이면 갑 만기. 만기까지 2년 미만 남았으면(8년 이상) 갑구역 학교로 낼 수 없어요.',
  groupBy: 'label',
  schools: [
    ...schoolList('평택성동 평택중앙 평택 평일 비전 합정 덕동 서정리 송북 송신 복창 지장 평택지산 세교 소사벌 이충 송일 군문 동삭 장당 반지 송현 용이 자란 현촌 평택이화 가내 평택서재 용죽 세아 평택새빛 종덕 평택대동 평택모산 지제 배다리 고덕 율포 해창 민세 평택영신', { label: '갑구역' }),
    ...schoolList('죽백 송탄 계성 서탄 오성 창신 안중 청북 어연 삼덕 현덕 내기 원정 홍원 가사 평택도곡 평택청아 고덕함박 평택연화 평택화양 가재 평안 팽성', { zone: 'eul', label: '을구역', rate: 0.5 }),
    ...schoolList('부용 효덕 갈곶 현화 평택송화 평택안일 현일 진위 청옥', { zone: 'eul', label: '을구역·경합학교', rate: 0.5 }),
  ],
  small: [{ label: '5학급 이하 학교·분교장 (30%)', rate: 0.3, short: '5학급 이하·분교장' }],
  smallHint: '분교장(산대·내수·광덕) 근무자도 여기서 골라요',
  hide: ['neulbomMonths'],
  labels: { weeMonths: '특수교육순회교사·Wee센터' },
  exclusionHint: '현임교 근무년수에서 빠져요. 휴가는 포함. 전보 유예로 더 근무한 기간도 여기에 넣어 빼 주세요(유예 중 표창도 빼요).',
  extra: [
    ...TEACH_PCT,
    { id: 'neulbomPT', type: 'pct', label: '늘봄전담실장', short: '늘봄전담실장', hint: '2025~2026년 임용자가 임기 후 복귀, 2027.3.1.~, 100%', rate: 1.0 },
  ],
  awards: AW4,
  kindHint: '현임교 5년이면 만기전보예요. 만기전보자를 일반전보자보다 먼저 배정해요.',
  kinds: [
    { id: 'normal', tier: 0, short: '일반전보', label: '일반전보 (1희망)', wishes: 1, hint: '일반전보는 1희망만 써요. 밀리면 잔류해요.' },
    { id: 'expired', tier: 1, short: '만기전보', label: '만기전보 (현임교 5년, 1~3희망)', wishes: 3, hint: '만기전보는 1~3희망까지 써요. 일반전보자보다 먼저 배정되고, 희망교가 다 경합되면 다른 학교로 전보돼요.' },
  ],
  validate({ cur, wishes, r, schoolOf }) {
    if (PT_HAPDONG.includes(cur) && wishes.some(w => PT_HAPDONG.includes(w) && w !== cur)) return '경합학교에서는 다른 경합학교(부용·효덕·갈곶·현화·평택송화·평택안일·현일·진위·청옥)로 전보할 수 없어요.';
    if (r.gapMonths !== undefined && r.gapMonths >= 96 && !r.gapExpired && wishes.some(w => (schoolOf(w) || {}).zone === 'gap'))
      return '갑구역 만기까지 2년 미만 남아서 갑구역 학교로는 낼 수 없어요. 을구역 학교를 골라 주세요.';
    return null;
  },
  order: 'expiredFirst', // 사용자 확인(2026-11-02): 만기자 우선 배정
  lastNormal: '마지막 희망이에요. 여기서 밀리면 잔류해요.',
  lastExpired: '마지막 희망이에요. 여기서도 밀리면 다른 학교로 전보돼요.',
};
