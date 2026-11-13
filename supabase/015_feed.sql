-- 실시간 익명 피드: 글은 로그인 사용자만, 읽기는 누구나. 화면에는 "익명 교사 N"만 보이고 이메일·계정 번호는 내려보내지 않는다.
create table if not exists public.feed_authors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  anon_no serial unique
);
create table if not exists public.feed_posts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 2 and 300),
  tag text check (tag is null or char_length(tag) <= 40),
  score_label text check (score_label is null or char_length(score_label) <= 40),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists feed_posts_created_idx on public.feed_posts (created_at desc);
create table if not exists public.feed_reports (
  post_id bigint references public.feed_posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.feed_authors enable row level security;
alter table public.feed_posts enable row level security;
alter table public.feed_reports enable row level security;
-- 직접 접근 정책은 두지 않는다(모두 아래 함수로만).

create or replace function public.get_feed(p_tag text default null, p_before bigint default null, p_limit int default 40)
returns table (id bigint, anon_no int, body text, tag text, score_label text, created_at timestamptz, is_mine boolean, reports int)
language sql security definer set search_path = '' stable as $$
  select p.id, a.anon_no, p.body, p.tag, p.score_label, p.created_at,
         p.user_id = auth.uid(),
         (select count(*)::int from public.feed_reports r where r.post_id = p.id)
  from public.feed_posts p join public.feed_authors a on a.user_id = p.user_id
  where not p.hidden
    and (p_tag is null or p.tag = p_tag)
    and (p_before is null or p.id < p_before)
  order by p.id desc
  limit least(greatest(coalesce(p_limit, 40), 1), 100);
$$;

create or replace function public.post_feed(p_body text, p_tag text default null, p_score text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); new_id bigint;
begin
  if uid is null then raise exception '로그인해야 글을 쓸 수 있어요'; end if;
  if exists (select 1 from public.feed_posts where user_id = uid and created_at > now() - interval '60 seconds') then
    raise exception '1분에 한 번만 글을 쓸 수 있어요';
  end if;
  if (select count(*) from public.feed_posts where user_id = uid and created_at > now() - interval '1 day') >= 30 then
    raise exception '하루에 30개까지만 쓸 수 있어요';
  end if;
  if p_body ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' or p_body ~ '01[0-9][- .]?[0-9]{3,4}[- .]?[0-9]{4}' then
    raise exception '이메일이나 전화번호는 올릴 수 없어요';
  end if;
  insert into public.feed_authors (user_id) values (uid) on conflict do nothing;
  insert into public.feed_posts (user_id, body, tag, score_label)
  values (uid, btrim(p_body), nullif(btrim(p_tag), ''), nullif(btrim(p_score), ''))
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.delete_feed(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from public.feed_posts where id = p_id and user_id = auth.uid();
end $$;

create or replace function public.report_feed(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception '로그인해야 신고할 수 있어요'; end if;
  if exists (select 1 from public.feed_posts where id = p_id and user_id = uid) then return; end if;
  insert into public.feed_reports (post_id, user_id) values (p_id, uid) on conflict do nothing;
  update public.feed_posts set hidden = true
  where id = p_id and (select count(*) from public.feed_reports where post_id = p_id) >= 3;
end $$;

revoke all on function public.get_feed(text, bigint, int) from public;
revoke all on function public.post_feed(text, text, text) from public;
revoke all on function public.delete_feed(bigint) from public;
revoke all on function public.report_feed(bigint) from public;
grant execute on function public.get_feed(text, bigint, int) to anon, authenticated;
grant execute on function public.post_feed(text, text, text) to authenticated;
grant execute on function public.delete_feed(bigint) to authenticated;
grant execute on function public.report_feed(bigint) to authenticated;

-- 내 정보 모두 삭제: 피드 글도 함께 (auth.users 삭제 시 cascade 되지만 명시)
create or replace function public.delete_my_data()
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from public.applications where user_id = uid;
  delete from public.gwannae_applications where user_id = uid;
  delete from public.feed_posts where user_id = uid;
  delete from auth.users where id = uid;
end $$;
