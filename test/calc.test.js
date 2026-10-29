const { calc, fmtYM } = require('../src/calc.js');
const assert = (c, msg) => { if (!c) { console.error('FAIL', msg); process.exitCode = 1; } else console.log('ok', msg); };

// 1. 을구역 5년 근무, 부장 2회, 6학년 1회
let r = calc({ refDate: '2027-03-01', startDate: '2022-03-01', zone: 'eul', bujangFull: 2, grade6Full: 1 });
assert(r.baseMonths === 60, 'base 60 ' + r.baseMonths);
assert(r.items.find(i => i.label.startsWith('지역')).months === 30, 'region 30');
assert(r.bonusMonths === 30 + 6 + 3, 'bonus 39 ' + r.bonusMonths);
assert(fmtYM(r.totalMonths) === '8년 3월', 'total ' + fmtYM(r.totalMonths));

// 2. 갑, 3년 7개월 20일 + 휴직 6개월 → 3년 2월
r = calc({ refDate: '2027-03-01', startDate: '2023-07-10', zone: 'gap', exclusions: [{ start: '2024-03-01', end: '2024-08-31' }] });
console.log(r.serviceMD, r.baseMonths);
assert(r.baseMonths === 38, 'base 38 (3년7월19일 - 6월 = 3년1월19일→3년2월)');
assert(r.bonusMonths === 0, 'gap no region bonus');

// 3. 2년 미만 하루 부족
r = calc({ refDate: '2027-03-01', startDate: '2025-03-02', zone: 'eul' });
assert(r.eligible === false, 'ineligible by 1 day');
r = calc({ refDate: '2027-03-01', startDate: '2025-03-01', zone: 'eul' });
assert(r.eligible === true, 'eligible exactly 2y');

// 4. 6년 근무 → 5년 상한
r = calc({ refDate: '2027-03-01', startDate: '2021-03-01', zone: 'byeongDaRa' });
assert(r.baseMonths === 60 && r.baseCapped, 'cap');
assert(r.items[0].months === 42, '70% of 60 = 42');

// 5. 부부 + 희망지 일치, 세 자녀
r = calc({ refDate: '2027-03-01', startDate: '2023-03-01', zone: 'gap', couple: true, spouseRegion: '수원', wishRegion: '수원', threeKids: true, awardMinister: 1 });
assert(r.baseMonths === 48, 'base 48');
assert(r.bonusMonths === Math.floor(48 * 0.3) + 24 + 2, 'couple14+kids24+award2 ' + r.bonusMonths);

// 6. 갑 만기
r = calc({ refDate: '2027-03-01', startDate: '2022-03-01', zone: 'gap', gapStart: '2017-03-01' });
assert(r.gapExpired === true && r.wishCount === '1~4희망', 'gap expired');

// 7. 5학급 이하 갑 → 30%
r = calc({ refDate: '2027-03-01', startDate: '2024-03-01', zone: 'gap', smallSchool: true });
assert(r.items[0].months === 10, 'small 36*0.3=10.8→10');

// 수원 관내: 교육실습 1년 3월, 표창 4단계, 추가 비율가산(5년 상한 안에서)
r = calc({ refDate: '2027-03-01', startDate: '2023-03-01', zone: 'gap', silseup: 2, silseupPerYear: 3,
  extraPct: [{ label: '체육교과전담', months: 30, rate: 0.5 }, { label: '소음피해학교', months: 80, rate: 0.5 }],
  awardTiers: [{ label: '총리↑', count: 1, months: 4 }, { label: '장관', count: 0, months: 3 }, { label: '교육감', count: 1, months: 2 }, { label: '교육장', count: 1, months: 1 }] });
assert(r.items.find(i => i.label === '교육실습학교 직접 지도').months === 6, 'suwon silseup 2y×3');
assert(r.items.find(i => i.label === '체육교과전담').months === 15, 'suwon PE 30×50%');
assert(r.items.find(i => i.label === '소음피해학교').months === 24, 'noise capped at base 48 ×50%');
assert(r.items.find(i => i.label === '표창').months === 7, 'awards 4+2+1');

// 특구역→갑구역 전환: 2026.2.28.까지 특구역 5년 이상이면 2026.3.1. 이전 근무·가산 미인정 (수원 안내 예시)
// 가-① 특구역 8년, 2027.3.1. 일반전보: 현임교 1년 + 부장 1년 = 1년 3월
r = calc({ refDate: '2027-03-01', startDate: '2022-03-01', zone: 'gap', gapStart: '2018-03-01', wasTuk: true, bujangFull: 1 });
assert(r.tukReset && r.baseMonths === 12 && fmtYM(r.totalMonths) === '1년 3월', 'tuk 가-① 1년 3월 ' + fmtYM(r.totalMonths));
assert(r.eligible, 'tuk 가-① 실제 근무로 내신 가능');
// 가-② 2028.3.1.: 현임교 2년 + 부장 1년 + 6학년 1년 = 2년 6월
r = calc({ refDate: '2028-03-01', startDate: '2022-03-01', zone: 'gap', gapStart: '2018-03-01', wasTuk: true, bujangFull: 1, grade6Full: 1 });
assert(fmtYM(r.totalMonths) === '2년 6월' && r.gapExpired, 'tuk 가-② 2년 6월, 갑 만기 ' + fmtYM(r.totalMonths));
// 나: 특구역 3년(5년 미만)이면 그대로 인정: 4년 + 부장 2년 + 통합학급 1년(30%) = 4년 9월
r = calc({ refDate: '2027-03-01', startDate: '2023-03-01', zone: 'gap', gapStart: '2023-03-01', wasTuk: true, bujangFull: 2, tonghap: 12 });
assert(!r.tukReset && fmtYM(r.totalMonths) === '4년 9월', 'tuk 나 4년 9월 ' + fmtYM(r.totalMonths));
// 체크 안 하면 적용 안 됨
r = calc({ refDate: '2027-03-01', startDate: '2022-03-01', zone: 'gap', gapStart: '2018-03-01', bujangFull: 1 });
assert(!r.tukReset && r.baseMonths === 60, 'tuk off');
