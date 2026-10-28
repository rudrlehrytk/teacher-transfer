-- 2026-10-28 적용: 수원 관내전보 모의지원 추가
alter table public.gwannae_applications drop constraint gwannae_applications_district_check;
alter table public.gwannae_applications add constraint gwannae_applications_district_check check (district in ('anyang','suwon'));
