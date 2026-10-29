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

NAV = '''<nav class="pages" aria-label="모의지원 종류">
  <a href="./"{a}>관외전보 (시·군간)</a>
  <a href="./anyang.html"{b}>안양과천 관내전보</a>
  <a href="./suwon.html"{c}>수원 관내전보</a>
  <a href="./gunpo.html"{d}>군포의왕 관내전보</a>
</nav>'''
NAV_CSS = '''
.pages { display: flex; gap: 6px; flex-wrap: wrap; }
.pages a { font-size: 0.85rem; padding: 5px 12px; border-radius: 999px; border: 1px solid var(--line); color: var(--ink); text-decoration: none; background: var(--paper); }
.pages a[aria-current="page"] { background: var(--accent); color: var(--paper); border-color: var(--accent); }
'''

def page(out, title, h1, desc, part, js, current):
    html_body = base_html.replace('<h1>경기 관외전보 점수 계산기</h1>', f'<h1>{h1}</h1>')
    html_body = html_body.replace(
        '<p>입력한 값은 이 화면에서만 쓰고 어디에도 저장하지 않아요.</p>',
        '<p>점수 계산은 이 화면에서만 해요. 모의 지원을 하면 점수(개월 수), 현재 근무지, 희망지, 만기·우대 여부만 저장돼요.</p>')
    nav = NAV.format(a=' aria-current="page"' if current == 'gwanoe' else '',
                     b=' aria-current="page"' if current == 'anyang' else '',
                     c=' aria-current="page"' if current == 'suwon' else '',
                     d=' aria-current="page"' if current == 'gunpo' else '')
    html_body = html_body.replace('<header>', '<header>\n    ' + nav, 1)
    idx = html_body.rstrip().rfind('</div>')
    html_body = html_body[:idx] + (root / part).read_text() + html_body[idx:]
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
