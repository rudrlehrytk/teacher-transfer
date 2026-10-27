import re, pathlib
root = pathlib.Path(__file__).parent
src = ((root / 'src/calculator-base.html')).read_text()
calc = ((root / 'src/calc.js')).read_text().replace(
    "if (typeof module !== 'undefined') module.exports = { calc, fmtYM, serviceMD, diffMD, parseDate };", "")

style = re.search(r'<style>(.*?)</style>', src, re.S).group(1)
body = src.split('</style>', 1)[1]
body_html, script = body.split('<script>', 1)
script = script.rsplit('</script>', 1)[0]
# 계산기 스크립트에서 calc 본문(이미 인라인된 것)을 떼고 UI 부분만 남긴다
ui = script[script.index('const REGIONS'):]

body_html = body_html.replace('<h1>경기 관외전보 점수 계산기</h1>', '<h1>경기 관외전보 점수 계산·모의지원</h1>')
body_html = body_html.replace('<p>입력한 값은 이 화면에서만 쓰고 어디에도 저장하지 않아요.</p>',
    '<p>점수 계산은 이 화면에서만 해요. 모의 지원을 하면 점수(개월 수), 현재 지원청, 희망 시·군, 갑 만기·우대 여부만 저장돼요.</p>')
app_part = (root / 'src/app-part.html').read_text()
# 계산기 2단 레이아웃 바로 아래(.wrap 끝)에 모의 지원 패널을 넣는다
idx = body_html.rstrip().rfind('</div>')
body_html = body_html[:idx] + app_part + body_html[idx:]

html = f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>경기 관외전보 모의지원</title>
<meta name="description" content="경기도 시·군간(관외) 전보 전보년수를 계산하고 모의 지원으로 희망 시·군 순위를 확인해요.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">
<style>
{style}
{(root / 'src/extra.css').read_text()}
</style>
</head>
<body>
{body_html}
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<script>
{calc}
{ui}
{(root / 'src/app.js').read_text()}
</script>
</body>
</html>
'''

(root / 'index.html').write_text(html)
print('built', len(html))
