// 학교 목록 도우미: 이름 뒤에 '초'를 붙인다(분교장·가칭은 그대로)
function schoolList(names, o) {
  return names.split(/[,\s]+/).filter(Boolean).map(n => ({
    name: /분교장|\(가칭\)/.test(n) ? n : n + '초', zone: o.zone || 'gap', rate: o.rate || 0, label: o.label || '', group: o.group || '',
  }));
}
const AW4 = [{ label: '총리 이상', months: 4 }, { label: '장관', months: 3 }, { label: '교육감', months: 2 }, { label: '교육장', months: 1 }];
const AW3 = [{ label: '장관 이상', months: 3 }, { label: '교육감', months: 2 }, { label: '교육장', months: 1 }];
const TEACH_PCT = [
  { id: 'subjMonths', type: 'pct', label: '교과전담 (체육 외)', short: '교과전담(체육 외)', hint: '2018.2.까지 경력만, 30%', rate: 0.3 },
  { id: 'peMonths', type: 'pct', label: '체육교과전담', hint: '2014.3.~2018.2. 경력, 50%', rate: 0.5 },
  { id: 'afterMonths', type: 'pct', label: '방과후학교 업무담당', short: '방과후학교 업무담당', hint: '2018.2.까지 경력만, 30%', rate: 0.3 },
];
