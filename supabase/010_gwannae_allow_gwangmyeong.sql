-- 2026-11-02 적용: 광명 관내 모의지원 (일반 1희망 / 만기 4희망 — 희망 수 제약은 기본값 그대로)
alter table public.gwannae_applications drop constraint gwannae_applications_district_check;
alter table public.gwannae_applications add constraint gwannae_applications_district_check
  check (district in ('anyang','suwon','gunpo','seongnam','goyang','yongin','hwaseong','bucheon','pyeongtaek','gwangmyeong'));
