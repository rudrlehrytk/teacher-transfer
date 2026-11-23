-- 공개 현황: 점수 없이 시·군/학교별 지원 인원만 (누구나 조회) — 2026-11-23
create or replace function public.get_gwanoe_counts(p_cycle text default '2027-03')
returns table(region text, first_count int, total_count int)
language sql stable security definer set search_path to '' as $$
  select w.region, (count(*) filter (where w.ord = 1))::int, count(*)::int
  from public.applications a cross join lateral unnest(a.wishes) with ordinality as w(region, ord)
  where a.cycle = p_cycle and a.kind = 'gwanoe'
  group by w.region;
$$;
create or replace function public.get_gwannae_counts(p_cycle text, p_district text)
returns table(school text, first_count int, total_count int)
language sql stable security definer set search_path to '' as $$
  select w.school, (count(*) filter (where w.ord = 1))::int, count(*)::int
  from public.gwannae_applications a cross join lateral unnest(a.wishes) with ordinality as w(school, ord)
  where a.cycle = p_cycle and a.district = p_district
  group by w.school;
$$;
create or replace function public.get_apply_totals(p_cycle text default '2027-03', p_district text default null)
returns int language sql stable security definer set search_path to '' as $$
  select case when p_district is null
    then (select count(*)::int from public.applications where cycle = p_cycle and kind = 'gwanoe')
    else (select count(*)::int from public.gwannae_applications where cycle = p_cycle and district = p_district) end;
$$;
revoke all on function public.get_gwanoe_counts(text) from public;
revoke all on function public.get_gwannae_counts(text, text) from public;
revoke all on function public.get_apply_totals(text, text) from public;
grant execute on function public.get_gwanoe_counts(text) to anon, authenticated;
grant execute on function public.get_gwannae_counts(text, text) to anon, authenticated;
grant execute on function public.get_apply_totals(text, text) to anon, authenticated;
