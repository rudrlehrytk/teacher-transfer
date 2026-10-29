(function () {
  const me = 'u-me';
  const rows = (window.__ROWS || []).map(r => ({ tier: r.is_expired ? 1 : 0, ...r }));
  window.__INSERTED = null;
  window.supabase = { createClient() { return {
    auth: { async getSession() { return { data: { session: window.__NOSESSION ? null : { user: { id: me, email: "t@example.com" } } } }; },
            onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; }, async signInWithOtp() { return {}; }, async signOut() {} },
    from() { const q = { select() { return q; }, eq() { return q; },
      async maybeSingle() { return { data: rows.find(r => r.user_id === me) || null, error: null }; },
      async insert(o) { window.__INSERTED = o; rows.push({ ...o, user_id: me }); return { error: null }; } }; return q; },
    async rpc() { const out = []; for (const r of rows) r.wishes.forEach((w, i) => out.push({ school: w, wish_order: i + 1, total_months: r.total_months, has_priority: r.has_priority, is_expired: r.is_expired, tier: r.tier, is_me: r.user_id === me })); return { data: out, error: null }; },
  }; } };
})();
