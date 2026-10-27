# 경기 관외전보 모의지원

경기도 초등교사 시·군간(관외) 전보의 전보년수를 계산하고, 모의 지원으로 희망 시·군에서의 순위를 확인하는 웹앱.

- 규칙: 2026학년도 경기도교육공무원인사관리세부기준(유치원, 초등) 제10·11·13·16조
- 비율 가산은 항목마다 월 단위로 소수점 절사, 세 자녀·영유아 가산은 중복 불가
- 일반내신(1희망, 밀리면 잔류) / 갑구역 만기내신(1~4희망) 구분
- 시·군별 TO는 공개되지 않아 순위만 표시

## 구조
- `index.html` — 배포되는 페이지 (`python3 build.py`로 생성, 직접 고치지 않음)
- `src/calc.js` — 전보년수 계산 로직
- `src/calculator-base.html` — 계산기 화면(스타일·입력 서식)
- `src/app-part.html`, `src/app.js`, `src/extra.css` — 로그인·모의 지원·순위
- `supabase/` — DB 마이그레이션 (Supabase 프로젝트 `teacher-transfer`)
- `test/` — `node test/calc.test.js` 계산 테스트, `node test/run.js`·`run2.js` 가짜 Supabase로 화면 흐름 테스트(Playwright)

## 배포
GitHub Pages(main 브랜치 루트). Supabase Authentication > URL Configuration에 Pages 주소를 Site URL·Redirect URL로 등록해야 이메일 로그인 링크가 이 페이지로 돌아온다.

공식 계산이 아니며, 실제 전보 결과와 다를 수 있다.
