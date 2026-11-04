-- 2026-11-04 적용: 파주 관내 모의지원 (일반 1희망 / 만기 3희망)
alter table public.gwannae_applications drop constraint gwannae_applications_district_check;
alter table public.gwannae_applications add constraint gwannae_applications_district_check
  check (district in ('anyang','suwon','gunpo','seongnam','goyang','yongin','hwaseong','bucheon','pyeongtaek','gwangmyeong','siheung','gwangjuhanam','paju'));
alter table public.gwannae_applications drop constraint gwannae_applications_wishes_check;
alter table public.gwannae_applications add constraint gwannae_applications_wishes_check check (
  array_length(wishes, 1) >= 1 and array_length(wishes, 1) <= case district
    when 'suwon'        then (case when is_expired then 6 else 3 end)
    when 'seongnam'     then 3
    when 'bucheon'      then 4
    when 'goyang'       then (case when is_expired then 3 else 1 end)
    when 'yongin'       then (case when is_expired then 3 else 1 end)
    when 'hwaseong'     then (case when is_expired then 3 else 1 end)
    when 'pyeongtaek'   then (case when is_expired then 3 else 1 end)
    when 'siheung'      then (case when is_expired then 3 else 1 end)
    when 'gwangjuhanam' then (case when is_expired then 3 else 1 end)
    when 'paju'         then (case when is_expired then 3 else 1 end)
    else (case when is_expired then 4 else 1 end) end);
