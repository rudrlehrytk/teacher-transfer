-- 2026-10-29 적용: 군포의왕 관내전보 모의지원 추가 (희망 수는 안양과천과 같음: 만기 4 / 일반 1)
alter table public.gwannae_applications drop constraint gwannae_applications_district_check;
alter table public.gwannae_applications add constraint gwannae_applications_district_check check (district in ('anyang','suwon','gunpo'));
