-- 순위 함수가 지역 전체를 내려보내지 않도록: 호출한 사람이 희망으로 쓴 시·군/학교의 행만 반환 (2026-11-23)
create or replace function public.get_rankings(p_cycle text default '2027-03')
returns table(region text, wish_order integer, total_months integer, has_priority boolean, is_gap_expired boolean, is_me boolean)
language sql stable security definer set search_path to '' as $$
  select w.region, w.ord::int, a.total_months, a.has_priority, a.is_gap_expired,
         (a.user_id = (select auth.uid())) as is_me
  from public.applications a
  cross join lateral unnest(a.wishes) with ordinality as w(region, ord)
  where a.cycle = p_cycle and a.kind = 'gwanoe'
    and w.region in (select unnest(m.wishes) from public.applications m
                     where m.user_id = (select auth.uid()) and m.cycle = p_cycle and m.kind = 'gwanoe')
  order by w.region, a.has_priority desc, a.total_months desc;
$$;

create or replace function public.get_school_rankings(p_cycle text, p_district text)
returns table(school text, wish_order integer, total_months integer, has_priority boolean, is_expired boolean, is_me boolean, tier smallint)
language sql stable security definer set search_path to '' as $$
  select w.school, w.ord::int, a.total_months, a.has_priority, a.is_expired,
         (a.user_id = (select auth.uid())) as is_me, a.tier
  from public.gwannae_applications a
  cross join lateral unnest(a.wishes) with ordinality as w(school, ord)
  where a.cycle = p_cycle and a.district = p_district
    and w.school in (select unnest(m.wishes) from public.gwannae_applications m
                     where m.user_id = (select auth.uid()) and m.cycle = p_cycle and m.district = p_district)
  order by w.school, a.tier desc, a.has_priority desc, a.total_months desc;
$$;

revoke all on function public.get_rankings(text) from public, anon;
revoke all on function public.get_school_rankings(text, text) from public, anon;
grant execute on function public.get_rankings(text) to authenticated;
grant execute on function public.get_school_rankings(text, text) to authenticated;
