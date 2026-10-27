-- 2026-10-27 적용: 지원청별 관내전보 모의지원 (안양과천부터)
create table public.gwannae_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cycle text not null default '2027-03',
  district text not null check (district in ('anyang')),
  current_school text not null,
  wishes text[] not null,
  is_expired boolean not null default false,
  has_priority boolean not null default false,
  base_months int not null check (base_months between 24 and 60),
  bonus_months int not null check (bonus_months between 0 and 240),
  total_months int not null check (total_months = base_months + bonus_months),
  created_at timestamptz not null default now(),
  unique (cycle, district, user_id),
  check (array_length(wishes, 1) between 1 and 4),
  check (is_expired or array_length(wishes, 1) = 1),
  check (not (current_school = any (wishes)))
);
alter table public.gwannae_applications enable row level security;
create policy "select own gwannae application" on public.gwannae_applications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "insert own gwannae application" on public.gwannae_applications
  for insert to authenticated with check (user_id = (select auth.uid()));

create or replace function public.get_school_rankings(p_cycle text, p_district text)
returns table (school text, wish_order int, total_months int, has_priority boolean, is_expired boolean, is_me boolean)
language sql stable security definer set search_path = ''
as $$
  select w.school, w.ord::int, a.total_months, a.has_priority, a.is_expired,
         (a.user_id = (select auth.uid())) as is_me
  from public.gwannae_applications a
  cross join lateral unnest(a.wishes) with ordinality as w(school, ord)
  where a.cycle = p_cycle and a.district = p_district
  order by w.school, a.is_expired desc, a.has_priority desc, a.total_months desc;
$$;
revoke all on function public.get_school_rankings(text, text) from public, anon;
grant execute on function public.get_school_rankings(text, text) to authenticated;
