revoke execute on function public.post_feed(text,text,text) from anon;
revoke execute on function public.delete_feed(bigint) from anon;
revoke execute on function public.report_feed(bigint) from anon;
revoke all on public.feed_posts, public.feed_authors, public.feed_reports from anon, authenticated;
