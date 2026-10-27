(function () {
  const me = 'u-me';
  const rows = [
    { user_id: 'e1', current_school: '평촌초', wishes: ['범계초', '민백초'], is_expired: true, has_priority: false, total_months: 75 },
    { user_id: 'g1', current_school: '귀인초', wishes: ['범계초'], is_expired: false, has_priority: false, total_months: 120 },
    { user_id: 'g2', current_school: '호계초', wishes: ['범계초'], is_expired: false, has_priority: true, total_months: 60 },
    { user_id: 'e2', current_school: '부림초', wishes: ['민백초', '범계초'], is_expired: true, has_priority: false, total_months: 80 },
  ];
  window.supabase = { createClient() { return {
    auth: { async getSession() { return { data: { session: { user: { id: me, email: 't@example.com' } } } }; },
            onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; }, async signInWithOtp() { return {}; }, async signOut() {} },
    from() { const q = { select() { return q; }, eq() { return q; },
      async maybeSingle() { return { data: rows.find(r => r.user_id === me) || null, error: null }; },
      async insert(o) { rows.push({ ...o, user_id: me }); return { error: null }; } }; return q; },
    async rpc(name) { const out = []; for (const r of rows) r.wishes.forEach((w, i) => out.push({ school: w, wish_order: i + 1, total_months: r.total_months, has_priority: r.has_priority, is_expired: r.is_expired, is_me: r.user_id === me })); return { data: out, error: null }; },
  }; } };
})();
