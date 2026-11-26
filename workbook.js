// My AGA — digital workbooks (#/wb/<id>). Content and answers come from the AGA API (Workbooks.js).
// Answers save as the student types (and are kept on the device until the server has them).
(function () {
  let ctx = null, wb = null, answers = {}, status = '', dirty = false, saving = false, timer = null, readOnly = false;
  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const draftKey = id => 'myaga_wb_' + id;
  const local = {
    get(id) { try { return JSON.parse(localStorage.getItem(draftKey(id)) || 'null'); } catch (e) { return null; } },
    set(id, v) { try { v ? localStorage.setItem(draftKey(id), JSON.stringify(v)) : localStorage.removeItem(draftKey(id)); } catch (e) { } }
  };
  const thumb = ref => { const m = String(ref || '').match(/^img:([\w-]+)$/); return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000' : ''; };

  // ---------- list card on the overview ----------
  function card(list, locked, message) {
    if (locked) return `<div class="card full"><h2>✍️ Digital workbooks 🔒</h2><p class="hint" style="margin:0">${esc(message || 'Your workbooks open here once your deposit has been received.')}</p></div>`;
    if (!list || !list.length) return '';
    const done = list.filter(w => w.status === 'Submitted').length;
    return `<div class="card full"><h2>✍️ Digital workbooks</h2>
      <p class="hint">Work on your Nature Guide workbooks here: everything saves as you type, so you can stop and carry on later on any device. When a chapter is done, submit it and we email you the completed PDF. ${done} of ${list.filter(w => w.examinable).length} submitted.</p>
      <ul class="wb-list">${list.map(w => `<li><a href="#/wb/${esc(w.id)}">
        <span class="wb-ch">${w.chapter}</span>
        <span class="wb-t"><b>${esc(w.title)}</b>${w.examinable ? '' : ' <span class="wb-opt">optional · not examinable</span>'}
          <span class="wb-bar"><i style="width:${w.status === 'Submitted' ? 100 : w.percent}%"></i></span></span>
        <span class="wb-st ${w.status === 'Submitted' ? 'ok' : w.status === 'In progress' ? 'go' : ''}">${w.status === 'Submitted' ? '✓ Submitted' : w.status === 'In progress' ? w.percent + '%' : 'Start'}</span></a></li>`).join('')}</ul></div>`;
  }

  // ---------- one workbook ----------
  async function render($app, id, c) {
    ctx = c; wb = null; answers = {}; dirty = false; readOnly = false;
    $app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const r = await ctx.authed({ portal: 'workbook', id });
    if (!r || !r.ok) { if (!r || !r.expired) $app.innerHTML = `<div class="card" style="margin-top:20px"><h2>Workbook</h2><p>${esc((r && r.error) || 'Could not open the workbook.')}</p><a class="btn" href="#/">← Back to My AGA</a></div>`; return; }
    wb = r.workbook; answers = r.answers || {}; status = r.status; readOnly = status === 'Submitted';
    // unsaved answers left on this device (e.g. lost connection) win over the server copy
    const d = local.get(id);
    if (d && d.unsaved && !readOnly) { Object.assign(answers, d.answers || {}); dirty = true; }
    $app.innerHTML = page(r);
    wire($app);
    if (dirty) save();
  }

  function page(r) {
    const nav = wb.sections.map((s, i) => `<a href="#" data-jump="wbs${i}">${i + 1}. ${esc(s.title)}</a>`).join('');
    return `<div class="wb">
      <div class="wb-top">
        <a class="btn" href="#/">← My AGA</a>
        <span id="wb-save" class="wb-save">${readOnly ? '✓ Submitted' : 'All changes saved'}</span>
      </div>
      <section class="wb-head card">
        <div class="wb-kicker">Nature Guide self-study workbook · Chapter ${wb.chapter}</div>
        <h1>${esc(wb.title)}</h1>
        ${wb.examinable ? '' : '<div class="wb-optnote">This chapter is optional and not examinable.</div>'}
        <div class="wb-meta"><span>⏱ ${esc(wb.hours)} hours</span><span>📝 ${esc(wb.totalMarks)} marks</span>${wb.manualChapter ? `<span>📖 Manual ${esc(wb.manualChapter)}</span>` : ''}</div>
        <div class="wb-prog"><span class="wb-bar"><i id="wb-pbar"></i></span><b id="wb-pct"></b></div>
        ${(wb.intro || []).map(p => `<p>${esc(p)}</p>`).join('')}
        ${readOnly ? `<div class="wb-done">✓ Submitted. ${r.pdfUrl ? `<a href="${esc(r.pdfUrl)}" target="_blank" rel="noopener">Open the submitted PDF</a>.` : ''} Ask your trainer if you need to change something.</div>` : ''}
        <nav class="wb-nav">${nav}<a href="#" data-jump="wblog">Study log</a></nav>
      </section>
      ${wb.sections.map((s, si) => `<section class="card wb-sec" id="wbs${si}">
        <h2>Section ${si + 1}: ${esc(s.title)}${s.time ? ` <small>${esc(s.time)}</small>` : ''}</h2>
        ${s.intro ? `<p class="hint">${esc(s.intro)}</p>` : ''}
        ${s.items.map(item).join('')}</section>`).join('')}
      <section class="card wb-sec" id="wblog"><h2>Self-study log</h2><p class="hint">Record the date and time you spent on each section.</p>${logTable()}</section>
      <div class="wb-foot card">
        <button class="btn" id="wb-pdf">⬇ Download / print PDF</button>
        ${readOnly ? '' : '<button class="btn btn-primary" id="wb-submit">Submit workbook</button>'}
      </div></div>`;
  }
  const ro = () => readOnly ? ' disabled' : '';
  const ta = (k, rows, ph) => `<textarea data-k="${esc(k)}" rows="${rows || 2}" placeholder="${esc(ph || 'Your answer')}"${ro()}>${esc(answers[k] || '')}</textarea>`;
  const inp = (k, ph, cls) => `<input data-k="${esc(k)}" class="${cls || ''}" value="${esc(answers[k] || '')}" placeholder="${esc(ph || '')}"${ro()}>`;
  function sketch(k, small) {
    const t = thumb(answers[k]);
    return `<div class="wb-sketch${small ? ' small' : ''}" data-sk="${esc(k)}">
      <div class="wb-sk-img">${t ? `<img src="${esc(t)}" alt="Sketch">` : '<span>No sketch yet</span>'}</div>
      ${readOnly ? '' : `<div class="wb-sk-acts"><button type="button" class="btn" data-draw="${esc(k)}">✏️ Draw</button>
        <label class="btn">📷 Photo<input type="file" accept="image/*" data-photo="${esc(k)}" hidden></label></div>`}</div>`;
  }
  function item(it) {
    if (it.type === 'note') return `<p class="wb-note">${esc(it.text)}</p>`;
    const n = it.n, head = `<div class="wb-q"><span class="wb-n">${esc(n)}</span><span>${esc(it.q)}</span>${it.marks ? `<span class="wb-m">${it.marks} mark${it.marks === 1 ? '' : 's'}</span>` : ''}</div>`;
    let body = '';
    if (it.type === 'text') body = ta(n, Math.max(2, Math.min(8, (it.lines || 2) + 1)));
    else if (it.type === 'choice') body = '<div class="wb-choice">' + it.options.map(o => `<label class="opt"><input type="radio" name="c${esc(n)}" data-k="${esc(n)}" value="${esc(o)}"${answers[n] === o ? ' checked' : ''}${ro()}><span>${esc(o)}</span></label>`).join('') + '</div>';
    else if (it.type === 'tf') body = it.statements.map((x, i) => { const k = n + '|' + i + '|tf';
      return `<div class="wb-tf"><div class="wb-tf-s">${esc(x.l ? x.l + ' ' : '')}${esc(x.s)}</div>
        <div class="wb-tf-a"><span class="wb-seg">${['True', 'False'].map(v => `<button type="button" data-tf="${esc(k)}" data-v="${v}" class="${answers[k] === v ? 'on' : ''}"${ro()}>${v}</button>`).join('')}</span>
        ${inp(n + '|' + i + '|fix', 'Correction (if false)', 'wb-fix')}</div></div>`; }).join('');
    else if (it.type === 'fill') body = it.items.map((x, i) => { let j = 0;
      return `<div class="wb-fill">${esc(x.l ? x.l + ' ' : '')}${esc(x.s).replace(/___/g, () => inp(n + '|' + i + '|' + (j++), '', 'wb-blank'))}</div>`; }).join('');
    else if (it.type === 'table') {
      const c0 = it.rowLabels ? 1 : 0, sk = it.sketchColumns || [];
      body = '<div class="wb-rows">' + Array.from({ length: it.rows }, (_, r) => `<div class="wb-row"><div class="wb-row-h">${it.rowLabels ? esc(it.rowLabels[r]) : 'Entry ' + (r + 1)}</div>
        ${it.columns.map((col, ci) => ci < c0 ? '' : `<label class="wb-cell"><span>${esc(col)}</span>${sk.includes(ci) ? sketch(n + '|' + r + '|' + ci, true) : ta(n + '|' + r + '|' + ci, 1, '')}</label>`).join('')}</div>`).join('') + '</div>';
    } else if (it.type === 'sketch') body = (it.fields || []).map((f, k) => `<label class="wb-cell"><span>${esc(f)}</span>${inp(n + '|f|' + k, '')}</label>`).join('') +
      (it.label ? `<div class="wb-sk-label">${esc(it.label)}</div>` : '') + sketch(n + '|img');
    else if (it.type === 'fields') body = it.fields.map((f, k) => `<label class="wb-cell"><span>${esc(f)}</span>${ta(n + '|f|' + k, Array.isArray(it.lines) ? (it.lines[k] || 1) : (it.lines || 2), '')}</label>`).join('');
    return `<div class="wb-item">${head}${body}</div>`;
  }
  function logTable() {
    const lg = wb.log || { columns: [], rows: 0 };
    return '<div class="wb-log">' + Array.from({ length: lg.rows }, (_, r) => `<div class="wb-log-row">${lg.columns.map((c, ci) => {
      const k = 'log|' + r + '|' + ci;
      if (/^date/i.test(c)) return `<label><span>${esc(c)}</span><input type="date" data-k="${k}" value="${esc(answers[k] || '')}"${ro()}></label>`;
      if (/^section/i.test(c)) return `<label><span>${esc(c)}</span><select data-k="${k}"${ro()}><option value=""></option>${wb.sections.map((s, i) => { const v = (i + 1) + '. ' + s.title; return `<option${answers[k] === v ? ' selected' : ''}>${esc(v)}</option>`; }).join('')}</select></label>`;
      if (/trainer|mentor/i.test(c)) return `<label><span>${esc(c)}</span><input data-k="${k}" value="${esc(answers[k] || '')}" placeholder="Trainer fills in"${ro()}></label>`;
      return `<label><span>${esc(c)}</span><input data-k="${k}" value="${esc(answers[k] || '')}" placeholder="${/time/i.test(c) ? 'e.g. 1 h 30' : ''}"${ro()}></label>`;
    }).join('')}</div>`).join('') + '</div>';
  }

  // ---------- progress, saving ----------
  function slots() {
    const keys = [];
    wb.sections.forEach(s => s.items.forEach(it => { const n = it.n;
      if (it.type === 'text' || it.type === 'choice') keys.push(n);
      else if (it.type === 'tf') it.statements.forEach((x, i) => keys.push(n + '|' + i + '|tf'));
      else if (it.type === 'fill') it.items.forEach((x, i) => { const b = (x.s.match(/___/g) || []).length; for (let j = 0; j < b; j++) keys.push(n + '|' + i + '|' + j); });
      else if (it.type === 'table') { const c0 = it.rowLabels ? 1 : 0; for (let r = 0; r < it.rows; r++) for (let c = c0; c < it.columns.length; c++) keys.push(n + '|' + r + '|' + c); }
      else if (it.type === 'sketch') { keys.push(n + '|img'); (it.fields || []).forEach((f, k) => keys.push(n + '|f|' + k)); }
      else if (it.type === 'fields') it.fields.forEach((f, k) => keys.push(n + '|f|' + k));
    }));
    return keys;
  }
  function progress() {
    const k = slots(), d = k.filter(x => String(answers[x] || '').trim()).length;
    const p = k.length ? Math.round(d / k.length * 100) : 0;
    if ($('wb-pbar')) { $('wb-pbar').style.width = p + '%'; $('wb-pct').textContent = p + '% · ' + d + ' of ' + k.length + ' answered'; }
    return { done: d, total: k.length, pct: p };
  }
  function setSave(text, cls) { const s = $('wb-save'); if (s) { s.textContent = text; s.className = 'wb-save ' + (cls || ''); } }
  function changed(k, v) {
    if (readOnly) return;
    answers[k] = v; dirty = true; progress();
    local.set(wb.id, { unsaved: true, answers, at: Date.now() });
    setSave('Saving…', 'busy');
    clearTimeout(timer); timer = setTimeout(save, 1800);
  }
  async function save() {
    if (!dirty || !wb) return;
    if (saving) { clearTimeout(timer); timer = setTimeout(save, 1200); return; }
    saving = true; dirty = false;
    const snap = Object.assign({}, answers);
    const r = await ctx.authed({ portal: 'workbookSave', id: wb.id, answers: snap });
    saving = false;
    if (r && r.ok) { if (!dirty) { local.set(wb.id, null); setSave('All changes saved', 'ok'); } }
    else { dirty = true; setSave(r && r.error && !/connection|reach/i.test(r.error) ? r.error : 'Not saved yet (no connection). Your answers are kept on this device and will save when you are back online.', 'bad');
      clearTimeout(timer); timer = setTimeout(save, 15000); }
  }

  // ---------- events ----------
  function wire(root) {
    progress();
    root.querySelectorAll('[data-k]').forEach(el => {
      if (el.tagName === 'TEXTAREA') autosize(el);
      const ev = (el.type === 'radio' || el.tagName === 'SELECT' || el.type === 'date') ? 'change' : 'input';
      el.addEventListener(ev, () => { if (el.tagName === 'TEXTAREA') autosize(el); changed(el.dataset.k, el.value); });
    });
    root.querySelectorAll('[data-tf]').forEach(b => b.onclick = () => {
      if (readOnly) return;
      const k = b.dataset.tf, v = answers[k] === b.dataset.v ? '' : b.dataset.v;
      root.querySelectorAll(`[data-tf="${k}"]`).forEach(x => x.classList.toggle('on', x.dataset.v === v));
      changed(k, v);
    });
    root.querySelectorAll('[data-jump]').forEach(a => a.onclick = e => { e.preventDefault(); const t = $(a.dataset.jump); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' }); });
    root.querySelectorAll('[data-draw]').forEach(b => b.onclick = () => openCanvas(b.dataset.draw));
    root.querySelectorAll('[data-photo]').forEach(i => i.onchange = async () => {
      const f = i.files[0]; i.value = ''; if (!f) return;
      try { const img = await ctx.shrinkImage(f, 1600); upload(i.dataset.photo, img.base64, img.mimeType); }
      catch (e) { ctx.toast('Could not read that photo.', true); }
    });
    $('wb-pdf').onclick = downloadPdf;
    if ($('wb-submit')) $('wb-submit').onclick = submit;
    window.onbeforeunload = () => dirty ? 'Your last changes are still saving.' : undefined;
  }
  function autosize(el) { el.style.height = 'auto'; el.style.height = Math.min(600, el.scrollHeight + 2) + 'px'; }
  async function upload(k, base64, mimeType) {
    const box = document.querySelector(`[data-sk="${CSS.escape(k)}"] .wb-sk-img`);
    if (box) box.innerHTML = '<span>Uploading…</span>';
    const r = await ctx.authed({ portal: 'workbookImage', id: wb.id, key: k, base64, mimeType });
    if (!r || !r.ok) { ctx.toast((r && r.error) || 'Could not save the sketch.', true); if (box) box.innerHTML = '<span>Not saved, please try again</span>'; return; }
    if (box) box.innerHTML = `<img src="data:${mimeType};base64,${base64}" alt="Sketch">`;
    changed(k, r.ref); save();
  }

  // ---------- drawing ----------
  function openCanvas(k) {
    const ov = document.createElement('div'); ov.className = 'wb-draw';
    ov.innerHTML = `<div class="wb-draw-box"><div class="wb-draw-bar">
        <span class="wb-colors">${['#1f1612', '#6e1e10', '#2f6a43', '#1d4e89', '#c06a1a'].map((c, i) => `<button type="button" data-c="${c}" style="background:${c}" class="${i ? '' : 'on'}"></button>`).join('')}</span>
        <button type="button" class="btn" data-size>Thin</button><button type="button" class="btn" data-erase>Eraser</button><button type="button" class="btn" data-undo>Undo</button><button type="button" class="btn" data-clear>Clear</button>
        <span style="flex:1"></span><button type="button" class="btn" data-cancel>Cancel</button><button type="button" class="btn btn-primary" data-save>Save sketch</button></div>
        <canvas></canvas><div class="hint" style="padding:6px 10px">Draw with your finger, a stylus or the mouse. Add labels by writing them on the sketch.</div></div>`;
    document.body.appendChild(ov);
    const cv = ov.querySelector('canvas'), g = cv.getContext('2d'), W = 1400, H = 1000;
    cv.width = W; cv.height = H; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.lineCap = g.lineJoin = 'round';
    let color = '#1f1612', size = 4, erase = false, drawing = false, hist = [];
    const pos = e => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); drawing = true; hist.push(g.getImageData(0, 0, W, H)); if (hist.length > 25) hist.shift();
      const p = pos(e); g.beginPath(); g.moveTo(p.x, p.y); g.strokeStyle = erase ? '#fff' : color; g.lineWidth = erase ? 28 : size; g.lineTo(p.x + .1, p.y + .1); g.stroke(); };
    cv.onpointermove = e => { if (!drawing) return; const p = pos(e); g.lineTo(p.x, p.y); g.stroke(); };
    cv.onpointerup = cv.onpointercancel = () => { drawing = false; };
    ov.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { color = b.dataset.c; erase = false; ov.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); ov.querySelector('[data-erase]').classList.remove('on'); });
    ov.querySelector('[data-size]').onclick = e => { size = size === 4 ? 9 : 4; e.target.textContent = size === 4 ? 'Thin' : 'Thick'; };
    ov.querySelector('[data-erase]').onclick = e => { erase = !erase; e.target.classList.toggle('on', erase); };
    ov.querySelector('[data-undo]').onclick = () => { const h = hist.pop(); if (h) g.putImageData(h, 0, 0); };
    ov.querySelector('[data-clear]').onclick = () => { hist.push(g.getImageData(0, 0, W, H)); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); };
    ov.querySelector('[data-cancel]').onclick = () => ov.remove();
    ov.querySelector('[data-save]').onclick = () => { const data = cv.toDataURL('image/png').split(',')[1]; ov.remove(); upload(k, data, 'image/png'); };
  }

  // ---------- PDF + submit ----------
  async function downloadPdf() {
    const b = $('wb-pdf'); b.disabled = true; b.textContent = 'Making the PDF…';
    if (dirty) await save();
    const r = await ctx.authed({ portal: 'workbookPdf', id: wb.id });
    b.disabled = false; b.textContent = '⬇ Download / print PDF';
    if (!r || !r.ok) return ctx.toast((r && r.error) || 'Could not make the PDF.', true);
    const bin = atob(r.base64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u8], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = r.name || 'Workbook.pdf'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  async function submit() {
    if (dirty) await save();
    const p = progress();
    const msg = p.done < p.total ? `You have answered ${p.done} of ${p.total}. Submit anyway? You cannot change it after submitting (your trainer can reopen it).` :
      'Submit this workbook? You cannot change it after submitting (your trainer can reopen it).';
    if (!confirm(msg)) return;
    const b = $('wb-submit'); b.disabled = true; b.textContent = 'Submitting…';
    const r = await ctx.authed({ portal: 'workbookSubmit', id: wb.id });
    if (!r || !r.ok) { b.disabled = false; b.textContent = 'Submit workbook'; return ctx.toast((r && r.error) || 'Could not submit.', true); }
    ctx.toast('Submitted! The completed PDF has been emailed to you.');
    location.hash = '#/wb/' + wb.id + '?t=' + Date.now();
  }

  window.addEventListener('pagehide', () => { if (dirty) save(); });
  window.MyAgaWorkbook = { card, render, flush: () => dirty ? save() : Promise.resolve() };
})();
