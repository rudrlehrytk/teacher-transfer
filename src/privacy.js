// 개인정보: 로그인 전 수집·이용 동의, 내 정보 삭제, 처리방침 링크 — 모든 페이지 공통
(function privacyUi() {
  const $p = (id) => document.getElementById(id);
  const btn = $p('btnLogin');
  if (btn) {
    const wrap = document.createElement('div');
    wrap.className = 'consent';
    wrap.innerHTML = `<label class="check"><input type="checkbox" id="privacyAgree"> <span><strong>[필수]</strong> 개인정보 수집·이용에 동의해요.
      이메일(로그인용)과 모의지원 내용(현임교, 희망 학교, 점수, 만기·우대 여부)을 모의지원 순위 계산에만 쓰고,
      <strong>2027년 3월 31일에 모두 지워요.</strong> 동의하지 않으면 계산기만 쓸 수 있어요.
      <a href="./privacy.html" target="_blank" rel="noopener">처리방침 보기</a></span></label>`;
    btn.closest('.ctl').after(wrap);
    const agree = $p('privacyAgree');
    const sync = () => { btn.disabled = !agree.checked; btn.title = agree.checked ? '' : '개인정보 수집·이용에 동의해야 로그인할 수 있어요'; };
    agree.addEventListener('change', sync);
    sync();
    // 동의 전에는 각 페이지의 로그인 동작이 실행되지 않게 막는다
    btn.addEventListener('click', (e) => { if (!agree.checked) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  }
  const who = $p('signedIn');
  if (who) {
    const box = document.createElement('p');
    box.className = 'delete-me';
    box.innerHTML = `<button type="button" class="btn-ghost danger" id="btnDeleteMe">내 정보 모두 삭제</button>
      <span class="hint" id="deleteMsg">이 계정의 이메일과 모든 모의지원 내역(관외·관내)을 바로 지워요.</span>`;
    who.appendChild(box);
    $p('btnDeleteMe').addEventListener('click', async () => {
      if (!window.confirmDelete) {
        window.confirmDelete = true;
        $p('btnDeleteMe').textContent = '한 번 더 누르면 삭제돼요';
        $p('deleteMsg').textContent = '삭제하면 되돌릴 수 없어요. 같은 이메일로 다시 로그인하면 새 계정으로 시작해요.';
        return;
      }
      $p('btnDeleteMe').disabled = true;
      const { error } = await sb.rpc('delete_my_data');
      if (error) { $p('deleteMsg').textContent = '삭제하지 못했어요: ' + error.message; $p('btnDeleteMe').disabled = false; return; }
      await sb.auth.signOut();
      try { sessionStorage.setItem('deletedMe', '1'); } catch (e) {}
      location.reload();
    });
  }
  try {
    if (sessionStorage.getItem('deletedMe') && $p('loginMsg')) {
      sessionStorage.removeItem('deletedMe');
      $p('loginMsg').textContent = '이메일과 모의지원 내역을 모두 지웠어요.';
    }
  } catch (e) {}
  const fine = document.querySelector('.fine');
  if (fine) {
    const p = document.createElement('p');
    p.innerHTML = '<a href="./privacy.html">개인정보 처리방침</a> · 모의지원 기록은 2027.3.31.에 모두 삭제돼요.';
    fine.appendChild(p);
  }
})();

// 지원한 사람이 다시 들어오면 결과(순위표)를 바로 찾을 수 있게: 위쪽 바로가기 버튼 + #results 주소면 자동 이동
(function resultsShortcut() {
  const res = document.getElementById('results');
  if (!res) return;
  const bar = document.createElement('a');
  bar.href = '#results';
  bar.className = 'results-jump';
  bar.hidden = true;
  bar.textContent = '📊 내 모의지원 순위 보기';
  document.body.appendChild(bar);
  let jumped = false;
  const sync = () => {
    const ready = !res.hidden;
    bar.hidden = !ready;
    if (ready && !jumped && location.hash === '#results') { jumped = true; setTimeout(() => res.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300); }
  };
  new MutationObserver(sync).observe(res, { attributes: true, attributeFilter: ['hidden'] });
  bar.addEventListener('click', (e) => { e.preventDefault(); history.replaceState(null, '', '#results'); res.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  // 순위표가 화면에 보이는 동안은 버튼을 숨긴다
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { if (!res.hidden) bar.classList.toggle('away', e.isIntersecting); }).observe(res);
  // 안내는 모의지원 소개 문단(맨 위)에 둔다 — 사용자 제안(2026-11-09)
  const intro = document.querySelector('#apply .panel-head p');
  if (intro && !/다시 로그인/.test(intro.textContent)) {
    const em = document.createElement('strong');
    em.textContent = ' 이미 지원했다면 같은 이메일로 다시 로그인하면 내 순위표를 언제든 다시 볼 수 있어요.';
    intro.appendChild(em);
  }
  sync();
})();

// 순위 목록: 전체를 보여 주되 길면 위 12명만 펼쳐 두고 "전체 보기"로 펼친다. 내가 12위 밖이면 처음부터 다 펼친다.
(function ladderToggle() {
  const cards = document.getElementById('regionCards');
  if (!cards) return;
  const SHOW = 12;
  const apply = () => {
    for (const ol of cards.querySelectorAll('ol.ladder:not([data-t])')) {
      ol.dataset.t = '1';
      const items = [...ol.children];
      if (items.length <= SHOW) continue;
      const meIdx = items.findIndex(li => li.classList.contains('me'));
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'btn-ghost ladder-more';
      const set = (open) => {
        items.forEach((li, i) => { li.hidden = !open && i >= SHOW; });
        btn.textContent = open ? '접기' : `전체 ${items.length}명 보기`;
        btn.dataset.open = open ? '1' : '';
      };
      btn.addEventListener('click', () => set(!btn.dataset.open));
      ol.after(btn);
      set(meIdx >= SHOW);
    }
  };
  new MutationObserver(apply).observe(cards, { childList: true, subtree: true });
  apply();
})();
