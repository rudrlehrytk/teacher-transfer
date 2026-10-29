"""페이지를 만든다: index.html(관외), anyang.html(안양과천 관내), suwon.html(수원 관내), gunpo.html(군포의왕 관내)."""
import re, pathlib
root = pathlib.Path(__file__).parent
src = (root / 'src/calculator-base.html').read_text()
calc = (root / 'src/calc.js').read_text().replace(
    "if (typeof module !== 'undefined') module.exports = { calc, fmtYM, serviceMD, diffMD, parseDate };", "")
extra_css = (root / 'src/extra.css').read_text()

style = re.search(r'<style>(.*?)</style>', src, re.S).group(1)
body = src.split('</style>', 1)[1]
base_html, script = body.split('<script>', 1)
script = script.rsplit('</script>', 1)[0]
ui = script[script.index('const REGIONS'):]  # 계산기 화면 스크립트(계산 로직 제외)

PAGES = [  # (key, 파일, 메뉴 이름)
    ('gwanoe', './', '관외전보 (시·군간)'),
    ('anyang', './anyang.html', '안양과천'),
    ('suwon', './suwon.html', '수원'),
    ('gunpo', './gunpo.html', '군포의왕'),
    ('seongnam', './seongnam.html', '성남'),
    ('goyang', './goyang.html', '고양'),
    ('yongin', './yongin.html', '용인'),
    ('hwaseong', './hwaseong.html', '화성오산'),
    ('bucheon', './bucheon.html', '부천'),
]
def nav(current):
    links = '\n'.join(f'  <a href="{href}"{' aria-current="page"' if key == current else ''}>{label}</a>' for key, href, label in PAGES)
    return f'<nav class="pages" aria-label="모의지원 종류">\n{links}\n</nav>'

NAV_CSS = '''
.pages { display: flex; gap: 6px; flex-wrap: wrap; }
.pages a { font-size: 0.85rem; padding: 5px 12px; border-radius: 999px; border: 1px solid var(--line); color: var(--ink); text-decoration: none; background: var(--paper); }
.pages a[aria-current="page"] { background: var(--accent); color: var(--paper); border-color: var(--accent); }
'''

def page(out, title, h1, desc, part, js, current, pre=(), part_vars=None):
    html_body = base_html.replace('<h1>경기 관외전보 점수 계산기</h1>', f'<h1>{h1}</h1>')
    html_body = html_body.replace(
        '<p>입력한 값은 이 화면에서만 쓰고 어디에도 저장하지 않아요.</p>',
        '<p>점수 계산은 이 화면에서만 해요. 모의 지원을 하면 점수(개월 수), 현재 근무지, 희망지, 만기·우대 여부만 저장돼요.</p>')
    navh = nav(current)
    html_body = html_body.replace('<header>', '<header>\n    ' + navh, 1)
    idx = html_body.rstrip().rfind('</div>')
    part_html = (root / part).read_text()
    for k, v in (part_vars or {}).items(): part_html = part_html.replace('{{' + k + '}}', v)
    html_body = html_body[:idx] + part_html + html_body[idx:]
    pre_js = '\n'.join((root / f).read_text() for f in pre)
    html = f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">
