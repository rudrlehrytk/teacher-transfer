-- 2026-10-29 적용: 수원 희망학교 수 (학교만기 6희망, 일반 3희망 이내). 안양과천은 만기 4 / 일반 1 그대로
alter table public.gwannae_applications drop constraint gwannae_applications_wishes_check;
alter table public.gwannae_applications drop constraint gwannae_applications_check1;
alter table public.gwannae_applications add constraint gwannae_applications_wishes_check check (
  array_length(wishes, 1) >= 1 and array_length(wishes, 1) <= case
    when district = 'suwon' then (case when is_expired then 6 else 3 end)
    else (case when is_expired then 4 else 1 end) end);
