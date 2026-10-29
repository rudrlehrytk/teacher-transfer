-- 2026-10-29 적용: 성남·고양·용인·화성오산·부천 관내 모의지원, 만기 구분(tier), 희망 수 제약
alter table public.gwannae_applications drop constraint gwannae_applications_district_check;
alter table public.gwannae_applications add constraint gwannae_applications_district_check
  check (district in ('anyang','suwon','gunpo','seongnam','goyang','yongin','hwaseong','bucheon'));

-- 0 일반, 1 학교(현임교) 만기, 2 구역 만기(고양 을구역 5년 만기처럼 학교 만기보다 앞서는 경우)
alter table public.gwannae_applications add column tier smallint not null default 0;
update public.gwannae_applications set tier = 1 where is_expired;
alter table public.gwannae_applications add constraint gwannae_applications_tier_check
  check (tier between 0 and 2 and (tier >= 1) = is_expired);

alter table public.gwannae_applications drop constraint gwannae_applications_wishes_check;
alter table public.gwannae_applications add constraint gwannae_applications_wishes_check check (
  array_length(wishes, 1) >= 1 and array_length(wishes, 1) <= case district
    when 'suwon'    then (case when is_expired then 6 else 3 end)
    when 'seongnam' then 3
    when 'bucheon'  then 4
    when 'goyang'   then (case when is_expired then 3 else 1 end)
    when 'yongin'   then (case when is_expired then 3 else 1 end)
    when 'hwaseong' then (case when is_expired then 3 else 1 end)
    else (case when is_expired then 4 else 1 end) end);

drop function public.get_school_rankings(text, text);
create function public.get_school_rankings(p_cycle text, p_district text)
returns table (school text, wish_order int, total_months int, has_priority boolean, is_expired boolean, is_me boolean, tier smallint)
language sql stable security definer set search_path = ''
as $$
  select w.school, w.ord::int, a.total_months, a.has_priority, a.is_expired,
         (a.user_id = (select auth.uid())) as is_me, a.tier
  from public.gwannae_applications a
  cross join lateral unnest(a.wishes) with ordinality as w(school, ord)
  where a.cycle = p_cycle and a.district = p_district
  order by w.school, a.tier desc, a.has_priority desc, a.total_months desc;
$$;
revoke all on function public.get_school_rankings(text, text) from public, anon;
grant execute on function public.get_school_rankings(text, text) to authenticated;

-- 기존 페이지(안양과천·수원·군포의왕)는 tier를 보내지 않으므로 만기면 1로 채운다
create or replace function public.gwannae_set_tier() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.is_expired and new.tier = 0 then new.tier := 1; end if;
  return new;
end $$;
create trigger gwannae_set_tier before insert on public.gwannae_applications
  for each row execute function public.gwannae_set_tier();