<style>
{style}
{extra_css}
{NAV_CSS}
</style>
</head>
<body>
{html_body}
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<script>
{pre_js}
{calc}
{ui}
{(root / js).read_text()}
</script>
</body>
</html>
'''
    (root / out).write_text(html)
    print('built', out, len(html))

page('index.html', '경기 관외전보 모의지원', '경기 관외전보 점수 계산·모의지원',
     '경기도 시·군간(관외) 전보 전보년수를 계산하고 모의 지원으로 희망 시·군 순위를 확인해요.',
     'src/app-part.html', 'src/app.js', 'gwanoe')
page('anyang.html', '안양과천 관내전보 모의지원', '안양과천 관내전보 점수 계산·모의지원',
     '안양과천 관내 초등 전보 전보년수를 계산하고 모의 지원으로 희망 학교 순위를 확인해요.',
     'src/gwannae-part.html', 'src/gwannae.js', 'anyang')
page('suwon.html', '수원 관내전보 모의지원', '수원 관내전보 점수 계산·모의지원',
     '수원 관내 초등 전보 전보년수를 계산하고 모의 지원으로 희망 학교 순위를 확인해요.',
     'src/suwon-part.html', 'src/suwon.js', 'suwon')
page('gunpo.html', '군포의왕 관내전보 모의지원', '군포의왕 관내전보 점수 계산·모의지원',
     '군포의왕 관내 초등 전보 전보년수를 계산하고 모의 지원으로 희망 학교 순위를 확인해요.',
     'src/gunpo-part.html', 'src/gunpo.js', 'gunpo')

# 설정형 관내 페이지 (src/district.js + src/districts/<key>.js)
DISTRICTS = {
    'seongnam': ('성남', '국가유공자 등, 정책연구·시범학교 교육감 이상 표창, 중증장애 본인·가족 부양, 경기교육대상·대한민국 공무원상',
                 '성남은 만기전보자를 일반전보자보다 먼저 배정하고, 같은 구분 안에서는 우대 대상자 → 총 전보년수 순이에요. 동점이면 생년월일 → 교육 총경력 순인데 이 값은 받지 않아서 "동점"으로만 표시해요. 희망 학교 수는 경기형 인사시스템 개통 이후 정해져 원문에 없어서, 2025판처럼 3희망까지 받았어요.'),
    'goyang': ('고양', '58세 이상, 국가유공자 등, 정책연구·시범학교 교육감 이상 표창, 중증장애 본인·가족 부양, 경기교육대상·대한민국 공무원상, 2025년 임용 늘봄전담실장 등',
               '고양은 을구역 만기 → 학교 만기 → 일반 순으로 우선하고(제10조①), 같은 구분 안에서는 우대 대상자 → 전보년수 순이에요. 원문 괄호가 "만기전보자의 2, 3희망"만 적고 있어 1희망에서도 만기자가 앞서는지는 불확실한데, 여기서는 앞서는 것으로 봤어요. 동점이면 근무성적 → 교육총경력 → 생년월일 순인데 이 값은 받지 않아서 "동점"으로만 표시해요.'),
    'yongin': ('용인', '58세 이상, 정책연구·시범학교 교육감 이상 표창, 국가유공자 등, 발명교실 2년 이상 운영, 중증장애 본인',
               '용인은 만기전보자를 일반전보자보다 먼저 배정하고, 같은 구분 안에서는 우대 대상자 → 전보년수 순이에요. "현임교 만기 교원은 현임교 근무년수를 전보년수로 적용"한다는 문구가 가산을 빼라는 뜻인지 불확실해서, 여기서는 만기자도 가산을 더한 점수로 비교해요. 동점이면 근무성적 → 생년월일 순인데 이 값은 받지 않아서 "동점"으로만 표시해요.'),
    'hwaseong': ('화성오산', '58세 이상, 국가유공자 등, 70세 이상 노부모 3년 이상 부양, 정책연구·시범학교 표창, 중증장애, 경기교육대상·공무원상·모범공무원상, 늘봄전담실장 등',
                 '화성오산은 만기자와 일반자를 희망 학교별 같은 명부에서 우대 대상자 → 전보년수 순으로 정해요(만기 우선 규정 없음). 동점이면 근무성적 → 생년월일 순인데 이 값은 받지 않아서 "동점"으로만 표시해요.'),
    'bucheon': ('부천', '정책연구·시범학교 교육감 이상 표창, 경기교육대상·대한민국 공무원상, 소년체전 입상 지도, 국가유공자 등, 교육복지 표창, 중증장애 본인·가족 부양, 늘봄전담실장 임기 후 복귀',
                '부천은 희망 학교별 명부에서 전보년수가 높은 사람부터 배정해요(만기 우선 규정 없음, 우대 대상자는 먼저). 동점이면 근무성적 → 생년월일 순인데 이 값은 받지 않아서 "동점"으로만 표시해요.'),
}
for key, (name, prio, note) in DISTRICTS.items():
    page(f'{key}.html', f'{name} 관내전보 모의지원', f'{name} 관내전보 점수 계산·모의지원',
         f'{name} 관내 초등 전보 전보년수를 계산하고 모의 지원으로 희망 학교 순위를 확인해요.',
         'src/district-part.html', 'src/district.js', key,
         pre=('src/districts/_helpers.js', f'src/districts/{key}.js'),
         part_vars={'NAME': name, 'PRIORITY': prio, 'RULE_NOTE': note})
