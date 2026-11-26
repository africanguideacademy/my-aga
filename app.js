// My AGA — student portal front end
(function () {
  const CFG = window.MYAGA_CONFIG;
  const R = window.MyAgaRecs;
  const DEMO = !CFG.API_URL || /[?&]demo\b/.test(location.search);
  const $app = document.getElementById('app');
  const state = { token: '', me: null, docs: null, tab: 'overview' };

  // ---------- helpers ----------
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } },
    set(k, v) { try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch (e) { } }
  };
  // survives closing the browser: only the 'keep me logged in' device key
  const keep = {
    get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
    set(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { } }
  };
  function toast(msg, bad) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.className = 'toast', 3200);
  }
  async function api(payload) {
    if (DEMO) return window.MyAgaDemo.call(payload);
    try {
      const res = await fetch(CFG.API_URL, { method: 'POST', body: JSON.stringify(payload) }); // text/plain: no CORS preflight
      return await res.json();
    } catch (e) { return { ok: false, error: 'Could not reach the Academy system. Check your internet connection and try again.' }; }
  }
  // A remembered device gets a fresh session when the old one runs out
  async function resume() {
    const key = keep.get('myaga_device'); if (!key) return false;
    const r = await api({ portal: 'resume', deviceToken: key });
    if (r && r.ok) { state.token = r.token; store.set('myaga_token', r.token); return true; }
    keep.set('myaga_device', null); return false;
  }
  async function authed(payload) {
    let r = await api(Object.assign({ token: state.token }, payload));
    if (r && r.expired && await resume()) r = await api(Object.assign({ token: state.token }, payload));
    if (r && r.expired) { logout(true); }
    return r;
  }
  const fmtDate = d => {
    if (!d) return '';
    const t = new Date(String(d).length === 10 ? d + 'T00:00:00' : d);
    return isNaN(t) ? String(d) : t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const initials = s => ((s.firstNames || '?')[0] + (s.surname || '')[0]).toUpperCase();

  const IC = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 7v6M12 17h.01"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/></svg>',
    rifle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 14h14l6-4M6 14v4h3l1-4"/></svg>',
    walk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="13" cy="4" r="2"/><path d="M10 22l2-7 3 3v6M7 12l3-4 4 1 3 4"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/></svg>'
  };

  // ---------- login ----------
  function viewLogin(msg) {
    document.getElementById('logout-btn').hidden = true;
    document.getElementById('top-name').textContent = '';
    $app.innerHTML = `
      <div class="login">
        <div class="hero"><img src="brand/logo-white.png" alt=""><h1>My AGA</h1>
          <div class="sub">Your profile, progress and to-do list at African Guide Academy</div></div>
        <form class="card" id="login-form" autocomplete="on">
          ${DEMO ? '<div class="demo-banner">Demo mode: log in with <b>DEMO-0001</b> and PIN <b>123456</b>.</div><br>' : ''}
          ${msg ? `<div class="err">${esc(msg)}</div>` : ''}
          <div class="fld"><label for="sid">Student ID</label>
            <input id="sid" name="username" autocapitalize="characters" autocomplete="username" placeholder="e.g. STU-1A2B3C4D" required></div>
          <div class="fld"><label for="pin">PIN <span>(6 numbers)</span></label>
            <input id="pin" name="password" class="pin-input" type="password" inputmode="numeric" pattern="\\d{6}" maxlength="6" autocomplete="current-password" required></div>
          <label class="opt keep-in"><input type="checkbox" id="remember" checked><span>Keep me logged in on this device <small>(untick on a shared computer)</small></span></label>
          <button class="btn btn-primary btn-block" id="login-btn">Log in</button>
          <p class="hint" style="margin-top:14px">Your Student ID and first PIN are emailed to you when you book. Forgotten your PIN? Ask reservations or your trainer to reset it.</p>
          <a class="btn btn-block" href="#/book" style="margin-top:4px">New student? Book a course</a>
        </form>
      </div>`;
    const f = document.getElementById('login-form');
    const last = store.get('myaga_sid'); if (last) { f.sid.value = last; f.pin.focus(); }
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = document.getElementById('login-btn'); btn.disabled = true; btn.textContent = 'Checking…';
      const sid = f.sid.value.trim().toUpperCase();
      const remember = document.getElementById('remember').checked;
      const r = await api({ portal: 'login', studentId: sid, pin: f.pin.value.trim(), remember });
      if (!r.ok) return viewLogin(r.error);
      state.token = r.token; store.set('myaga_token', r.token); store.set('myaga_sid', sid);
      keep.set('myaga_device', remember && r.deviceToken ? r.deviceToken : null);
      if (r.mustChangePin) return viewChangePin(true);
      load();
    });
  }

  function viewChangePin(first) {
    $app.innerHTML = `
      <div class="login">
        <div class="hero"><img src="brand/logo-white.png" alt=""><h1>${first ? 'Choose your own PIN' : 'Change your PIN'}</h1>
          <div class="sub">${first ? 'Welcome! Replace the first-time PIN you received (usually by email when you booked) with a PIN only you know.' : 'Pick 6 numbers that are easy for you to remember.'}</div></div>
        <form class="card" id="pin-form">
          <div id="pin-msg"></div>
          <div class="fld"><label for="old">${first ? 'First-time PIN' : 'Current PIN'}</label>
            <input id="old" class="pin-input" type="password" inputmode="numeric" maxlength="6" autocomplete="current-password" required></div>
          <div class="fld"><label for="n1">New PIN</label>
            <input id="n1" class="pin-input" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" required></div>
          <div class="fld"><label for="n2">New PIN again</label>
            <input id="n2" class="pin-input" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" required></div>
          <button class="btn btn-primary btn-block" id="pin-btn">Save new PIN</button>
          ${first ? '' : '<button type="button" class="btn btn-block" style="margin-top:8px" id="pin-cancel">Cancel</button>'}
        </form>
      </div>`;
    const f = document.getElementById('pin-form');
    const cancel = document.getElementById('pin-cancel'); if (cancel) cancel.onclick = () => render();
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const m = document.getElementById('pin-msg');
      if (f.n1.value !== f.n2.value) { m.innerHTML = '<div class="err">The two new PINs are not the same.</div>'; return; }
      const btn = document.getElementById('pin-btn'); btn.disabled = true;
      const r = await authed({ portal: 'changePin', oldPin: f.old.value, newPin: f.n1.value });
      btn.disabled = false;
      if (!r.ok) { m.innerHTML = `<div class="err">${esc(r.error)}</div>`; return; }
      toast('Your new PIN is saved.');
      state.me ? render() : load();
    });
  }

  function logout(expired) {
    if (state.token && !expired) api({ portal: 'logout', token: state.token, deviceToken: keep.get('myaga_device') || '' });
    if (!expired) keep.set('myaga_device', null);   // logging out forgets this device
    state.token = ''; state.me = null; state.docs = null; store.set('myaga_token', '');
    viewLogin(expired ? 'Your session has ended. Please log in again.' : '');
  }

  // ---------- data ----------
  async function load() {
    $app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const r = await authed({ portal: 'me' });
    if (!r.ok) { if (!r.expired) viewLogin(r.error); return; }
    state.me = r;
    if (r.mustChangePin) return viewChangePin(true);
    document.getElementById('logout-btn').hidden = false;
    document.getElementById('top-name').textContent = r.student.firstNames + ' ' + r.student.surname;
    render();
    authed({ portal: 'docs' }).then(d => { state.docs = d.ok ? d.docs : []; if (state.tab === 'details') render(); });
    authed({ portal: 'materials' }).then(m => { state.materials = m && m.ok ? m : null; if (state.tab === 'overview') render(); });
    authed({ portal: 'workbooks' }).then(w => { state.workbooks = w && w.ok ? w : null; if (state.tab === 'overview') render(); });
  }

  // ---------- main view ----------
  function render() {
    const s = state.me.student;
    const recs = R.build(s);
    const pending = (state.me.bookings || []).filter(b => b.status === 'Invited').length;
    const todoCount = recs.filter(r => r.priority !== 'low').length + pending;
    const notes = R.allComments(s);
    const courses = (s.coursesData || []).slice().sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')));
    const ng = R.coursesOfType(s, 'Nature Guide')[0];
    const ngPct = ng ? overallPct(R.ngScores(s, ng)) : R.num(s.natureGuidePct);
    const walk = (s.lifetimeStats || {}).walkTotalHrs;

    const avatar = s.photoThumb ? `<img class="avatar" src="${esc(s.photoThumb)}" alt="">` : `<div class="avatar">${esc(initials(s))}</div>`;
    const quals = String(s.qualification || '').split(',').map(q => q.trim()).filter(Boolean);
    const tabs = [['overview', 'To do', IC.list, todoCount], ['progress', 'My progress', IC.chart], ['notes', 'Trainer notes', IC.chat, notes.length], ['details', 'My details', IC.user]];

    $app.innerHTML = `
      ${DEMO ? '<div class="demo-banner">Demo mode: this is a made-up student, and nothing is saved.</div>' : ''}
      <section class="hero">
        <div class="hero-row">${avatar}
          <div><h1>${esc(s.firstNames)} ${esc(s.surname)}</h1>
            <div class="sub">Student ID ${esc(s.studentId)}${s.lastUpdated ? ' · profile updated ' + esc(fmtDate(s.lastUpdated)) : ''}</div>
            <div class="chips">${quals.map(q => `<span class="chip">${esc(q)}</span>`).join('')}</div></div>
        </div>
        <div class="stats">
          <div class="stat"><b>${courses.length}</b><span>Course${courses.length === 1 ? '' : 's'} attended</span></div>
          <div class="stat"><b>${ngPct != null ? ngPct + '%' : '—'}</b><span>Nature Guide theory</span></div>
          <div class="stat"><b>${walk ? esc(walk) : '—'}</b><span>Walking hours</span></div>
          <div class="stat"><b>${todoCount}</b><span>Thing${todoCount === 1 ? '' : 's'} to do</span></div>
        </div>
      </section>
      <nav class="tabs">${tabs.map(([id, label, ic, n]) => `<button class="tab${state.tab === id ? ' on' : ''}" data-tab="${id}">${label}${n ? ` <span class="n">${n}</span>` : ''}</button>`).join('')}</nav>
      <div id="tab-body"></div>`;
    $app.querySelectorAll('.tab').forEach(b => b.onclick = () => { state.tab = b.dataset.tab; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    const body = document.getElementById('tab-body');
    if (state.tab === 'overview') { body.innerHTML = tabOverview(s, recs, courses, notes); wireBookings(body); }
    if (state.tab === 'progress') body.innerHTML = tabProgress(s, courses);
    if (state.tab === 'notes') body.innerHTML = tabNotes(notes);
    if (state.tab === 'details') { body.innerHTML = tabDetails(s); wireDetails(s); }
    const sa = document.getElementById('show-all'); if (sa) sa.onclick = () => { state.showAll = true; render(); };
    body.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { state.tab = b.dataset.go; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  function overallPct(scores) {
    const got = scores.filter(m => m.score != null);
    if (!got.length) return null;
    const sc = got.reduce((a, m) => a + m.score, 0), mx = got.reduce((a, m) => a + m.max, 0);
    return mx ? Math.round(sc / mx * 1000) / 10 : null;
  }

  function recList(recs) {
    if (!recs.length) return '<div class="all-good">You’re all up to date. Keep studying with the Pocket Guide!</div>';
    const SHOW = 6, more = recs.length - SHOW;
    return '<ul class="todo" id="todo">' + recs.map((r, i) => `
      <li class="${r.priority}"${i >= SHOW && !state.showAll ? ' hidden' : ''}><div class="dot">${r.priority === 'low' ? IC.check : r.priority === 'high' ? IC.alert : IC.up}</div>
        <div><span class="area">${esc(r.area)}</span><b>${esc(r.title)}</b>${r.text ? `<p>${esc(r.text)}</p>` : ''}
          ${r.actions.length ? `<div class="act">${r.actions.map(a => a.tab ? `<button class="btn" data-go="${a.tab}">${esc(a.label)}</button>`
            : `<a class="btn" href="${esc(a.href)}" target="_blank" rel="noopener">${esc(a.label)}</a>`).join('')}</div>` : ''}
        </div></li>`).join('') + '</ul>' +
      (more > 0 && !state.showAll ? `<div class="form-actions"><button class="btn" id="show-all">Show all ${recs.length}</button></div>` : '');
  }

  // Upcoming bookings: the student confirms or declines their place
  // One card per booking: all its 2-week parts together, with the invoice
  function myBookings() {
    const by = {}, out = [];
    (state.me.bookings || []).forEach(b => { const k = b.groupRef || b.bookingId; if (!by[k]) { by[k] = { parts: [] }; out.push(by[k]); } by[k].parts.push(b); });
    return out.map(g => {
      g.parts.sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
      const f = g.parts[0], last = g.parts[g.parts.length - 1], inv = g.parts.find(p => p.invoiceNo) || {};
      return Object.assign({}, f, { parts: g.parts, endDate: last.endDate || f.endDate, popOn: g.parts.map(p => p.popOn).filter(Boolean)[0] || '',
        invoiceNo: inv.invoiceNo || '', invoiceUrl: inv.invoiceUrl || '', invoiceTotal: inv.invoiceTotal || 0, amountPaid: inv.amountPaid || 0, invoiceCurrency: inv.invoiceCurrency || '' });
    });
  }
  const money = (cur, v) => ({ EUR: 'EUR', USD: 'USD', BWP: 'P' }[cur] || cur || '') + ' ' + (Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function invoiceBox(b) {
    if (!b.invoiceNo) return '';
    const due = Math.max(0, (b.invoiceTotal || 0) - (b.amountPaid || 0));
    return `<div class="inv-box"><div><b>Invoice ${esc(b.invoiceNo)}</b>${b.invoiceTotal ? `<span>Total ${esc(money(b.invoiceCurrency, b.invoiceTotal))} · Paid ${esc(money(b.invoiceCurrency, b.amountPaid))} · ${due > 0.004 ? '<b>Due ' + esc(money(b.invoiceCurrency, due)) + '</b>' : '<b>Paid in full</b>'}</span>` : ''}</div>
      ${b.invoiceUrl ? `<a class="btn" href="${esc(b.invoiceUrl)}" target="_blank" rel="noopener">View invoice</a>` : ''}</div>`;
  }
  function bookingCards() {
    const today = new Date().toISOString().slice(0, 10);
    const list = myBookings().filter(b => b.status === 'Invited' || !b.endDate || b.endDate >= today);
    if (!list.length) return '';
    return list.map(b => {
      const when = b.startDate ? fmtDate(b.startDate) + (b.endDate ? ' – ' + fmtDate(b.endDate) : '') : 'Dates to be confirmed';
      const head = `<div class="bk-when"><b>${esc(b.courseType)} · ${esc(b.parts.map(p => p.courseCode).join(' + '))}</b><span>${esc(when)}${b.parts.length > 1 ? ' · ' + b.parts.length + ' parts' : b.venue ? ' · ' + esc(b.venue) : ''}</span></div>` +
        (b.parts.length > 1 ? `<ul class="bk-parts">${b.parts.map(p => `<li>${esc(p.courseCode)} · ${esc(fmtDate(p.startDate))}${p.endDate ? ' – ' + esc(fmtDate(p.endDate)) : ''}${p.camp ? ' · ' + esc(p.camp) : ''}</li>`).join('')}</ul>` : '') + invoiceBox(b);
      // The place is confirmed once the deposit is received
      const popBtn = `<div class="form-actions"><button class="btn btn-primary" data-pop="${esc(b.bookingId)}">Upload proof of payment</button>${b.popOn ? `<span class="hint">✓ Proof of payment received ${esc(fmtDate(b.popOn))}</span>` : ''}</div>`;
      if (b.status === 'Deposit paid' || b.status === 'Paid in full') return `<div class="card full booking ok-b"><h2>${IC.check} Your place is confirmed</h2>${head}
        <p class="hint" style="margin:8px 0 0">${b.status === 'Paid in full' ? 'Paid in full, thank you.' : 'Deposit received, thank you.'} Before the course, please make sure your details, photo and passport copy are up to date.</p>
        ${b.status === 'Deposit paid' ? `<div class="form-actions"><button class="btn" data-pop="${esc(b.bookingId)}">Upload proof of payment for the balance</button></div>` : ''}</div>`;
      if (b.status === 'Confirmed' || b.status === 'Form received' || b.status === 'Invoiced') {
        const steps = ['Form received', 'Invoiced', 'Deposit paid', 'Place confirmed'], at = b.status === 'Invoiced' ? 1 : 0;
        return `<div class="card full booking"><h2>${IC.cal} Your booking</h2>${head}
          <div class="chips" style="margin-top:10px">${steps.map((s, i) => `<span class="badge ${i <= at ? 'pass' : 'pend'}">${i <= at ? '✓ ' : ''}${s}</span>`).join('')}</div>
          <p class="hint" style="margin:8px 0 0">${b.status === 'Invoiced' ? 'Your invoice has been sent. Please pay the deposit using your invoice number as the reference, then upload your proof of payment here.'
            : b.status === 'Confirmed' ? 'Thank you for confirming you will attend. Your place is confirmed once your deposit is received.'
            : 'Thank you for your booking. Reservations will send your invoice; your place is provisional until the deposit is paid.'}</p>
          ${b.status !== 'Form received' || b.popOn ? popBtn : ''}</div>`;
      }
      if (b.status === 'Released') return `<div class="card full booking no-b"><h2>${IC.alert} This provisional booking was released</h2>${head}
        <p class="hint" style="margin:8px 0 0">We didn’t receive your deposit, so the place was freed for another student. Still want to come? Email <a href="mailto:reservations@guidetrainingcourses.com">reservations@guidetrainingcourses.com</a> and we’ll re-book you: your details are kept.</p></div>`;
      if (b.status === 'Declined' || b.status === 'Cancelled') return `<div class="card full booking no-b"><h2>${IC.alert} ${b.status === 'Cancelled' ? 'This booking was cancelled' : 'You declined this course'}</h2>${head}
        <p class="hint" style="margin:8px 0 0">Changed your mind? Contact AGA reservations and we’ll do our best to help.</p></div>`;
      return `<div class="card full booking" data-bk="${esc(b.bookingId)}"><h2>${IC.cal} Please confirm your place</h2>${head}
        <div class="form-actions"><button class="btn btn-primary" data-resp="Confirmed">Yes, I’ll be there</button>
          <button class="btn" data-resp="Declined">I can’t attend</button></div>
        <div class="decline" hidden><div class="fld" style="margin-top:12px"><label>Please tell us why</label>
          <input maxlength="300" placeholder="e.g. new job, family reasons, need a later date"></div>
          <div class="form-actions"><button class="btn btn-primary" data-send>Send</button><button class="btn" data-cancel>Cancel</button></div></div></div>`;
    }).join('');
  }
  function wireBookings(root) {
    // "Upload proof of payment": go to My documents with the type preselected
    root.querySelectorAll('[data-pop]').forEach(btn => btn.onclick = () => {
      state.popBooking = btn.dataset.pop; state.tab = 'details'; render();
      const sel = document.getElementById('doc-type'); if (sel) sel.value = 'Proof of payment';
      const card = sel && sel.closest('.card'); if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast('Choose your proof of payment file (PDF or photo).');
    });
    root.querySelectorAll('[data-bk]').forEach(card => {
      const id = card.dataset.bk, dec = card.querySelector('.decline');
      const send = async (response, reason) => {
        card.querySelectorAll('button').forEach(b => b.disabled = true);
        const r = await authed({ portal: 'respondBooking', bookingId: id, response, reason });
        if (!r.ok) { toast(r.error, true); card.querySelectorAll('button').forEach(b => b.disabled = false); return; }
        const b = state.me.bookings.find(x => x.bookingId === id); if (b) b.status = r.status;
        toast(r.status === 'Confirmed' ? 'Thank you, your place is confirmed!' : 'Thank you for letting us know.');
        render();
      };
      card.querySelector('[data-resp=Confirmed]').onclick = () => send('Confirmed');
      card.querySelector('[data-resp=Declined]').onclick = () => { dec.hidden = false; dec.querySelector('input').focus(); };
      card.querySelector('[data-cancel]').onclick = () => { dec.hidden = true; };
      card.querySelector('[data-send]').onclick = () => {
        const why = dec.querySelector('input').value.trim();
        if (!why) { toast('Please tell us why you can’t attend.', true); return; }
        send('Declined', why);
      };
    });
  }

  // Course materials (manual, workbooks, apps): open once the deposit is received
  function materialsCard() {
    const m = state.materials;
    if (!m || !(state.me.bookings || []).length) return '';
    if (m.locked) return `<div class="card full"><h2>${IC.file} Course materials 🔒</h2><p class="hint" style="margin:0">${esc(m.message)}</p></div>`;
    const list = m.materials || [];
    if (!list.length) return `<div class="card full"><h2>${IC.file} Course materials</h2><p class="hint" style="margin:0">${esc(m.message || '')}</p></div>`;
    // Tidy groups, each folds open on its own: the 13 printable workbooks get their own group
    const groups = {}, order = [];
    const add = (g, x) => { if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(x); };
    list.forEach(x => add(/^Workbook \d/i.test(x.name) ? 'Nature Guide workbooks (PDF to download or print)' : x.group === 'All courses' ? 'For every course: books, apps, maps and forms' : x.group + ' course', x));
    order.sort((a, b) => (/^For every/.test(a) ? 0 : /workbooks/.test(a) ? 2 : 1) - (/^For every/.test(b) ? 0 : /workbooks/.test(b) ? 2 : 1));
    const html = order.map(g => `<details class="mat-det"><summary><span>${esc(g)}</span><span class="mat-n">${groups[g].length}</span></summary>
      <ul class="mat-list">${groups[g].map(x => `<li>${IC.file}<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a></li>`).join('')}</ul></details>`).join('');
    return `<div class="card full"><h2>${IC.file} Course materials</h2><p class="hint">Your manual, workbooks and apps for your course. Tap a group to open it.</p>${html}</div>`;
  }

  // Apps and course links open once a deposit is received. Students with past courses and
  // no booking on the new system (our earlier students) keep their access.
  function unlocked() {
    const bks = state.me.bookings || [];
    if (bks.some(b => b.status === 'Deposit paid' || b.status === 'Paid in full')) return true;
    return !bks.length && (state.me.student.coursesData || []).length > 0;
  }
  function tabOverview(s, recs, courses, notes) {
    const latestNote = notes[0];
    const wbs = state.workbooks, wbCard = wbs && window.MyAgaWorkbook ? window.MyAgaWorkbook.card(wbs.workbooks, wbs.locked, wbs.message) : '';
    return `<div class="grid">${bookingCards()}${wbCard}${materialsCard()}
      <div class="card full"><h2>${IC.list} Your to-do list</h2>
        <p class="hint">Made from your latest results, trainer scores and profile. Red first, then orange; green means well done.</p>
        ${recList(recs)}</div>
      <div class="card"><h2>${IC.cal} Your courses</h2>
        ${courses.length ? '<ul class="courses">' + courses.map(c => `<li class="course"><div class="ic">${c.type === 'Trails Guide' ? 'TG' : 'NG'}</div>
          <div><b>${esc(c.type || 'Course')} · ${esc(c.code)}</b><span>${esc(fmtDate(c.startDate))}${c.endDate ? ' – ' + esc(fmtDate(c.endDate)) : ''}${c.venue ? ' · ' + esc(c.venue) : ''}${c.trainer ? ' · ' + esc(c.trainer) : ''}</span></div></li>`).join('') + '</ul>'
          : '<p class="hint">No courses recorded yet.</p>'}</div>
      <div class="card"><h2>${IC.chat} Latest from your trainer</h2>
        ${latestNote ? noteHtml(latestNote) + (notes.length > 1 ? `<div class="form-actions"><button class="btn" data-go="notes">See all ${notes.length} notes</button></div>` : '') : '<p class="hint">No trainer notes yet.</p>'}</div>
      ${unlocked() ? `<div class="card full"><h2>${IC.book} Study tools</h2>
        <p class="hint">Quizzes, the manual and exam practice, all in the AGA Pocket Guide.</p>
        <div class="form-actions" style="margin-top:0">
          <a class="btn btn-primary" href="${esc(CFG.POCKET_GUIDE)}" target="_blank" rel="noopener">Open Pocket Guide</a>
          <a class="btn" href="${esc(CFG.POCKET_GUIDE)}#/exam" target="_blank" rel="noopener">Exam practice</a>
          <a class="btn" href="${esc(CFG.POCKET_GUIDE)}#/weak" target="_blank" rel="noopener">My weak spots</a></div></div>`
        : `<div class="card full"><h2>${IC.book} Study tools 🔒</h2><p class="hint" style="margin:0">The Pocket Guide, quizzes and exam practice open here once your deposit has been received.</p></div>`}
    </div>`;
  }

  function bars(rows, opts) {
    opts = opts || {};
    return '<div class="bars">' + rows.map(r => {
      const p = opts.ten ? (r.score == null ? null : r.score * 10) : r.pct;
      const cls = p == null ? 'none' : p >= (opts.ten ? 70 : CFG.PASS_MARK) ? '' : p >= 50 ? 'mid' : 'low';
      const val = r.score == null ? '—' : opts.ten ? r.score + '/10' : r.pct + '%';
      return `<div class="bar-row" title="${r.score == null ? 'Not assessed yet' : opts.ten ? r.score + ' out of 10' : r.score + ' out of ' + r.max}"><span class="lbl">${esc(r.label)}</span><span class="val">${val}</span>
        <div class="bar"><i class="${cls}" style="width:${p == null ? 0 : Math.min(100, p)}%"></i>${opts.ten ? '' : `<span class="pass" style="left:${CFG.PASS_MARK}%"></span>`}</div></div>`;
    }).join('') + '</div>';
  }
  const badge = p => p == null ? '<span class="badge pend">Not yet</span>' : p >= CFG.PASS_MARK ? '<span class="badge pass">PASS ' + p + '%</span>' : '<span class="badge fail">' + p + '%</span>';

  function tabProgress(s, courses) {
    const out = [];
    const ngCourses = R.coursesOfType(s, 'Nature Guide'), tgCourses = R.coursesOfType(s, 'Trails Guide');
    ngCourses.forEach(c => {
      const sc = R.ngScores(s, c);
      out.push(`<div class="card"><h2>${IC.book} Nature Guide theory</h2><p class="hint">${esc(c.code)} · ${esc(fmtDate(c.startDate))} · overall ${badge(overallPct(sc))}. The line marks the ${CFG.PASS_MARK}% pass mark.</p>${bars(sc)}
        ${c.assessment && c.assessment.natureGuidePractical ? `<h3>Practical</h3><p>${esc(c.assessment.natureGuidePractical)}</p>` : ''}</div>`);
    });
    if (!ngCourses.length && s.modules && Object.values(s.modules).some(v => v)) {
      const sc = R.ngScores(s, null);
      out.push(`<div class="card"><h2>${IC.book} Nature Guide theory</h2><p class="hint">Overall ${badge(overallPct(sc))}</p>${bars(sc)}</div>`);
    }
    tgCourses.forEach(c => {
      const sc = R.trailsScores(s, c);
      const arh = (c.assessment && c.assessment.arh) || {};
      out.push(`<div class="card"><h2>${IC.walk} Trails Guide theory</h2><p class="hint">${esc(c.code)} · ${esc(fmtDate(c.startDate))} · overall ${badge(overallPct(sc))}</p>${bars(sc)}
        <h3>Advanced Rifle Handling</h3><table class="tbl">${R.ARH.map(([k, l]) => `<tr><td>${esc(l)}</td><td class="num">${arh[k] === 'Yes' ? '<span class="badge pass">Competent</span>' : arh[k] === 'No' ? '<span class="badge fail">Not yet</span>' : '<span class="badge pend">—</span>'}</td></tr>`).join('')}</table></div>`);
    });
    const groups = [['attributes', 'General attributes'], ['comm', 'Communication'], ['guiding', 'Guiding skills']];
    const used = {};
    const attrHtml = groups.map(([g, label]) => {
      const c = R.latestWith(s, g); if (c) used[c.code] = 1;
      const rows = R.attrScores(s, c, g); return rows.some(r => r.score != null) ? `<h3>${label}</h3>${bars(rows, { ten: true })}` : '';
    }).join('');
    const codes = Object.keys(used);
    if (attrHtml) out.push(`<div class="card"><h2>${IC.star} Attributes and guiding skills</h2><p class="hint">Scored 1–10 by your trainer${codes.length ? ' on ' + esc(codes.join(', ')) : ''}.</p>${attrHtml}</div>`);

    const ls = s.lifetimeStats || {}, e = ls.encounters || {};
    const encRows = [['eb', 'Elephant bull'], ['ec', 'Elephant cow'], ['bb', 'Buffalo bull'], ['bc', 'Buffalo cow'], ['lion', 'Lion / leopard']];
    if (ls.walkTotalHrs || Object.values(e).some(v => +v)) out.push(`<div class="card"><h2>${IC.walk} Walking and encounters</h2><p class="hint">Your totals across all courses.</p>
      <table class="tbl"><tr><th>Walking hours</th><th class="num">Hours</th></tr>
        <tr><td>Lead</td><td class="num">${esc(ls.walkLeadHrs || 0)}</td></tr><tr><td>Back-up</td><td class="num">${esc(ls.walkBackupHrs || 0)}</td></tr>
        <tr><td>Participant</td><td class="num">${esc(ls.walkParticipHrs || 0)}</td></tr><tr><td><b>Total</b></td><td class="num"><b>${esc(ls.walkTotalHrs || 0)}</b></td></tr></table>
      <h3>Dangerous game encounters on foot</h3><div class="scroll-x"><table class="tbl"><tr><th></th><th class="num">Lead</th><th class="num">Back-up</th><th class="num">Participant</th></tr>
        ${encRows.map(([k, l]) => `<tr><td>${l}</td><td class="num">${esc(e[k + 'Lead'] || 0)}</td><td class="num">${esc(e[k + 'Bu'] || 0)}</td><td class="num">${esc(e[k + 'Part'] || 0)}</td></tr>`).join('')}</table></div></div>`);

    const bm = (s.benchmarkingData || []).slice().sort((a, b) => String(b.year).localeCompare(String(a.year)));
    if (bm.length) out.push(`<div class="card"><h2>${IC.chart} Benchmarking exams</h2><p class="hint">The yearly industry benchmarking exam.</p><div class="scroll-x"><table class="tbl">
      <tr><th>Year</th><th class="num">Theory</th><th class="num">Slides</th><th class="num">Sounds</th><th class="num">Overall</th></tr>
      ${bm.map(b => `<tr><td>${esc(b.year)}</td>${['theory', 'slides', 'sounds', 'overall'].map(k => { const p = R.pct(b[k + 'Score'], b[k + 'Max']); return `<td class="num">${p == null ? '—' : badge(p)}</td>`; }).join('')}</tr>`).join('')}</table></div></div>`);

    const mem = [];
    if (s.bqaNo) mem.push(['BQA registration', s.bqaNo]);
    if (s.fgasaNo) mem.push(['FGASA registration', s.fgasaNo]);
    if (mem.length || s.fileUrl) out.push(`<div class="card"><h2>${IC.file} Registration and records</h2><table class="tbl">${mem.map(([l, v]) => `<tr><td>${l}</td><td class="num">${esc(v)}</td></tr>`).join('')}</table>
      ${s.fileUrl ? `<div class="form-actions"><a class="btn" href="${esc(s.fileUrl)}" target="_blank" rel="noopener">Download my profile (PDF)</a></div>` : ''}</div>`);

    if (!out.length) return '<div class="grid"><div class="card full"><p class="hint">No results have been recorded yet. They appear here as soon as your trainer captures them.</p></div></div>';
    return '<div class="grid">' + out.join('') + '</div>';
  }

  function noteHtml(n) {
    return `<div class="note"><div class="meta"><b>${esc(n.area)}</b>${n.trainer ? ' · ' + esc(n.trainer) : ''}${n.course ? ' · ' + esc(n.course) : ''}${n.date ? ' · ' + esc(fmtDate(n.date)) : ''}</div><p>${esc(n.text)}</p></div>`;
  }
  function tabNotes(notes) {
    return `<div class="grid"><div class="card full"><h2>${IC.chat} Notes from your trainers</h2><p class="hint">Feedback written on your courses, newest first.</p>
      ${notes.length ? '<div class="notes">' + notes.map(noteHtml).join('') + '</div>' : '<p class="hint">No trainer notes yet.</p>'}</div></div>`;
  }

  // ---------- details, photo, documents ----------
  const FIELDS = [
    ['surname', 'Surname', 'locked'], ['firstNames', 'First names', 'locked'], ['nickname', 'Nickname', 'text'],
    ['gender', 'Gender', ['', 'Male', 'Female', 'Other', 'Prefer not to say']], ['nationality', 'Nationality', 'text'],
    ['omangPassport', 'Omang / passport number', 'text'], ['passportExpiry', 'Passport expiry date', 'date'],
    ['dateOfBirth', 'Date of birth', 'date'], ['placeOfBirth', 'Place of birth', 'text'],
    ['cellNumber', 'Cell number', 'tel'], ['email', 'Email address', 'email'],
    ['employerPrivate', 'Employer (or "Private")', 'text'], ['highestEducation', 'Highest education', 'text'],
    ['firstAidCert', 'Valid First Aid certificate?', ['', 'Yes', 'No', 'Expired']], ['driversLicence', 'Driver’s licence?', ['', 'Yes', 'No', 'Learner']],
    ['bqaNo', 'BQA registration number', 'text'], ['fgasaNo', 'FGASA registration number', 'text']
  ];
  function tabDetails(s) {
    const field = ([k, label, type]) => {
      const v = s[k] || '';
      if (type === 'locked') return `<div class="fld"><label>${label} <span>(contact the Academy to change)</span></label><input value="${esc(v)}" readonly></div>`;
      if (Array.isArray(type)) return `<div class="fld"><label for="f-${k}">${label}</label><select id="f-${k}" name="${k}">${type.map(o => `<option value="${esc(o)}"${o === v ? ' selected' : ''}>${o || 'Select…'}</option>`).join('')}${v && !type.includes(v) ? `<option selected>${esc(v)}</option>` : ''}</select></div>`;
      return `<div class="fld"><label for="f-${k}">${label}</label><input id="f-${k}" name="${k}" type="${type}" value="${esc(v)}"${type === 'email' ? ' autocomplete="email"' : type === 'tel' ? ' autocomplete="tel"' : ''}></div>`;
    };
    const docs = state.docs;
    return `<div class="grid">
      <form class="card full" id="details-form"><h2>${IC.user} My personal details</h2>
        <p class="hint">Please keep these correct. They are used for your certificates and BQA/FGASA registration. Changes save straight to your AGA profile.</p>
        <div class="form">${FIELDS.map(field).join('')}</div>
        <div class="form-actions"><button class="btn btn-primary" id="save-details">Save changes</button><span class="note-s" id="dirty-note"></span></div>
      </form>
      <div class="card"><h2>${IC.user} Profile photo</h2><p class="hint">A clear, passport-style photo: face the camera, plain background, no sunglasses or hat.</p>
        <div class="photo-edit">${s.photoThumb ? `<img class="avatar" src="${esc(s.photoThumb)}" alt="">` : `<div class="avatar">${esc(initials(s))}</div>`}
          <label class="btn btn-primary">Upload new photo<input type="file" id="photo-in" accept="image/*" hidden></label></div>
        <div id="photo-msg" style="margin-top:10px"></div></div>
      <div class="card"><h2>${IC.file} My documents</h2><p class="hint">Upload copies of your passport/Omang, certificates and CV. They are saved in your AGA student folder. PDF or photo, max 10 MB.</p>
        <div class="upload">
          <div class="fld"><label for="doc-type">What are you uploading?</label><select id="doc-type">${(state.me.docTypes || []).map(t => `<option>${esc(t)}</option>`).join('')}</select></div>
          <label class="drop"><input type="file" id="doc-in" accept="application/pdf,image/*"><b>Choose a file</b><span>or take a photo with your phone</span></label>
          <div id="doc-msg"></div>
        </div>
        <h3>Uploaded</h3>
        ${docs == null ? '<p class="hint">Loading…</p>' : docs.length ? '<ul class="files">' + docs.map(d => `<li>${IC.file}<a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.name)}</a><span>${esc(d.date)}</span></li>`).join('') + '</ul>' : '<p class="hint">Nothing uploaded yet.</p>'}
      </div>
      <div class="card full"><h2>${IC.key} PIN</h2><p class="hint">Change the 6-number PIN you use to log in to My AGA.</p><button class="btn" id="change-pin">Change my PIN</button></div>
    </div>`;
  }

  function wireDetails(s) {
    const f = document.getElementById('details-form');
    const original = {}; FIELDS.forEach(([k, , t]) => { if (t !== 'locked') original[k] = s[k] || ''; });
    const changes = () => { const c = {}; Object.keys(original).forEach(k => { const v = f.elements[k].value.trim(); if (v !== original[k]) c[k] = v; }); return c; };
    f.addEventListener('input', () => {
      const c = changes();
      f.querySelectorAll('.fld').forEach(d => { const i = d.querySelector('[name]'); d.classList.toggle('changed', !!(i && i.name in c)); });
      document.getElementById('dirty-note').textContent = Object.keys(c).length ? Object.keys(c).length + ' unsaved change(s)' : '';
    });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const c = changes(); if (!Object.keys(c).length) { toast('Nothing has changed.'); return; }
      const btn = document.getElementById('save-details'); btn.disabled = true; btn.textContent = 'Saving…';
      const r = await authed({ portal: 'updateDetails', fields: c });
      btn.disabled = false; btn.textContent = 'Save changes';
      if (!r.ok) { toast(r.error, true); return; }
      Object.assign(s, c); toast('Your details are saved.'); render();
    });
    document.getElementById('change-pin').onclick = () => viewChangePin(false);

    document.getElementById('photo-in').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      const m = document.getElementById('photo-msg'); m.innerHTML = '<p class="hint">Uploading…</p>';
      try {
        const img = await shrinkImage(file, 900);
        const r = await authed({ portal: 'uploadPhoto', base64: img.base64, mimeType: img.mimeType });
        if (!r.ok) { m.innerHTML = `<div class="err">${esc(r.error)}</div>`; return; }
        s.photoUrl = s.photoUrl || 'set'; s.photoThumb = r.photoThumb; toast('Your photo is saved.'); render();
      } catch (x) { m.innerHTML = '<div class="err">That photo could not be read. Try a JPG or PNG.</div>'; }
    };
    document.getElementById('doc-in').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      const m = document.getElementById('doc-msg');
      if (file.size > 10 * 1024 * 1024 && !/^image\//.test(file.type)) { m.innerHTML = '<div class="err">That file is bigger than 10 MB.</div>'; return; }
      m.innerHTML = '<p class="hint">Uploading ' + esc(file.name) + '…</p>';
      try {
        const data = /^image\//.test(file.type) ? await shrinkImage(file, 2000) : await readFile(file);
        const docType = document.getElementById('doc-type').value, isPop = docType === 'Proof of payment';
        const r = await authed({ portal: 'uploadDoc', base64: data.base64, mimeType: data.mimeType, fileName: file.name, docType,
          bookingId: isPop ? (state.popBooking || '') : '' });
        if (!r.ok) { m.innerHTML = `<div class="err">${esc(r.error)}</div>`; return; }
        if (isPop) {   // show it on the booking card straight away
          const today = new Date().toISOString().slice(0, 10);
          (state.me.bookings || []).forEach(b => { if (!state.popBooking || b.bookingId === state.popBooking) b.popOn = today; });
          state.popBooking = '';
        }
        toast(isPop ? 'Proof of payment sent to AGA reservations. Thank you!' : 'Saved to your AGA folder.');
        const d = await authed({ portal: 'docs' }); state.docs = d.ok ? d.docs : state.docs; render();
      } catch (x) { m.innerHTML = '<div class="err">That file could not be read.</div>'; }
    };
  }

  function readFile(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res({ base64: String(fr.result).split(',')[1], mimeType: file.type || 'application/pdf' });
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  // Phone photos are large: resize to at most maxPx on the long side, as JPEG
  function shrinkImage(file, maxPx) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const k = Math.min(1, maxPx / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        res({ base64: c.toDataURL('image/jpeg', 0.85).split(',')[1], mimeType: 'image/jpeg' });
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')); };
      img.src = url;
    });
  }

  // ---------- start ----------
  document.getElementById('logout-btn').onclick = () => logout(false);
  // #/book = the public booking form; anything else = My AGA (login)
  function route() {
    if (/^#\/book/.test(location.hash)) return window.MyAgaBook.render($app);
    state.token = store.get('myaga_token');
    const wbm = location.hash.match(/^#\/wb\/(\w+)/);
    if (wbm) {   // a digital workbook (workbook.js)
      const open = () => { document.getElementById('logout-btn').hidden = false; window.scrollTo(0, 0);
        window.MyAgaWorkbook.render($app, wbm[1], { authed, toast, shrinkImage }); };
      if (state.token) return open();
      return resume().then(ok => ok ? open() : viewLogin());
    }
    if (state.me && /^#\/?$/.test(location.hash)) { state.tab = 'overview'; render(); authed({ portal: 'workbooks' }).then(w => { state.workbooks = w && w.ok ? w : null; if (state.tab === 'overview' && !location.hash.startsWith('#/wb')) render(); }); return; }
    if (state.token) return load();
    resume().then(ok => ok ? load() : viewLogin());
  }
  window.addEventListener('hashchange', route);
  route();
})();
