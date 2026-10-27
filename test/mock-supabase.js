// 테스트용 가짜 supabase-js: 로그인된 사용자 1명 + 다른 지원자 몇 명
(function () {
  const me = 'u-me';
  const others = [
    { user_id: 'u1', current_region: '성남', wishes: ['수원'], is_gap_expired: false, has_priority: false, total_months: 110 },
    { user_id: 'u2', current_region: '용인', wishes: ['수원'], is_gap_expired: false, has_priority: true, total_months: 60 },
    { user_id: 'u3', current_region: '부천', wishes: ['수원'], is_gap_expired: false, has_priority: false, total_months: 118 },
    { user_id: 'u4', current_region: '성남', wishes: ['용인', '수원'], is_gap_expired: true, has_priority: false, total_months: 90 },
  ];
  const rows = [...others];
  const session = { user: { id: me, email: 'test@example.com' } };
  window.__rows = rows;
  window.supabase = {
    createClient() {
      return {
        auth: {
          async getSession() { return { data: { session } }; },
          onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
          async signInWithOtp() { return { error: null }; },
          async signOut() {},
        },
        from() {
          const q = {
            select() { return q; }, eq() { return q; },
            async maybeSingle() { return { data: rows.find(r => r.user_id === me) || null, error: null }; },
            async insert(obj) {
              if (rows.find(r => r.user_id === me)) return { error: { code: '23505', message: 'dup' } };
              rows.push({ ...obj, user_id: me }); return { error: null };
            },
          };
          return q;
        },
        async rpc() {
          const out = [];
          for (const r of rows) r.wishes.forEach((w, i) => out.push({ region: w, wish_order: i + 1, total_months: r.total_months, has_priority: r.has_priority, is_gap_expired: r.is_gap_expired, is_me: r.user_id === me }));
          return { data: out, error: null };
        },
      };
    },
  };
})();
