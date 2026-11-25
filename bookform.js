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
    if (p.portal === 'courses') return { ok: true, kalahariFrom: '2027-06-01', docs: DOCS.map(d => d[0]), courses: [
      { code: '2702 KWP NG', type: 'Nature Guide', startDate: '2027-02-01', endDate: '2027-02-28', venue: 'Kwapa Camp' },
      { code: '2707 NG', type: 'Nature Guide', startDate: '2027-07-05', endDate: '2027-08-01', venue: '' },
      { code: '2708 KWP TG', type: 'Trails Guide', startDate: '2027-08-09', endDate: '2027-08-30', venue: 'Kwapa Camp' }] };
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
          <div class="fld wide"><label for="b-courseCode">Which course? *</label><select id="b-courseCode" name="courseCode"><option value="">Loading courses…</option></select></div>
          <div id="b-notlisted" class="wide form" hidden>
            ${radios('courseType', 'Type of course', ['Nature Guide', 'Trails Guide', 'Wilderness Trails', 'Track & Sign', 'Other'], { req: true, wide: true })}
            ${txt('courseOther', 'Other course', { hint: '(if "Other")' })}
            ${txt('courseLevel', 'Course level', { hint: '(if known)' })}
            ${txt('startDate', 'Preferred start', { type: 'date' })}${txt('endDate', 'Preferred finish', { type: 'date' })}
          </div>
          <div id="b-camp" class="wide" hidden>${radios('campPreference', 'Where would you like to study? *', CAMPS, { wide: true })}
            <p class="hint" style="margin:6px 0 0">A full course is 28 days. From June 2027 you can study at Kwapa (Okavango Delta), at our new Kalahari Training Camp, or 14 days in each. Subject to space.</p></div>
        `)}
        ${section('2. How did you book?', `
          ${radios('bookedVia', 'Booked', ['Direct with AGA', 'Through an agent', 'Through a safari company', 'Other'], { req: true, wide: true })}
          ${txt('bookedViaName', 'Agent / company name', { hint: '(if not direct)', wide: true })}
          ${radios('paymentMethod', 'Payment method', ['EFT', 'Cash', 'Credit card', 'Cheque'], { req: true, wide: true })}
          <p class="hint wide" style="margin:0">When paying, use your <b>invoice number</b> as the reference and send proof of payment to info@guidetrainingcourses.com.</p>
        `)}
        ${section('3. Your goal', `
          <div class="fld wide"><label>What is the aim of your course?</label><div class="opts">
            ${['Personal enrichment', 'FGASA qualification', 'BQA qualification'].map(g => `<label class="opt"><input type="checkbox" name="goal" value="${g}"><span>${g}</span></label>`).join('')}</div></div>
          ${txt('goalOther', 'Anything else about your goal?', { wide: true, max: 300 })}
        `)}
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
          ${radios('accommodation', 'Accommodation', [['Single', 'Single (30% single supplement)'], ['Double', 'Double (sharing)']], { req: true, wide: true })}
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
    const courseSel = f.elements.courseCode;
    const updateCourse = () => {
      const c = courses.find(x => x.code === courseSel.value);
      document.getElementById('b-notlisted').hidden = courseSel.value !== '__other';
      const start = c ? c.startDate : f.elements.startDate.value;
      const campBox = document.getElementById('b-camp');
      campBox.hidden = !(start && start >= kalahariFrom && !/trail|track/i.test((c && c.type) || collect().courseType || ''));
    };
    courseSel.addEventListener('change', updateCourse);
    f.addEventListener('change', () => { updateCourse(); const o = collect(); delete o.signName; store.set(DRAFT_KEY, o); });
    f.addEventListener('input', () => { const o = collect(); store.set(DRAFT_KEY, o); });

    api({ portal: 'courses' }).then(r => {
      courses = (r && r.ok && r.courses) || []; kalahariFrom = (r && r.kalahariFrom) || kalahariFrom;
      courseSel.innerHTML = '<option value="">Choose your course…</option>' +
        courses.map(c => `<option value="${esc(c.code)}">${esc((c.type ? c.type + ' · ' : '') + fmt(c.startDate) + (c.endDate ? ' – ' + fmt(c.endDate) : '') + ' · ' + c.code)}</option>`).join('') +
        '<option value="__other">My course or dates are not listed</option>';
      restore();
      if (pre && courses.some(c => c.code === pre)) courseSel.value = pre;
      updateCourse();
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
      const c = courses.find(x => x.code === o.courseCode);
      if (!o.courseCode) return showErr('Please choose your course (or "My course or dates are not listed").');
      const missing = [];
      [['surname', 'surname'], ['firstNames', 'first names'], ['gender', 'gender'], ['nationality', 'nationality'], ['omangPassport', 'passport/Omang number'],
        ['dateOfBirth', 'date of birth'], ['cellNumber', 'cell number'], ['email', 'email'], ['bookedVia', 'how you booked'], ['paymentMethod', 'payment method'],
        ['accommodation', 'accommodation'], ['readWriteEnglish', 'read/write English'], ['driversLicence', 'driver’s licence'], ['firstAidCert', 'First Aid certificate'],
        ['signName', 'your full name in the declaration']].forEach(([k, l]) => { if (!o[k]) missing.push(l); });
      if (o.courseCode === '__other' && !o.courseType) missing.push('type of course');
      if (!document.getElementById('b-camp').hidden && !o.campPreference) missing.push('where you would like to study');
      if (missing.length) return showErr('Please fill in: ' + missing.join(', ') + '.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email)) return showErr('Please check your email address.');
      if (DOCS.some((d, i) => !o['agree' + i])) return showErr('Please tick all ' + DOCS.length + ' agreements in the declaration.');
      if (!signed) return showErr('Please sign in the signature box.');

      const form = Object.assign({}, o, {
        courseCode: o.courseCode === '__other' ? '' : o.courseCode,
        courseType: o.courseCode === '__other' ? o.courseType : ((c && c.type) || o.courseType || 'Nature Guide'),
        startDate: c ? c.startDate : o.startDate, endDate: c ? c.endDate : o.endDate,
        nights: (() => { const s = c ? c.startDate : o.startDate, en = c ? c.endDate : o.endDate; if (!s || !en) return ''; const n = Math.round((new Date(en) - new Date(s)) / 864e5); return n > 0 ? String(n) : ''; })(),
        campPreference: document.getElementById('b-camp').hidden ? 'Kwapa Training Camp (Okavango Delta)' : o.campPreference,
        bookedVia: o.bookedVia, learnerGoal: [].concat(o.goal || [], o.goalOther ? [o.goalOther] : []).join('; '),
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
