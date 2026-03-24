// biome-ignore lint/complexity/useArrowFunction: keep it simple
(function() {
  const COLORS = {
    taken: '#2d8a4e', takenBg: '#e6f7ed',
    opportunity: '#b8860b', opportunityBg: '#fff8dc',
    doubleCount: '#1a73e8', doubleCountBg: '#e8f0fe',
  };

  const TARGET_PAGE = { pathname: '/content.php', catoid: '24', navoid: '780' };
  const UI_IDS = {
    panel: 'ca-launcher-panel',
    details: 'ca-launcher-details',
    textarea: 'ca-transcript-input',
    status: 'ca-launcher-status',
    styles: 'ca-launcher-styles',
  };

  // ========== TRANSCRIPT PARSER ==========
  function parseTranscript(text) {
    const normalized = text
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n?/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
    const rowRe = /\b([A-Z]{2,5})\s+(\d{3}[A-Z]?)\s*-\s*(.+?)\s+([A-Z]{1,2}[+-]?)\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?\b/g;
    const raw = [];
    let match = rowRe.exec(normalized);
    while (match !== null) {
      const [, subject, courseNumber, rawTitle, grade, hoursText] = match;
      raw.push({
        code: subject + ' ' + courseNumber,
        title: rawTitle.replace(/\s+/g, ' ').trim(),
        grade,
        hours: parseFloat(hoursText),
      });
      match = rowRe.exec(normalized);
    }

    const byCode = new Map();
    const labs = [];
    for (const c of raw) {
      const labMatch = c.code.match(/^([A-Z]{2,5}\s+\d{3})L$/);
      if (labMatch) labs.push({ parentCode: labMatch[1], ...c });
      else byCode.set(c.code, { ...c });
    }
    for (const lab of labs) {
      if (byCode.has(lab.parentCode)) byCode.get(lab.parentCode).hours += lab.hours;
      else byCode.set(lab.code, lab);
    }
    return Array.from(byCode.values());
  }

  // ========== UTILITIES ==========
  function slugify(name) {
    return 'ca-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  // ========== DOM PARSER ==========
  function parseCoreProgram() {
    const blocks = document.querySelectorAll('div.acalog-core');
    const cats = [];
    let section = '';
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const h2 = b.querySelector('h2'), h3 = b.querySelector('h3'), h4 = b.querySelector('h4');
      const p = b.querySelector('p');
      const inst = p ? p.textContent.trim() : '';
      const heading = h2 || h3 || h4;

      if (h2 && !h3 && !h4) {
        section = h2.textContent.trim();
        if (heading) heading.id = slugify(section);
        cats.push({ type: 'section-header', section, instructions: inst, element: b, coreIndex: i, slug: slugify(section) });
        continue;
      }

      let name = '';
      if (heading) {
        name = Array.from(heading.childNodes)
          .filter(n => n.nodeType === 3 || (n.nodeType === 1 && n.tagName === 'A'))
          .map(n => n.textContent.trim()).join('').trim();
        heading.id = slugify(name);
      }

      const isTag = h4 !== null;
      const rng = inst.match(/(\d+)[–-](\d+)\s+semester hours/);
      const disc = inst.match(/up to (\d+)\s+semester hours in any one discipline/);
      const minH = rng ? parseInt(rng[1]) : null;
      const maxH = rng ? parseInt(rng[2]) : null;
      const maxPD = disc ? parseInt(disc[1]) : null;
      const reqType = minH !== null ? 'hour-range' : 'pick-one';

      const ul = b.querySelector('ul');
      const courses = [];
        const subDisciplineElements = [];
      let curSub = null;
      if (ul) {
        for (const li of ul.children) {
          if (li.classList.contains('acalog-adhoc')) {
            const t = li.textContent.trim();
              if (!['Or', 'One from', 'And'].includes(t)) {
                curSub = t;
                subDisciplineElements.push({ name: t, element: li });
              }
          } else if (li.classList.contains('acalog-course')) {
            const link = li.querySelector('a');
            const lt = link ? link.textContent.trim() : '';
            const cm = lt.match(/^([A-Z]{2,5})\s+(\d{3}[A-Z]?)\s*-\s*(.+)$/);
            if (cm) courses.push({ code: cm[1] + ' ' + cm[2], title: cm[3].trim(), subDiscipline: curSub, element: li });
          }
        }
      }

      cats.push({
        type: isTag ? 'tag' : 'category', section, name, instructions: inst,
        reqType, minHours: minH, maxHours: maxH, maxPerDiscipline: maxPD,
        courses, subDisciplineElements, element: b, coreIndex: i, slug: slugify(name)
      });
    }
    return cats;
  }

  // ========== ANALYSIS ==========
  function analyze(cats, transcript) {
    const takenSet = new Set(transcript.map(c => c.code));
    const takenMap = {}; transcript.forEach(c => { takenMap[c.code] = c; });
    const c2c = {};
    for (const cat of cats) {
      if (!cat.courses || !cat.name) continue;
      for (const c of cat.courses) { if (!c2c[c.code]) c2c[c.code] = []; c2c[c.code].push(cat.name); }
    }
    const kuNames = ['World Languages II', 'Arts, Oral Rhetoric, Visual Rhetoric', 'Humanities',
                     'Mathematical Sciences', 'Natural Sciences', 'Social and Behavioral Sciences'];
    const kuH = {}; let kuTotal = 0, kuCount = 0;
    const results = [];

    for (const cat of cats) {
      if (cat.type === 'section-header') { results.push({ ...cat, status: 'header' }); continue; }
      if (!cat.courses || cat.courses.length === 0) { results.push({ ...cat, status: 'info-only' }); continue; }
      const takenHere = cat.courses.filter(c => takenSet.has(c.code));
      let hrsRaw = 0; const hByD = {};
      for (const c of takenHere) {
        const tc = takenMap[c.code]; const h = tc ? tc.hours : 0;
        hrsRaw += h; const d = c.subDiscipline || 'General'; hByD[d] = (hByD[d] || 0) + h;
      }
      const hrsEffective = (cat.maxHours !== null) ? Math.min(hrsRaw, cat.maxHours) : hrsRaw;
      const maxedD = new Set();
      if (cat.maxPerDiscipline) for (const [d, h] of Object.entries(hByD)) if (h >= cat.maxPerDiscipline) maxedD.add(d);
      const hasRemainingCourseOptions = cat.courses.some(c => !takenSet.has(c.code) && !maxedD.has(c.subDiscipline || 'General'));
      let status;
      if (cat.reqType === 'pick-one') status = takenHere.length > 0 ? 'complete' : 'incomplete';
      else {
        const minReq = cat.minHours || 0;
        if (minReq > 0) {
          if (hrsRaw < minReq) status = 'incomplete';
          else if (cat.maxPerDiscipline && cat.maxHours !== null && hrsEffective < cat.maxHours && hasRemainingCourseOptions) status = 'satisfied';
          else status = 'complete';
        } else status = hrsRaw > 0 ? 'complete' : 'optional-available';
      }
      if (kuNames.includes(cat.name)) {
        kuH[cat.name] = { raw: hrsRaw, effective: hrsEffective, max: cat.maxHours };
        kuTotal += hrsEffective; if (hrsRaw > 0) kuCount++;
      }
      const courseAnnotations = cat.courses.map(c => {
        const isTaken = takenSet.has(c.code);
        const allCats = c2c[c.code] || [];
        const otherCats = allCats.filter(n => n !== cat.name);
        return { ...c, isTaken, isMultiSection: allCats.length > 1, otherCategories: otherCats,
          isMaxedDiscipline: maxedD.has(c.subDiscipline || 'General') && !isTaken,
          grade: isTaken ? (takenMap[c.code]?.grade || '') : '', hours: isTaken ? (takenMap[c.code]?.hours || 0) : 0 };
      });
      results.push({ ...cat, status, hoursEarned: hrsRaw, hoursEffective: hrsEffective,
        hoursByDiscipline: hByD, maxedDisciplines: maxedD, takenCount: takenHere.length, courseAnnotations });
    }
    return { results, transcript, kuSummary: { totalHours: kuTotal, requiredHours: 26, categoriesUsed: kuCount, requiredCategories: 5, hoursByCategory: kuH } };
  }

  function clearRenderedState() {
    ['ca-styles', 'ca-toc-styles'].forEach(id => {
      document.getElementById(id)?.remove();
    });
    document.querySelectorAll('.ca-legend,.ca-summary-panel,.ca-badge,.ca-hours-note,#ca-toc,.ca-disclaimer,.ca-transcript-section').forEach(e => {
      e.remove();
    });
    document.querySelectorAll('[class*="ca-course-"],[class*="ca-category-"]').forEach(e => {
      e.className = e.className.replace(/ca-[\w-]+/g, '').trim();
      e.removeAttribute('data-ca-note');
    });
  }

  function ensureLauncherStyles() {
    if (document.getElementById(UI_IDS.styles)) return;
    const style = document.createElement('style');
    style.id = UI_IDS.styles;
    style.textContent = `
      #${UI_IDS.panel} {
        margin: 16px 0;
        padding: 14px 16px;
        border: 1px solid #cfd8dc;
        border-radius: 10px;
        background: linear-gradient(180deg, #f8fbfc, #eef5f6);
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
        font-family: system-ui, -apple-system, sans-serif;
      }
      #${UI_IDS.panel} details {
        margin: 0;
      }
      #${UI_IDS.panel} summary {
        cursor: pointer;
        font-weight: 700;
        color: #163642;
        list-style: none;
      }
      #${UI_IDS.panel} summary::-webkit-details-marker {
        display: none;
      }
      #${UI_IDS.panel} summary::before {
        content: '▸';
        display: inline-block;
        margin-right: 8px;
        transition: transform 0.15s ease;
      }
      #${UI_IDS.panel} details[open] summary::before {
        transform: rotate(90deg);
      }
      #${UI_IDS.panel} p {
        margin: 10px 0 0;
        color: #35515a;
        line-height: 1.45;
        font-size: 13px;
      }
      #${UI_IDS.textarea} {
        width: 100%;
        min-height: 140px;
        margin-top: 12px;
        padding: 10px 12px;
        border: 1px solid #aabcc3;
        border-radius: 8px;
        resize: vertical;
        box-sizing: border-box;
        font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
        background: #fff;
      }
      .ca-launcher-actions {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 10px;
      }
      .ca-launcher-button {
        border: 1px solid #244b57;
        background: #244b57;
        color: #fff;
        border-radius: 999px;
        padding: 7px 14px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .ca-launcher-button:hover {
        background: #1d3e48;
      }
      .ca-launcher-button-secondary {
        background: #fff;
        color: #244b57;
      }
      .ca-launcher-button-secondary:hover {
        background: #f3f7f8;
      }
      #${UI_IDS.status} {
        font-size: 12px;
        color: #35515a;
      }
      #${UI_IDS.status}.ca-status-success {
        color: ${COLORS.taken};
      }
      #${UI_IDS.status}.ca-status-error {
        color: #9f2d2d;
      }
    `;
    document.head.appendChild(style);
  }

  function setStatus(message, kind) {
    const status = document.getElementById(UI_IDS.status);
    if (!status) return;
    status.textContent = message;
    status.className = '';
    if (kind === 'success') status.classList.add('ca-status-success');
    if (kind === 'error') status.classList.add('ca-status-error');
  }

  function isSupportedCatalogPage() {
    const url = new URL(window.location.href);
    return url.pathname === TARGET_PAGE.pathname
      && url.searchParams.get('catoid') === TARGET_PAGE.catoid
      && url.searchParams.get('navoid') === TARGET_PAGE.navoid;
  }

  // ========== RENDERER ==========
  function render({ results, kuSummary, transcript }) {
    clearRenderedState();

    // ===== STYLES =====
    const style = document.createElement('style');
    style.id = 'ca-styles';
    style.textContent = `
      .ca-badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px;
        font-weight:bold; margin-left:8px; vertical-align:middle; letter-spacing:0.3px; white-space:nowrap; }
      .ca-badge-complete { background:${COLORS.takenBg}; color:${COLORS.taken}; border:1px solid ${COLORS.taken}; }
      .ca-badge-incomplete { background:${COLORS.opportunityBg}; color:${COLORS.opportunity}; border:1px solid ${COLORS.opportunity}; }
      .ca-badge-satisfied { background:#eef4ff; color:#1f5fbf; border:1px solid #8fb2ef; }
      .ca-badge-optional { background:#f0f0f0; color:#666; border:1px solid #ccc; }
      .ca-course-taken { background:${COLORS.takenBg}!important; border-left:3px solid ${COLORS.taken}!important; padding-left:6px; }
      .ca-course-taken > a:first-of-type { color:${COLORS.taken}!important; font-weight:bold; }
      .ca-course-taken::after { content:attr(data-ca-note); font-size:11px; color:${COLORS.taken}; margin-left:8px; font-style:italic; }
      .ca-course-opportunity { border-left:3px solid ${COLORS.opportunity}!important; padding-left:6px; }
      .ca-course-double-count { background:${COLORS.doubleCountBg}!important; border-left:3px solid ${COLORS.doubleCount}!important; padding-left:6px; }
      .ca-course-double-count::after { content:attr(data-ca-note); font-size:11px; color:${COLORS.doubleCount}; margin-left:8px; font-weight:bold; }
      .ca-course-taken-multi { background:linear-gradient(90deg, ${COLORS.takenBg} 70%, ${COLORS.doubleCountBg})!important;
        border-left:3px solid ${COLORS.taken}!important; padding-left:6px; }
      .ca-course-taken-multi > a:first-of-type { color:${COLORS.taken}!important; font-weight:bold; }
      .ca-course-taken-multi::after { content:attr(data-ca-note); font-size:11px; color:${COLORS.taken}; margin-left:8px; font-style:italic; }
      .ca-course-maxed { opacity:0.35; }
      .ca-category-complete { opacity:0.45; transition:opacity 0.2s; }
      .ca-category-complete:hover { opacity:1; }
      .ca-hours-note { font-size:11px; color:#555; margin:2px 0 6px 0; padding:3px 10px;
        background:#f8f8f0; border-radius:4px; display:block; border:1px solid #e0e0d0; line-height:1.5; }
      .ca-summary-panel { background:linear-gradient(135deg,#1a1a2e,#16213e); color:#e0e0e0;
        padding:18px 22px; border-radius:10px; margin:16px 0;
        font-family:system-ui,-apple-system,sans-serif; box-shadow:0 2px 12px rgba(0,0,0,0.15); }
      .ca-summary-panel h3 { color:#fff!important; margin:0 0 12px 0; font-size:16px; }
      .ca-summary-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:12px; }
      .ca-summary-item { background:rgba(255,255,255,0.08); padding:8px 12px; border-radius:6px; font-size:12px;
        cursor:pointer; transition:background 0.15s; text-decoration:none; display:block; }
      .ca-summary-item:hover { background:rgba(255,255,255,0.15); }
      .ca-summary-item .label { color:#aaa; font-size:11px; }
      .ca-summary-item .value { color:#fff; font-weight:bold; font-size:14px; }
      .ca-summary-item.complete .value { color:#4ade80; }
      .ca-summary-item.incomplete .value { color:#fbbf24; }
      .ca-summary-item .cap-note { color:#f87171; font-size:10px; }
      .ca-progress-bar { background:#2a2a3e; border-radius:8px; height:16px; overflow:hidden; position:relative; margin-top:4px; }
      .ca-progress-fill { height:100%; border-radius:8px; }
      .ca-progress-label { position:absolute; top:0; left:50%; transform:translateX(-50%);
        font-size:10px; font-weight:bold; line-height:16px; color:#fff; text-shadow:0 1px 2px rgba(0,0,0,0.5); }
      .ca-legend { display:flex; gap:16px; flex-wrap:wrap; margin:10px 0 16px 0; font-size:12px;
        font-family:system-ui,-apple-system,sans-serif; padding:8px 12px;
        background:#fafafa; border:1px solid #e0e0e0; border-radius:6px; }
      .ca-legend-item { display:flex; align-items:center; gap:5px; }
      .ca-legend-swatch { width:14px; height:14px; border-radius:3px; border:1px solid rgba(0,0,0,0.15); }
      .ca-disclaimer { font-size:12px; color:#7a5c00; background:#fffbea; border:1px solid #e8d87a;
        border-radius:6px; padding:7px 12px; margin:10px 0 6px 0;
        font-family:system-ui,-apple-system,sans-serif; line-height:1.5; }
      .ca-transcript-section { font-family:system-ui,-apple-system,sans-serif; margin:24px 0 16px 0; }
      .ca-transcript-section h3 { font-size:14px; color:#333!important; margin:0 0 8px 0; }
      .ca-transcript-table { width:100%; border-collapse:collapse; font-size:12px; }
      .ca-transcript-table th { background:#f0f0f0; text-align:left; padding:4px 8px;
        border-bottom:2px solid #ccc; font-weight:bold; color:#333; }
      .ca-transcript-table td { padding:3px 8px; border-bottom:1px solid #eee; vertical-align:top; }
      .ca-transcript-table tr:hover td { background:#f9f9f9; }
      .ca-transcript-cats { color:#555; font-style:italic; }
      .ca-transcript-none { color:#bbb; font-style:italic; }
    `;
    document.head.appendChild(style);

    // ===== TOC STYLES =====
    const tocStyle = document.createElement('style');
    tocStyle.id = 'ca-toc-styles';
    tocStyle.textContent = `
      #ca-toc { position:fixed; top:80px; right:0; z-index:10000; font-family:system-ui,-apple-system,sans-serif; }
      #ca-toc-toggle { position:absolute; top:0; right:0; width:36px; height:36px; border:1px solid #333; border-right:none;
        border-radius:6px 0 0 6px; background:#1a1a2e; color:#fff; font-size:18px; cursor:pointer;
        display:flex; align-items:center; justify-content:center; box-shadow:-2px 2px 8px rgba(0,0,0,0.15); z-index:2; }
      #ca-toc-toggle:hover { background:#16213e; }
      #ca-toc-panel { display:none; position:absolute; top:0; right:36px; width:240px; max-height:calc(100vh - 120px);
        overflow-y:auto; background:#1a1a2e; border-radius:8px 0 0 8px; box-shadow:-4px 4px 16px rgba(0,0,0,0.25); padding:8px 0; }
      .ca-toc-header { padding:8px 14px; font-size:13px; font-weight:bold; color:#fff;
        border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:4px; }
      .ca-toc-item { display:block; padding:4px 14px; font-size:12px; color:#ccc; text-decoration:none;
        border-left:3px solid transparent; transition:all 0.15s; line-height:1.3; cursor:pointer; }
      .ca-toc-item:hover { background:rgba(255,255,255,0.08); color:#fff; }
      .ca-toc-item.ca-toc-active { border-left-color:#fbbf24; color:#fff; background:rgba(255,255,255,0.05); font-weight:bold; }
      .ca-toc-cat { padding-left:24px; font-size:11px; }
      .ca-toc-tag { padding-left:32px; font-size:11px; font-style:italic; }
      .ca-toc-item:not(.ca-toc-cat):not(.ca-toc-tag) { font-weight:bold; font-size:11px; color:#fbbf24;
        text-transform:uppercase; letter-spacing:0.5px; margin-top:6px; padding-top:6px;
        border-top:1px solid rgba(255,255,255,0.06); }
      .ca-toc-status { font-size:9px; margin-left:4px; vertical-align:middle; }
      .ca-toc-status-done { color:#4ade80; }
      .ca-toc-status-needed { color:#fbbf24; }
      .ca-toc-status-satisfied { color:#8fb2ef; }
      .ca-toc-status-optional { color:#888; }
      #ca-toc-panel::-webkit-scrollbar { width:4px; }
      #ca-toc-panel::-webkit-scrollbar-track { background:transparent; }
      #ca-toc-panel::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:2px; }
    `;
    document.head.appendChild(tocStyle);

    const firstCore = document.querySelector('div.acalog-core');
    if (!firstCore) return;

    // ===== LEGEND =====
    const legend = document.createElement('div');
    legend.className = 'ca-legend';
    legend.innerHTML = `
      <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${COLORS.takenBg};border-color:${COLORS.taken}"></div>Taken</div>
      <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:linear-gradient(90deg,${COLORS.takenBg} 70%,${COLORS.doubleCountBg});border-color:${COLORS.taken}"></div>Taken (multi-section)</div>
      <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${COLORS.doubleCountBg};border-color:${COLORS.doubleCount}"></div>Double-count opportunity</div>
      <div class="ca-legend-item"><div class="ca-legend-swatch" style="border-left:3px solid ${COLORS.opportunity}"></div>Available</div>
      <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:#eee;opacity:0.35"></div>Maxed / satisfied</div>
    `;

    // ===== K&U SUMMARY PANEL (clickable links) =====
    const panel = document.createElement('div');
    panel.className = 'ca-summary-panel';
    const pct = Math.min(100, Math.round(kuSummary.totalHours / kuSummary.requiredHours * 100));
    const hColor = kuSummary.totalHours >= kuSummary.requiredHours ? '#4ade80' : '#fbbf24';
    const cColor = kuSummary.categoriesUsed >= kuSummary.requiredCategories ? '#4ade80' : '#fbbf24';
    const kuNames = ['World Languages II', 'Arts, Oral Rhetoric, Visual Rhetoric', 'Humanities',
                     'Mathematical Sciences', 'Natural Sciences', 'Social and Behavioral Sciences'];
    let gridHTML = '';
    for (const n of kuNames) {
      const info = kuSummary.hoursByCategory[n] || { raw: 0, effective: 0, max: null };
      const cls = info.raw > 0 ? 'complete' : 'incomplete';
      const capNote = (info.max !== null && info.raw > info.max) ? `<div class="cap-note">${info.raw}h earned, capped at ${info.max}h</div>` : '';
      const slug = slugify(n);
      gridHTML += `<a href="#${slug}" class="ca-summary-item ${cls}" data-slug="${slug}">
        <span class="label">${n}</span><br><span class="value">${info.effective} hrs</span>${capNote}</a>`;
    }
    panel.innerHTML = `
      <h3>\u{1F4CA} Core Program Audit</h3>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
        <span>K&U Hours: <strong style="color:${hColor}">${kuSummary.totalHours} / ${kuSummary.requiredHours}</strong></span>
        <span>K&U Categories: <strong style="color:${cColor}">${kuSummary.categoriesUsed} / ${kuSummary.requiredCategories}</strong></span>
      </div>
      <div class="ca-progress-bar"><div class="ca-progress-fill" style="width:${pct}%;background:${hColor}"></div>
        <div class="ca-progress-label">${pct}%</div></div>
      <div class="ca-summary-grid">${gridHTML}</div>`;
    panel.addEventListener('click', (e) => {
      const item = e.target.closest('.ca-summary-item');
      if (item) { e.preventDefault(); document.getElementById(item.dataset.slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });

    const disclaimer = document.createElement('div');
    disclaimer.className = 'ca-disclaimer';
    disclaimer.textContent = '\u26A0\uFE0F These results are unofficial and for planning purposes only. They may not reflect all institutional policies, transfer credit decisions, or advisor overrides. Always verify your core program status with your academic advisor or the Registrar.';

    firstCore.parentElement.insertBefore(legend, firstCore);
    firstCore.parentElement.insertBefore(panel, firstCore);
    firstCore.parentElement.insertBefore(disclaimer, firstCore);

    // ===== FLOATING TOC =====
    const tocContainer = document.createElement('div');
    tocContainer.id = 'ca-toc';
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'ca-toc-toggle';
    toggleBtn.textContent = '\u2630';
    toggleBtn.title = 'Table of Contents';
    const tocPanel = document.createElement('div');
    tocPanel.id = 'ca-toc-panel';

    let tocHTML = '<div class="ca-toc-header">\u{1F4D1} Core Program</div>';
    for (const r of results) {
      if (!r.slug) continue;
      const indent = r.type === 'section-header' ? '' : (r.type === 'tag' ? 'ca-toc-tag' : 'ca-toc-cat');
      const label = r.name || r.section;
      let statusIcon = '';
      if (r.status === 'complete') statusIcon = '<span class="ca-toc-status ca-toc-status-done">\u2713</span>';
      else if (r.status === 'satisfied') statusIcon = '<span class="ca-toc-status ca-toc-status-satisfied">\u25D4</span>';
      else if (r.status === 'incomplete') statusIcon = '<span class="ca-toc-status ca-toc-status-needed">\u25CB</span>';
      else if (r.status === 'optional-available') statusIcon = '<span class="ca-toc-status ca-toc-status-optional">\u25CB</span>';
      tocHTML += `<a href="#${r.slug}" class="ca-toc-item ${indent}" data-slug="${r.slug}">${label}${statusIcon}</a>`;
    }
    tocPanel.innerHTML = tocHTML;
    tocContainer.appendChild(toggleBtn);
    tocContainer.appendChild(tocPanel);
    document.body.appendChild(tocContainer);

    let tocOpen = false;
    toggleBtn.addEventListener('click', () => {
      tocOpen = !tocOpen;
      tocPanel.style.display = tocOpen ? 'block' : 'none';
      toggleBtn.textContent = tocOpen ? '\u2715' : '\u2630';
    });
    tocPanel.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link) { e.preventDefault(); document.getElementById(link.dataset.slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });

    // Scroll spy
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const slug = entry.target.id;
          document.querySelectorAll('.ca-toc-item').forEach(a => {
            a.classList.remove('ca-toc-active');
          });
          const active = document.querySelector(`.ca-toc-item[data-slug="${slug}"]`);
          if (active) { active.classList.add('ca-toc-active'); active.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
        }
      }
    }, { rootMargin: '-10% 0px -80% 0px' });
    results.filter(r => r.slug).forEach(r => {
      const el = document.getElementById(r.slug);
      if (el) observer.observe(el);
    });

    // ===== ANNOTATE CATEGORIES =====
    for (const r of results) {
      if (r.status === 'header' || !r.courseAnnotations) continue;
      const block = r.element;
      const heading = block.querySelector('h3') || block.querySelector('h4');

      if (heading) {
        const badge = document.createElement('span');
        badge.className = 'ca-badge';
        if (r.status === 'complete') { badge.className += ' ca-badge-complete'; badge.textContent = '\u2713 COMPLETE'; }
        else if (r.status === 'satisfied') { badge.className += ' ca-badge-satisfied'; badge.textContent = 'MIN MET'; }
        else if (r.status === 'optional-available') { badge.className += ' ca-badge-optional'; badge.textContent = 'OPTIONAL'; }
        else { badge.className += ' ca-badge-incomplete';
          badge.textContent = r.reqType === 'hour-range' ? r.hoursEarned + '/' + (r.minHours || 0) + '+ hrs' : 'NEEDED'; }
        heading.appendChild(badge);
      }

      if (Array.isArray(r.subDisciplineElements)) {
        for (const sub of r.subDisciplineElements) {
          if (!r.maxedDisciplines.has(sub.name)) continue;
          const badge = document.createElement('span');
          badge.className = 'ca-badge ca-badge-complete';
          badge.textContent = '\u2713 COMPLETE';
          sub.element.appendChild(badge);
        }
      }

      if (r.reqType === 'hour-range' && (r.hoursEarned > 0 || r.maxPerDiscipline)) {
        const note = document.createElement('span');
        note.className = 'ca-hours-note';
        let txt = '\u{1F4D0} ' + r.hoursEarned + 'h earned';
        if (r.minHours !== null) txt += ' (need ' + r.minHours + '\u2013' + r.maxHours + 'h)';
        if (r.maxHours !== null && r.hoursEarned > r.maxHours)
          txt += ' \u26A0\uFE0F over max by ' + (r.hoursEarned - r.maxHours) + 'h \u2014 only ' + r.maxHours + 'h count toward K&U total';
        if (Object.keys(r.hoursByDiscipline).length > 0) {
          const parts = Object.entries(r.hoursByDiscipline).map(([d, h]) => {
            return d + ': ' + h + 'h' + (r.maxedDisciplines.has(d) ? ' \u26A0\uFE0F maxed' : '');
          }).join(' \u00B7 ');
          txt += ' \u2014 ' + parts;
          if (r.maxPerDiscipline) txt += ' (max ' + r.maxPerDiscipline + 'h/discipline)';
        }
        note.textContent = txt;
        block.querySelector('p')?.after(note);
      }

      if (r.status === 'complete' && r.type !== 'tag') block.classList.add('ca-category-complete');

      for (const c of r.courseAnnotations) {
        if (!c.element) continue;
        const li = c.element;
        if (c.isTaken) {
          if (c.isMultiSection) {
            li.classList.add('ca-course-taken-multi');
            li.setAttribute('data-ca-note', '\u2713 ' + c.grade + ' (' + c.hours + 'h) \u21C9 Also: ' + c.otherCategories.join(', '));
          } else {
            li.classList.add('ca-course-taken');
            li.setAttribute('data-ca-note', '\u2713 ' + c.grade + ' (' + c.hours + 'h)');
          }
        } else if (r.status === 'complete' && r.type !== 'tag') {
          if (c.isMultiSection) {
            li.classList.add('ca-course-double-count');
            li.setAttribute('data-ca-note', '\u21C9 Also: ' + c.otherCategories.join(', '));
          } else li.classList.add('ca-course-maxed');
        } else if (c.isMaxedDiscipline) {
          li.classList.add('ca-course-maxed');
        } else if (c.isMultiSection && !c.isTaken) {
          li.classList.add('ca-course-double-count');
          li.setAttribute('data-ca-note', '\u21C9 Also: ' + c.otherCategories.join(', '));
        } else if (r.status !== 'complete') {
          li.classList.add('ca-course-opportunity');
        } else li.classList.add('ca-course-maxed');
      }
    }

    // ===== TRANSCRIPT REFERENCE TABLE =====
    if (transcript && transcript.length > 0) {
      const courseToCategories = {};
      for (const r of results) {
        if (!r.courseAnnotations) continue;
        for (const c of r.courseAnnotations) {
          if (!courseToCategories[c.code]) courseToCategories[c.code] = [];
          courseToCategories[c.code].push(r.name);
        }
      }

      const section = document.createElement('div');
      section.className = 'ca-transcript-section';
      let rows = '';
      for (const c of transcript) {
        const cats = courseToCategories[c.code] || [];
        const catsCell = cats.length > 0
          ? `<span class="ca-transcript-cats">${cats.join(', ')}</span>`
          : `<span class="ca-transcript-none">not in core lists</span>`;
        rows += `<tr><td><strong>${c.code}</strong></td><td>${c.title}</td><td>${c.grade}</td><td>${c.hours}h</td><td>${catsCell}</td></tr>`;
      }
      section.innerHTML = `<h3>\u{1F4CB} Transcript Reference (${transcript.length} courses)</h3>
        <table class="ca-transcript-table">
          <thead><tr><th>Code</th><th>Title</th><th>Grade</th><th>Hrs</th><th>Core Categories</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
      firstCore.parentElement.appendChild(section);
    }
  }

  // ========== MAIN ==========
  function runAnnotation(text) {
    const normalized = (text || '').trim();
    if (normalized.length === 0) {
      setStatus('Paste your Workday Academic History transcript to run the audit.', null);
      return;
    }

    const transcript = parseTranscript(normalized);
    if (transcript.length === 0) {
      clearRenderedState();
      setStatus('Could not parse any courses. Copy from Workday Academic Record > Academic History and paste the full content here.', 'error');
      return;
    }

    const categories = parseCoreProgram();
    const analysis = analyze(categories, transcript);
    render(analysis);
    setStatus(
      'Audit updated: ' + transcript.length + ' courses, ' + analysis.kuSummary.totalHours + '/' + analysis.kuSummary.requiredHours
        + ' K&U hours, ' + analysis.kuSummary.categoriesUsed + '/' + analysis.kuSummary.requiredCategories + ' K&U categories.',
      'success'
    );
    console.log('[Core Annotator]', transcript.length, 'courses:', transcript.map(c => c.code + '(' + c.hours + 'h)'));
    console.log('[Core Annotator] K&U:', analysis.kuSummary);
  }

  function mountLauncher() {
    if (document.getElementById(UI_IDS.panel)) return;
    const firstCore = document.querySelector('div.acalog-core');
    if (!firstCore || !firstCore.parentElement) return;

    ensureLauncherStyles();

    const panel = document.createElement('section');
    panel.id = UI_IDS.panel;
    panel.innerHTML = `
      <details id="${UI_IDS.details}">
        <summary>Calvin Core Annotator</summary>
        <p>Open Workday, go to Academic Record, open Academic History, select all, copy, then paste here. Pasting runs the audit immediately.</p>
        <textarea id="${UI_IDS.textarea}" spellcheck="false" placeholder="Paste Workday Academic History here"></textarea>
        <div class="ca-launcher-actions">
          <button type="button" class="ca-launcher-button" data-action="analyze">Analyze pasted transcript</button>
          <button type="button" class="ca-launcher-button ca-launcher-button-secondary" data-action="reset">Reset annotations</button>
          <span id="${UI_IDS.status}">Paste your Workday Academic History transcript to run the audit.</span>
        </div>
      </details>`;
    firstCore.parentElement.insertBefore(panel, firstCore);

    const details = panel.querySelector('details');
    const textarea = panel.querySelector('textarea');
    panel.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      if (button.dataset.action === 'analyze') runAnnotation(textarea.value);
      if (button.dataset.action === 'reset') {
        textarea.value = '';
        clearRenderedState();
        setStatus('Annotations cleared.', null);
        details.open = false;
      }
    });
    textarea.addEventListener('paste', (event) => {
      const pasted = event.clipboardData?.getData('text/plain');
      if (typeof pasted === 'string' && pasted.length > 0) {
        event.preventDefault();
        textarea.value = pasted;
        runAnnotation(pasted);
        details.open = false;
        return;
      }
      window.setTimeout(() => {
        runAnnotation(textarea.value);
        details.open = false;
      }, 0);
    });
  }

  function main() {
    if (!isSupportedCatalogPage()) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountLauncher, { once: true });
      return;
    }
    mountLauncher();
  }

  main();
})();