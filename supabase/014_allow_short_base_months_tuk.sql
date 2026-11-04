-- 2026-11-04 적용: 특만기(2026.2.28.까지 특구역 5년 이상)는 2026.3.1. 이후 근무만 인정돼
-- 인정 근무년수가 2년 미만일 수 있다. 내신 자격(실근무 2년)은 화면에서 확인하므로 DB는 0~60개월만 막는다.
alter table public.applications drop constraint applications_base_months_check;
alter table public.applications add constraint applications_base_months_check check (base_months between 0 and 60);
alter table public.gwannae_applications drop constraint gwannae_applications_base_months_check;
alter table public.gwannae_applications add constraint gwannae_applications_base_months_check check (base_months between 0 and 60);
