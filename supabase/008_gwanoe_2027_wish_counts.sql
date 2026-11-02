-- 2026-11-02 적용: 2027 관외(시·군간) 희망지 수 — 일반 3희망까지, 갑 만기 6희망까지
alter table public.applications drop constraint applications_wishes_check;
alter table public.applications drop constraint applications_check1;
alter table public.applications add constraint applications_wishes_check check (
  array_length(wishes, 1) >= 1 and array_length(wishes, 1) <= (case when is_gap_expired then 6 else 3 end));
