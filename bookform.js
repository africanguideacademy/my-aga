// My AGA — the digital AGA Course Booking Form (#/book, no login needed)
// Same sections as the paper form. On submit the Academy system creates the
// student's profile and emails them their My AGA login.
(function () {
  const CFG = window.MYAGA_CONFIG;
  const DEMO = !CFG.API_URL || /[?&]demo\b/.test(location.search);
  const DRAFT_KEY = 'myaga_booking_draft';
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  async function api(payload) {
    if (DEMO) return demoApi(payload);
    try { const r = await fetch(CFG.API_URL, { method: 'POST', body: JSON.stringify(payload) }); return await r.json(); }
    catch (e) { return { ok: false, error: 'Could not reach the Academy. Check your internet connection and try again.' }; }
  }
  async function demoApi(p) {
    await new Promise(r => setTimeout(r, 400));
    if (p.portal === 'courses') return { ok: true, kalahariFrom: '2027-06-01', docs: DOCS.map(d => d[0]), parts: [
      { code: '2702 KWP NG-A', type: 'Nature Guide', part: 'A', startDate: '2027-02-05', endDate: '2027-02-19', kwpLeft: 13, klhLeft: 0 },
      { code: '2702 KWP NG-B', type: 'Nature Guide', part: 'B', startDate: '2027-02-19', endDate: '2027-03-05', kwpLeft: 0, klhLeft: 0 },
      { code: '2707 KWP NG-A', type: 'Nature Guide', part: 'A', startDate: '2027-06-25', endDate: '2027-07-09', kwpLeft: 9, klhLeft: 8 },
      { code: '2707 KWP NG-B', type: 'Nature Guide', part: 'B', startDate: '2027-07-09', endDate: '2027-07-23', kwpLeft: 11, klhLeft: 6 },
      { code: '2710 KWP TG-A', type: 'Trails Guide', part: 'A', startDate: '2027-10-01', endDate: '2027-10-15', kwpLeft: 7, klhLeft: 0 }] };
    if (p.portal === 'bookingForm') return { ok: true, bookingId: 'BK-DEMO', studentId: 'STU-DEMO', loginSentTo: 'same' };
    return { ok: false };
  }
  const DOCS = CFG.BOOKING_DOCS || [];
  const fmt = d => { if (!d) return ''; const t = new Date(d + 'T00:00:00'); return isNaN(t) ? d : t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const CAMPS = ['Kwapa Training Camp (Okavango Delta) - 28 days', 'Kalahari Training Camp - 28 days',
    '14 days Kwapa + 14 days Kalahari', 'No preference'];

  // ---------- small form builders ----------
  const txt = (k, label, o = {}) => `<div class="fld${o.wide ? ' wide' : ''}"><label for="b-${k}">${label}${o.req ? ' *' : ''}${o.hint ? ` <span>${o.hint}</span>` : ''}</label>
    <input id="b-${k}" name="${k}" type="${o.type || 'text'}"${o.req ? ' required' : ''}${o.ac ? ` autocomplete="${o.ac}"` : ''}${o.ph ? ` placeholder="${esc(o.ph)}"` : ''}${o.max ? ` maxlength="${o.max}"` : ''}></div>`;
  const area = (k, label, o = {}) => `<div class="fld wide"><label for="b-${k}">${label}${o.hint ? ` <span>${o.hint}</span>` : ''}</label>
    <textarea id="b-${k}" name="${k}" rows="2" maxlength="${o.max || 250}"${o.ph ? ` placeholder="${esc(o.ph)}"` : ''}></textarea></div>`;
  const radios = (k, label, opts, o = {}) => `<div class="fld${o.wide ? ' wide' : ''}"><label>${label}${o.req ? ' *' : ''}</label><div class="opts">
    ${opts.map(v => `<label class="opt"><input type="radio" name="${k}" value="${esc(Array.isArray(v) ? v[0] : v)}"${o.req ? ' required' : ''}><span>${esc(Array.isArray(v) ? v[1] : v)}</span></label>`).join('')}</div></div>`;
  const yn = (k, label, o = {}) => radios(k, label, ['Yes', 'No'], o);
  const section = (title, body, hint) => `<section class="card bf-sec"><h2>${title}</h2>${hint ? `<p class="hint">${hint}</p>` : ''}<div class="form">${body}</div></section>`;

  function render($app, msg) {
    document.getElementById('logout-btn').hidden = true;
    const pre = new URLSearchParams((location.hash.split('?')[1] || '')).get('course') || '';
    $app.innerHTML = `
      <section class="hero"><div class="hero-row"><img src="brand/logo-white.png" alt="" style="height:56px">
        <div><h1>Course Booking Form</h1><div class="sub">Book your place at African Guide Academy. Takes about 10 minutes, and your answers are saved on this device as you go.</div></div></div></section>
      ${DEMO ? '<div class="demo-banner">Demo mode: nothing is sent.</div>' : ''}
      <form id="bf" class="bf" novalidate>
        <input type="text" name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
        ${section('1. Your course', `
          ${radios('courseType', 'Which course?', ['Nature Guide', 'Trails Guide', 'Wilderness Trails', 'Track & Sign', 'Other'], { req: true, wide: true })}
          <div id="b-parts" class="wide"><p class="hint" style="margin:0">Loading course dates…</p></div>
          <label class="opt wide" id="b-nl-wrap"><input type="checkbox" id="b-nl"><span>My course or dates are not listed</span></label>
          <div id="b-notlisted" class="wide form" hidden>
            ${txt('courseOther', 'Other course', { hint: '(if "Other")' })}
            ${txt('courseLevel', 'Course level', { hint: '(if known)' })}
            ${txt('startDate', 'Preferred start', { type: 'date' })}${txt('endDate', 'Preferred finish', { type: 'date' })}
          </div>
        `, 'Our courses run in <b>2-week parts</b>: <b>Part A</b> is the first two weeks and <b>Part B</b> the second two weeks. A full Nature Guide or Trails Guide course is Part A + Part B. Tick every part you want: one part, both parts, or two courses in a row. For each part choose where you would like to study (Kwapa in the Okavango Delta, or our Kalahari Training Camp where it is offered).<br><b>Fees per 2-week part:</b> International EUR 3,850 · SADC (citizens and permanent residents of African countries) P 17,500. Single tent supplement: 20% (International) or 30% (SADC).')}
        ${section('2. How did you book?', `
          ${radios('bookedVia', 'Booked', ['Direct with AGA', 'Through an agent', 'Through a safari company', 'Other'], { req: true, wide: true })}
          ${txt('bookedViaName', 'Agent / company name', { hint: '(if not direct)', wide: true })}
          ${radios('paymentMethod', 'Payment method', ['EFT', 'Cash', 'Credit card', 'Cheque'], { req: true, wide: true })}
          <p class="hint wide" style="margin:0">When paying, use your <b>invoice number</b> as the reference, then upload your proof of payment in My AGA (or email it to reservations@guidetrainingcourses.com). Your place is confirmed once the deposit is received.</p>
        `)}
        ${section('3. Qualification or personal enrichment?', `
          <div class="fld wide"><div class="opts study-for">
            <label class="opt"><input type="radio" name="studyFor" value="qualification"><span><b>Study for a qualification</b><br><small>Complete the workbooks and assessments for a BQA and/or FGASA qualification.</small></span></label>
            <label class="opt"><input type="radio" name="studyFor" value="enrichment"><span><b>Personal enrichment</b><br><small>No exams, no stress. Learn alongside the others and choose which activities you join.</small></span></label>
          </div></div>
          <div class="fld wide" id="b-quals" hidden><label>Which qualification(s)?</label><div class="opts">
            ${['BQA qualification', 'FGASA qualification'].map(g => `<label class="opt"><input type="checkbox" name="goal" value="${g}"><span>${g}</span></label>`).join('')}</div>
            <p class="hint" style="margin:6px 0 0">Studying for <b>FGASA</b>: the workbook must be completed and submitted at least 2 weeks before the course. For BQA it is strongly recommended. Book at least 60 days ahead to give yourself time to prepare.</p></div>
          ${txt('goalOther', 'Anything else about your goal?', { wide: true, max: 300 })}
        `, 'Every course is open to you either way.')}
        ${section('4. Your personal details', `
          ${txt('surname', 'Surname', { req: true, ac: 'family-name' })}${txt('firstNames', 'First names', { req: true, ac: 'given-name' })}
          ${radios('gender', 'Gender', ['Male', 'Female', 'Other', 'Prefer not to say'], { req: true, wide: true })}
          ${txt('nationality', 'Nationality', { req: true, ph: 'e.g. Motswana, South African' })}
          ${txt('omangPassport', 'Passport / Omang number', { req: true })}
          ${txt('passportExpiry', 'Passport expiry date', { type: 'date' })}${txt('dateOfBirth', 'Date of birth', { type: 'date', req: true, ac: 'bday' })}
          ${txt('placeOfBirth', 'Place of birth')}${txt('cellNumber', 'Cell number', { type: 'tel', req: true, ac: 'tel', ph: '+267 …' })}
          ${txt('email', 'Email address', { type: 'email', req: true, ac: 'email', hint: '(your My AGA login is sent here)', wide: true })}
          ${area('postalAddress', 'Postal address')}${area('residentialAddress', 'Residential address')}
          ${txt('highestEducation', 'Highest education', { ph: 'e.g. BGCSE, Diploma' })}${txt('occupation', 'Current occupation')}
          ${yn('readWriteEnglish', 'Can you read and write English?', { req: true })}${yn('driversLicence', 'Driver’s licence?', { req: true })}
          ${yn('firstAidCert', 'Valid First Aid certificate?', { req: true })}
          ${area('disabilities', 'Disabilities / special needs', { ph: 'Leave blank if none' })}${area('medication', 'Medication / allergies', { ph: 'Leave blank if none' })}
        `)}
        ${section('5. Arrival and departure', `
          ${txt('arrivalDate', 'Date of arrival', { type: 'date' })}${txt('arrivalFlight', 'Arrival flight no.')}${txt('arrivalTime', 'Arrival time', { type: 'time' })}
          ${txt('departureDate', 'Date of departure', { type: 'date' })}${txt('departureFlight', 'Departure flight no.')}${txt('departureTime', 'Departure time', { type: 'time' })}
        `, '<b>Pick-up:</b> we collect all students from the Duck Café across the road from Maun Airport at <b>14h00</b> on the first day. <b>Drop-off:</b> Maun Airport at around <b>11h00</b> on the last day. All extras are settled at camp before departure.')}
        ${section('6. Accommodation, food and extras', `
          ${radios('accommodation', 'Accommodation', [['Single', 'Single (supplement: 20% International, 30% SADC)'], ['Double', 'Double (sharing)']], { req: true, wide: true })}
          <p class="hint wide" style="margin:0">High-wall meru-style tent (3 × 4 m) with en-suite flush toilet and bucket shower. Bedding and a towel are provided.</p>
          ${txt('dietary', 'Dietary requirements', { ph: 'e.g. vegetarian, vegan, none' })}${txt('foodAllergies', 'Food allergies', { ph: 'None' })}
          <p class="hint wide" style="margin:0">Students may not change to vegetarian/vegan once on course: tell us now so we can cater. Drinks are for your own account (buy them in Maun on arrival).</p>
          ${radios('helicopter', 'Optional helicopter transfer into/out of camp (3 passengers)', ['Interested, even if solo', 'Interested if at least 1 other passenger', 'Interested only if 2 other passengers', 'Not interested'], { wide: true })}
          ${yn('insurance', 'Insurance against AGA training equipment (US$20/week)?', { wide: true })}
        `)}
        ${section('7. Qualifications and memberships', `
          ${txt('bqaQualifications', 'Existing BQA qualifications', { hint: '(level, if any)' })}${yn('bqaMember', 'Are you a BQA member?')}
          ${txt('bqaNo', 'BQA membership number')}${yn('bqaRegister', 'If not, should AGA register you with BQA?')}
          ${txt('fgasaQualifications', 'FGASA qualifications', { hint: '(level / NQF code)' })}${yn('fgasaMember', 'Are you a FGASA member?')}
          ${txt('fgasaNo', 'FGASA membership number')}
          <p class="hint wide" style="margin:0;color:var(--bad)">Please register directly with FGASA if a FGASA qualification is your goal.</p>
        `)}
        ${section('8. Declaration', `
          <p class="wide" style="margin:0">By submitting this Booking Form a booking is made, and you are bound by our Terms and Conditions, Waiver, Indemnity and Learnership Agreement. Please read each document and tick to agree:</p>
          <div class="wide agree">${DOCS.map(([name, url], i) => `<label class="opt"><input type="checkbox" name="agree${i}"><span>${i + 1}. I have read and agree to the ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a>` : esc(name)}</span></label>`).join('')}</div>
          ${txt('signName', 'Your full name', { req: true, wide: true, hint: '(as your signature)' })}
          <div class="fld wide"><label>Sign here with your finger or mouse *</label><canvas id="sig" class="sig"></canvas>
            <button type="button" class="btn" id="sig-clear" style="margin-top:6px">Clear signature</button></div>
        `)}
        <div id="bf-msg">${msg ? `<div class="err">${esc(msg)}</div>` : ''}</div>
        <div class="bf-submit"><button class="btn btn-primary btn-block" id="bf-send">Submit my booking</button>
          <p class="hint" style="text-align:center;margin-top:8px">You’ll get a copy by email, then an invoice from our reservations team.</p></div>
      </form>`;
    wire($app, pre);
  }

  function wire($app, pre) {
    const f = document.getElementById('bf');
    let courses = [], kalahariFrom = '2027-06-01';
    // draft restore
    const draft = store.get(DRAFT_KEY) || {};
    const restore = () => Object.keys(draft).forEach(k => {
      const els = f.querySelectorAll(`[name="${k}"]`);
      els.forEach(el => { if (el.type === 'radio' || el.type === 'checkbox') el.checked = Array.isArray(draft[k]) ? draft[k].includes(el.value) : (el.value === draft[k] || (draft[k] === true && el.type === 'checkbox')); else el.value = draft[k]; });
    });
    const collect = () => {
      const o = {};
      Array.from(f.elements).forEach(el => {
        if (!el.name || el.name === 'website') return;
        if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
        else if (el.type === 'checkbox') { if (el.name === 'goal') { o.goal = o.goal || []; if (el.checked) o.goal.push(el.value); } else o[el.name] = el.checked; }
        else o[el.name] = el.value.trim();
      });
      return o;
    };
    // ---- course parts: 2-week parts with places left and a camp choice per part ----
    const partsBox = document.getElementById('b-parts'), nl = document.getElementById('b-nl');
    const typeNow = () => (f.querySelector('input[name="courseType"]:checked') || {}).value || '';
    const places = n => n == null ? 'places available' : n > 0 ? n + (n === 1 ? ' place' : ' places') + ' left' : 'full';
    const renderParts = () => {
      const type = typeNow(), keep = {};
      partsBox.querySelectorAll('.part-row').forEach(r => { const cb = r.querySelector('input'); if (cb.checked) keep[cb.dataset.part] = (r.querySelector('select') || {}).value || true; });
      const list = courses.filter(p => p.type === type);
      if (!type) partsBox.innerHTML = '<p class="hint" style="margin:0">Choose your course to see the dates.</p>';
      else if (!list.length) partsBox.innerHTML = `<p class="hint" style="margin:0">${type === 'Other' ? 'Tell us about the course you want below.' : 'No upcoming dates are listed for this course yet. Tick “not listed” and tell us your preferred dates.'}</p>`;
      else {
        const groups = [];
        list.forEach(p => { const k = p.code.replace(/-[AB]$/, ''); let g = groups.find(x => x.k === k); if (!g) groups.push(g = { k, items: [] }); g.items.push(p); });
        partsBox.innerHTML = groups.map(g => `<div class="part-group"><div class="part-head">${esc(g.items[0].type)} starting ${esc(fmt(g.items[0].startDate))}</div>` +
          g.items.map(p => {
            const kwp = p.kwpLeft == null || p.kwpLeft > 0, klh = p.klhLeft == null ? (p.startDate >= kalahariFrom && /nature|trails guide/i.test(p.type)) : p.klhLeft > 0;
            const camps = [kwp ? ['Kwapa', 'Kwapa (Okavango Delta)' + (p.kwpLeft != null ? ' · ' + places(p.kwpLeft) : '')] : null,
              klh ? ['Kalahari', 'Kalahari Training Camp' + (p.klhLeft != null ? ' · ' + places(p.klhLeft) : '')] : null].filter(Boolean);
            const full = !camps.length;
            const campUi = full ? '<span class="part-full">Full</span>' : camps.length === 1 ? `<span class="part-one" data-camp="${camps[0][0]}">${esc(camps[0][1])}</span>`
              : `<select aria-label="Where would you like to study?">${camps.map(c => `<option value="${c[0]}">${esc(c[1])}</option>`).join('')}</select>`;
            return `<div class="part-row${full ? ' is-full' : ''}"><label class="opt"><input type="checkbox" data-part="${esc(p.code)}"${full ? ' disabled' : ''}>
              <span><b>${p.part ? 'Part ' + esc(p.part) : esc(p.code)}</b> · ${esc(fmt(p.startDate))}${p.endDate ? ' – ' + esc(fmt(p.endDate)) : ''} <small>${esc(p.code)}</small></span></label>
              <div class="part-camp">${campUi}</div></div>`;
          }).join('') + '</div>').join('');
        partsBox.querySelectorAll('.part-row').forEach(r => { const cb = r.querySelector('input'), v = keep[cb.dataset.part];
          if (v && !cb.disabled) { cb.checked = true; const s = r.querySelector('select'); if (s && v !== true) s.value = v; } });
      }
      document.getElementById('b-notlisted').hidden = !(nl.checked || type === 'Other');
    };
    const chosenParts = () => Array.from(partsBox.querySelectorAll('.part-row')).filter(r => r.querySelector('input').checked).map(r => {
      const s = r.querySelector('select'), one = r.querySelector('.part-one');
      return { code: r.querySelector('input').dataset.part, camp: s ? s.value : (one ? one.dataset.camp : 'Kwapa') };
    });
    const updateStudy = () => { document.getElementById('b-quals').hidden = (f.querySelector('input[name="studyFor"]:checked') || {}).value !== 'qualification'; };
    f.addEventListener('change', e => { if (e.target.name === 'studyFor') updateStudy(); if (e.target.name === 'courseType' || e.target === nl) renderParts(); const o = collect(); delete o.signName; store.set(DRAFT_KEY, o); });
    f.addEventListener('input', () => { const o = collect(); store.set(DRAFT_KEY, o); });

    api({ portal: 'courses' }).then(r => {
      kalahariFrom = (r && r.kalahariFrom) || kalahariFrom;
      // New: parts with places left. Older backend: plain course list (places unknown)
      courses = (r && r.ok && (r.parts || (r.courses || []).map(c => ({ code: c.code, type: c.type, part: (c.code.match(/-([AB])$/) || [])[1] || '',
        startDate: c.startDate, endDate: c.endDate, kwpLeft: null, klhLeft: null })))) || [];
      restore(); updateStudy();
      const p = pre && courses.find(c => c.code === pre);
      if (p) { const rb = f.querySelector(`input[name="courseType"][value="${p.type}"]`); if (rb) rb.checked = true; }
      renderParts();
      if (p) { const cb = partsBox.querySelector(`input[data-part="${CSS.escape(p.code)}"]`); if (cb && !cb.disabled) cb.checked = true; }
    });

    // signature pad
    const cv = document.getElementById('sig'), ctx = cv.getContext('2d');
    let drawing = false, signed = false, last = null;
    const size = () => { const w = cv.clientWidth; cv.width = w * 2; cv.height = 160 * 2; ctx.scale(2, 2); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1f1612'; signed = false; };
    size();
    const pt = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.addEventListener('pointerdown', e => { drawing = true; last = pt(e); cv.setPointerCapture(e.pointerId); e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; signed = true; e.preventDefault(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => cv.addEventListener(ev, () => { drawing = false; }));
    document.getElementById('sig-clear').onclick = () => { ctx.clearRect(0, 0, cv.width, cv.height); signed = false; };

    f.addEventListener('submit', async e => {
      e.preventDefault();
      const o = collect(), msg = document.getElementById('bf-msg');
      const showErr = t => { msg.innerHTML = `<div class="err">${esc(t)}</div>`; msg.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
      const sel = chosenParts(), notListed = nl.checked || o.courseType === 'Other';
      if (!o.courseType) return showErr('Please choose your course.');
      if (!sel.length && !notListed) return showErr('Please tick the part(s) you want to book, or “My course or dates are not listed”.');
      const selP = sel.map(s => courses.find(c => c.code === s.code)).filter(Boolean).sort((a, b) => a.startDate.localeCompare(b.startDate));
      const missing = [];
      [['surname', 'surname'], ['firstNames', 'first names'], ['gender', 'gender'], ['nationality', 'nationality'], ['omangPassport', 'passport/Omang number'],
        ['dateOfBirth', 'date of birth'], ['cellNumber', 'cell number'], ['email', 'email'], ['bookedVia', 'how you booked'], ['paymentMethod', 'payment method'],
        ['accommodation', 'accommodation'], ['readWriteEnglish', 'read/write English'], ['driversLicence', 'driver’s licence'], ['firstAidCert', 'First Aid certificate'],
        ['signName', 'your full name in the declaration']].forEach(([k, l]) => { if (!o[k]) missing.push(l); });
      if (!o.studyFor) missing.push('qualification or personal enrichment');
      else if (o.studyFor === 'qualification' && !(o.goal || []).length) missing.push('which qualification (BQA and/or FGASA)');
      if (missing.length) return showErr('Please fill in: ' + missing.join(', ') + '.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email)) return showErr('Please check your email address.');
      if (DOCS.some((d, i) => !o['agree' + i])) return showErr('Please tick all ' + DOCS.length + ' agreements in the declaration.');
      if (!signed) return showErr('Please sign in the signature box.');

      const s0 = selP.length ? selP[0].startDate : o.startDate, e0 = selP.length ? selP[selP.length - 1].endDate : o.endDate;
      const form = Object.assign({}, o, {
        courseCode: selP.length ? selP[0].code : '',
        parts: sel,
        courseType: o.courseType,
        courseOther: o.courseOther || '',
        startDate: s0, endDate: e0,
        nights: (() => { if (!s0 || !e0) return ''; const n = Math.round((new Date(e0) - new Date(s0)) / 864e5); return n > 0 ? String(n) : ''; })(),
        campPreference: sel.length ? sel.map(x => x.code + ': ' + x.camp).join('; ') : 'Not listed yet',
        bookedVia: o.bookedVia,
        learnerGoal: [].concat(o.studyFor === 'enrichment' ? ['Personal enrichment (no exams)'] : (o.goal || []), o.goalOther ? [o.goalOther] : []).join('; '),
        agree: DOCS.map((d, i) => !!o['agree' + i]), signature: trimSig(cv)
      });
      const btn = document.getElementById('bf-send'); btn.disabled = true; btn.textContent = 'Sending your booking…';
      const r = await api({ portal: 'bookingForm', form, website: f.elements.website.value });
      btn.disabled = false; btn.textContent = 'Submit my booking';
      if (!r || !r.ok) return showErr((r && r.error) || 'Something went wrong. Please try again.');
      store.set(DRAFT_KEY, null);
      done(document.getElementById('app'), o, r);
    });
  }

  // Keep the signature small: draw it onto a white 600×160 PNG
  function trimSig(cv) {
    const out = document.createElement('canvas'); out.width = 600; out.height = Math.round(600 * cv.height / cv.width);
    const c = out.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, out.width, out.height);
    c.drawImage(cv, 0, 0, out.width, out.height);
    return out.toDataURL('image/png');
  }

  function done($app, o, r) {
    window.scrollTo({ top: 0 });
    $app.innerHTML = `<div class="login" style="max-width:560px"><div class="hero"><img src="brand/logo-white.png" alt=""><h1>Thank you, ${esc(o.firstNames)}!</h1>
      <div class="sub">Your booking form has been received.</div></div>
      <div class="card"><ul class="todo">
        <li class="low"><div class="dot">✓</div><div><b>Check your email</b><p>We have sent a copy of your booking form to ${esc(o.email)}.</p></div></li>
        <li class="medium"><div class="dot">2</div><div><b>Invoice</b><p>Our reservations team will send you an invoice. Your booking is provisional until the deposit is paid.</p></div></li>
        <li class="medium"><div class="dot">3</div><div><b>Log in to My AGA</b><p>${r.loginSentTo === 'profile' ? 'Your login details were sent to the email address we already have for you.' : 'Your Student ID and first-time PIN are in the email.'} Use My AGA to upload your passport photo and documents.</p></div></li>
      </ul><div class="form-actions"><a class="btn btn-primary" href="./">Go to My AGA login</a></div></div></div>`;
  }

  window.MyAgaBook = { render };
})();
