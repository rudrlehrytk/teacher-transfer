# 경기 관외전보 모의지원

경기도 초등교사 시·군간(관외) 전보의 전보년수를 계산하고, 모의 지원으로 희망 시·군에서의 순위를 확인하는 웹앱.

- 규칙: 2026학년도 경기도교육공무원인사관리세부기준(유치원, 초등) 제10·11·13·16조
- 비율 가산은 항목마다 월 단위로 소수점 절사, 세 자녀·영유아 가산은 중복 불가
- 일반내신(1희망, 밀리면 잔류) / 갑구역 만기내신(1~4희망) 구분
- 시·군별 TO는 공개되지 않아 순위만 표시

## 구조
- `index.html`(관외), `anyang.html`(안양과천 관내), `suwon.html`(수원 관내), `gunpo.html`(군포의왕 관내), `seongnam`·`goyang`·`yongin`·`hwaseong`·`bucheon`.html(설정형 관내 페이지) — 배포되는 페이지 (`python3 build.py`로 생성, 직접 고치지 않음)
- `src/gwannae.js`(안양과천)·`src/suwon.js`·`src/gunpo.js` — 지원청별 관내 모의 지원(계산기 조정 + 학교별 순위)
- `src/calc.js` — 전보년수 계산 로직
- `src/calculator-base.html` — 계산기 화면(스타일·입력 서식)
- `src/app-part.html`, `src/app.js`, `src/extra.css` — 로그인·모의 지원·순위
- `supabase/` — DB 마이그레이션 (Supabase 프로젝트 `teacher-transfer`)
- `test/` — `node test/calc.test.js` 계산 테스트, `node test/run.js`·`run2.js` 가짜 Supabase로 화면 흐름 테스트(Playwright)

## 배포
GitHub Pages(main 브랜치 루트). Supabase Authentication > URL Configuration에 Pages 주소를 Site URL·Redirect URL로 등록해야 이메일 로그인 링크가 이 페이지로 돌아온다.

공식 계산이 아니며, 실제 전보 결과와 다를 수 있다.

## 관내 페이지 추가하는 법 (설정형)
- `src/districts/<key>.js`에 `DCFG`(학교 목록·지역가산율·가산 항목·표창 단계·내신 구분·희망 수·순위 방식)를 쓰고, `build.py`의 `DISTRICTS`와 `PAGES`에 한 줄씩 넣는다.
- 공통 코드는 `src/district.js`, 화면은 `src/district-part.html`. DB `district` 허용값과 희망 수 제약도 마이그레이션으로 추가한다.
- 테스트: `node test/run-districts.js`

## 개인정보
- 로그인 전 수집·이용 동의 체크(필수), 처리방침 `privacy.html`, 로그인 후 "내 정보 모두 삭제"(`delete_my_data()` RPC) — 공통 스크립트 `src/privacy.js`.
- 보관 기간: 2027.3.31. 일괄 삭제(운영자가 실행).
