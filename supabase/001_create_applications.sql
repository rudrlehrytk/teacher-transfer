-- Supabase 프로젝트 teacher-transfer (ibpycwlzrxqtxlmbfemh)에 2026-10-26 적용한 마이그레이션
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cycle text not null default '2027-03',
  kind text not null default 'gwanoe' check (kind in ('gwanoe')),
  current_region text not null,
  wishes text[] not null,
  is_gap_expired boolean not null default false,
  has_priority boolean not null default false,
  base_months int not null check (base_months between 24 and 60),
  bonus_months int not null check (bonus_months between 0 and 240),
  total_months int not null check (total_months = base_months + bonus_months),
  created_at timestamptz not null default now(),
  unique (cycle, kind, user_id),
  check (array_length(wishes, 1) between 1 and 4),
  check (is_gap_expired or array_length(wishes, 1) = 1),
  check (not (current_region = any (wishes)))
);

comment on table public.applications is '관외전보 모의지원: 1인 1회(cycle·kind별). 개인정보 없이 점수와 희망지만 저장.';

alter table public.applications enable row level security;

create policy "select own application" on public.applications
  for select to authenticated using (user_id = (select auth.uid()));

create policy "insert own application" on public.applications
  for insert to authenticated with check (user_id = (select auth.uid()));

-- 순위 조회: 다른 사람의 user_id는 돌려주지 않는다
create or replace function public.get_rankings(p_cycle text default '2027-03')
returns table (
  region text,
  wish_order int,
  total_months int,
  has_priority boolean,
  is_gap_expired boolean,
  is_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select w.region, w.ord::int, a.total_months, a.has_priority, a.is_gap_expired,
         (a.user_id = (select auth.uid())) as is_me
  from public.applications a
  cross join lateral unnest(a.wishes) with ordinality as w(region, ord)
  where a.cycle = p_cycle and a.kind = 'gwanoe'
  order by w.region, a.has_priority desc, a.total_months desc;
$$;

revoke all on function public.get_rankings(text) from public, anon;
grant execute on function public.get_rankings(text) to authenticated;
