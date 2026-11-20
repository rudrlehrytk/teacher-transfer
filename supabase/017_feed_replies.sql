-- 피드 댓글: 댓글도 feed_posts 한 줄(parent_id 있음). 목록(get_feed)은 원글만 + 댓글 수, 댓글은 get_feed_replies로.
alter table public.feed_posts add column if not exists parent_id bigint references public.feed_posts(id) on delete cascade;
create index if not exists feed_posts_parent_idx on public.feed_posts (parent_id, id);

drop function if exists public.get_feed(text, bigint, int);
create function public.get_feed(p_tag text default null, p_before bigint default null, p_limit int default 40)
returns table (id bigint, anon_no int, body text, tag text, score_label text, created_at timestamptz, is_mine boolean, reports int, reply_count int)
language sql security definer set search_path = '' stable as $$
  select p.id, a.anon_no, p.body, p.tag, p.score_label, p.created_at,
         p.user_id = auth.uid(),
         (select count(*)::int from public.feed_reports r where r.post_id = p.id),
         (select count(*)::int from public.feed_posts c where c.parent_id = p.id and not c.hidden)
  from public.feed_posts p join public.feed_authors a on a.user_id = p.user_id
  where not p.hidden and p.parent_id is null
    and (p_tag is null or p.tag = p_tag)
    and (p_before is null or p.id < p_before)
  order by p.id desc
  limit least(greatest(coalesce(p_limit, 40), 1), 100);
$$;

create or replace function public.get_feed_replies(p_parent bigint)
returns table (id bigint, anon_no int, body text, score_label text, created_at timestamptz, is_mine boolean, is_op boolean)
language sql security definer set search_path = '' stable as $$
  select c.id, a.anon_no, c.body, c.score_label, c.created_at,
         c.user_id = auth.uid(),
         c.user_id = (select p.user_id from public.feed_posts p where p.id = p_parent)
  from public.feed_posts c join public.feed_authors a on a.user_id = c.user_id
  where c.parent_id = p_parent and not c.hidden
    and exists (select 1 from public.feed_posts p where p.id = p_parent and not p.hidden)
  order by c.id
  limit 200;
$$;

create or replace function public.post_feed_reply(p_parent bigint, p_body text, p_score text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); new_id bigint;
begin
  if uid is null then raise exception '로그인해야 댓글을 쓸 수 있어요'; end if;
  if not exists (select 1 from public.feed_posts where id = p_parent and parent_id is null and not hidden) then
    raise exception '원글이 없거나 숨겨졌어요';
  end if;
  if exists (select 1 from public.feed_posts where user_id = uid and created_at > now() - interval '15 seconds') then
    raise exception '15초 뒤에 다시 써 주세요';
  end if;
  if (select count(*) from public.feed_posts where user_id = uid and created_at > now() - interval '1 day') >= 60 then
    raise exception '하루에 쓸 수 있는 글·댓글 수를 넘었어요';
  end if;
  if p_body ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' or p_body ~ '01[0-9][- .]?[0-9]{3,4}[- .]?[0-9]{4}' then
    raise exception '이메일이나 전화번호는 올릴 수 없어요';
  end if;
  insert into public.feed_authors (user_id) values (uid) on conflict do nothing;
  insert into public.feed_posts (user_id, body, score_label, parent_id)
  values (uid, btrim(p_body), nullif(btrim(p_score), ''), p_parent)
  returning id into new_id;
  return new_id;
end $$;

revoke all on function public.get_feed(text, bigint, int) from public;
revoke all on function public.get_feed_replies(bigint) from public;
revoke all on function public.post_feed_reply(bigint, text, text) from public, anon;
grant execute on function public.get_feed(text, bigint, int) to anon, authenticated;
grant execute on function public.get_feed_replies(bigint) to anon, authenticated;
grant execute on function public.post_feed_reply(bigint, text, text) to authenticated;
