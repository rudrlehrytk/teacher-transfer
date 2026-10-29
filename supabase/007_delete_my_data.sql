-- 2026-10-29: "내 정보 모두 삭제" 버튼용. 로그인한 본인의 지원 내역과 계정(이메일)만 지운다.
create or replace function public.delete_my_data()
returns void
language plpgsql security definer set search_path = ''
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from public.applications where user_id = uid;
  delete from public.gwannae_applications where user_id = uid;
  delete from auth.users where id = uid;
end $$;
revoke all on function public.delete_my_data() from public, anon;
grant execute on function public.delete_my_data() to authenticated;
