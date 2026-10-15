// Standalone app rendering: builds the whole page from saved catalog data and
// (optionally) an analyze() result. Takes a root element so tests can render
// into jsdom. Catalog text (names, instructions, course titles) is shown
// verbatim; test/test-app-fidelity.js compares it against the saved catalog HTML.

import { classifyInstructions, doubleCountConfirmed, KU_NAMES } from './core.js';

const CATALOG_ORIGIN = 'https://catalog.calvin.edu';

export function courseUrl(catoid, coid) {
  return `${CATALOG_ORIGIN}/preview_course_nopop.php?catoid=${catoid}&coid=${coid}`;
}

export function requirementUrl(meta, coreId) {
  return meta.sourceUrl + (coreId ? '#' + coreId : '');
}

export function catalogLabel(meta) {
  return meta.catalogYear.replace('-', '–');
}

const fmtHours = n => String(+Number(n).toFixed(2));

// Tiny element builder: h('div', { class: 'x', onclick }, child, 'text', ...)
function builder(doc) {
  return function h(tag, props, ...children) {
    const el = doc.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(typeof c === 'string' || typeof c === 'number' ? String(c) : c);
    }
    return el;
  };
}

function statusInfo(r) {
  if (!r) return null;
  if (r.isExempt) return { cls: 'done', text: 'Exempt' };
  switch (r.status) {
    case 'complete': return { cls: 'done', text: 'Complete' };
    case 'satisfied': return { cls: 'min', text: 'Minimum met' };
    case 'optional-available': return { cls: 'optional', text: 'Optional' };
    case 'incomplete':
      return { cls: 'todo', text: r.reqType === 'hour-range'
        ? `${fmtHours(r.hoursEarned)} of ${r.minHours}+ hrs` : 'Not yet' };
    default: return null;
  }
}

// K&U as a whole: enough hours, enough categories, and each category's minimum.
export function kuStatus(analysis) {
  const ku = analysis.kuSummary;
  if (ku.requiredHours == null || ku.requiredCategories == null) return null;
  const kuResults = analysis.results.filter(r => KU_NAMES.includes(r.name));
  const met = ku.totalHours >= ku.requiredHours && ku.categoriesUsed >= ku.requiredCategories
    && kuResults.every(r => r.status !== 'incomplete');
  return { met, ...ku };
}

// state: {
//   catalog: { _meta, categories }      selected catalog
//   catalogs: [{ _meta, categories }]   all known catalogs (for provenance)
//   analysis: analyze() result or null
//   openLists: Map slug → bool          remembered <details> state
//   onTogglePlanned(code), onListToggle(slug, open)
// }
export function renderApp(root, state) {
  const doc = root.ownerDocument;
  const h = builder(doc);
  const { catalog, catalogs = [catalog], analysis, openLists = new Map() } = state;
  const meta = catalog._meta;
  const resultsByIndex = new Map((analysis?.results || []).map(r => [r.coreIndex, r]));
  const slugByName = new Map(catalog.categories.filter(c => c.name).map(c => [c.name, c.slug]));

  // Where another catalog lists a course under the same requirement.
  function otherCatalogListing(catName, code) {
    for (const other of catalogs) {
      if (other._meta.catoid === meta.catoid) continue;
      const cat = other.categories.find(c => c.name === catName);
      const course = cat?.courses?.find(c => c.code === code);
      if (course) return { meta: other._meta, course };
    }
    return null;
  }

  function categoryLinks(names) {
    return names.map((n, i) => [i > 0 ? ', ' : '', slugByName.has(n) ? h('a', { href: '#' + slugByName.get(n) }, n) : n]);
  }

  function wording(instructions) {
    const sentences = classifyInstructions(instructions);
    if (sentences.length === 0) return null;
    return h('ul', { class: 'catalog-wording' }, sentences.map(s => {
      const kind = s.rule?.checked ? 'checked' : s.rule?.advice ? 'advice' : s.rule?.partial ? 'partial' : 'unchecked';
      const note = s.rule ? s.rule.note : 'This tool doesn\u2019t recognize this wording.';
      return h('li', { class: 'sentence is-' + kind },
        h('span', { class: 'sentence-text' }, s.text),
        h('span', { class: 'sentence-check', title: kind === 'checked' ? 'This tool checks this' : note },
          { checked: 'Checked', advice: 'Advice', partial: 'Partly checked', unchecked: 'Not checked' }[kind]),
        kind === 'unchecked' || kind === 'partial' ? h('span', { class: 'sentence-note' }, note) : null);
    }));
  }

  function courseRow(cat, c, a) {
    // a: the course's annotation from analyze(), if any
    const flags = [];
    let rowCls = 'course';
    if (a) {
      if (a.isExcludedTransfer) { rowCls += ' is-excluded'; flags.push(h('span', { class: 'chip chip-excluded' }, `Transfer, ${fmtHours(a.hours)} hrs — not accepted here`)); }
      else if (a.isInProgress) { rowCls += ' is-active'; flags.push(h('span', { class: 'chip chip-progress' }, `In progress · ${fmtHours(a.hours)} hrs`)); }
      else if (a.isTaken) {
        rowCls += ' is-active';
        flags.push(h('span', { class: 'chip chip-taken' },
          (a.isTransfer ? 'Transfer' : 'Taken') + (a.grade && !a.isTransfer ? ` · ${a.grade}` : '') + ` · ${fmtHours(a.hours)} hrs`));
      } else if (a.isPlanned) { rowCls += ' is-planned'; flags.push(h('span', { class: 'chip chip-planned' }, 'Planned')); }
      else if (a.isMaxedDiscipline) { rowCls += ' is-maxed'; flags.push(h('span', { class: 'chip chip-muted' }, 'Discipline max reached')); }
      if (a.otherCategories?.length) {
        flags.push(h('span', { class: 'also' }, 'Also listed for ', categoryLinks(a.otherCategories)));
      }
    }
    const active = a && (a.isTaken || a.isInProgress);
    const planBtn = a && !active && typeof state.onTogglePlanned === 'function'
      ? h('button', { type: 'button', class: 'plan-toggle' + (a.isPlanned ? ' is-on' : ''),
          'aria-pressed': a.isPlanned ? 'true' : 'false',
          onclick: () => state.onTogglePlanned(c.code) }, a.isPlanned ? 'Planned ✓' : '+ Plan')
      : null;
    return h('li', { class: rowCls, dataset: { kind: 'course', code: c.code } },
      h('a', { class: 'course-code', href: courseUrl(meta.catoid, c.coid), target: '_blank', rel: 'noopener',
        title: 'Course description in the official catalog' }, c.code),
      h('span', { class: 'course-title' }, c.title),
      flags.length ? h('span', { class: 'course-flags' }, flags) : null,
      planBtn);
  }

  function courseList(cat, r) {
    const annByCode = new Map((r?.courseAnnotations || []).map(a => [a.code, a]));
    const items = [];
    let sub = null;
    for (const c of cat.courses) {
      if (c.subDiscipline !== sub) {
        sub = c.subDiscipline;
        if (sub) {
          const info = r?.subDisciplines?.[sub];
          items.push(h('li', { class: 'course-heading', dataset: { kind: 'heading' } },
            h('span', { class: 'heading-text' }, sub),
            info ? h('span', { class: 'chip ' + (info.isMaxed ? 'chip-taken' : info.hoursEarned > 0 ? 'chip-min' : 'chip-muted') },
              `${fmtHours(info.hoursEarned)} of max ${info.cap} hrs`) : null));
        }
      }
      if (c.connectorBefore) {
        items.push(h('li', { class: 'course-connector', dataset: { kind: 'connector' } }, c.connectorBefore));
      }
      items.push(courseRow(cat, c, annByCode.get(c.code)));
    }
    return h('ol', { class: 'course-list' }, items);
  }

  // Taken courses counted here that this catalog doesn't list here.
  function extraCourses(cat, r) {
    const extras = (r?.courseAnnotations || []).filter(a => a.isFromOtherCatalog || a.isAssumed);
    if (extras.length === 0) return null;
    return h('div', { class: 'extra-courses' },
      h('p', { class: 'extra-label' }, `Also counted here, though the ${catalogLabel(meta)} catalog doesn’t list them:`),
      h('ul', {}, extras.map(a => {
        let why;
        if (a.isAssumed) {
          why = `Assumed: credit with no course number, placed here by its subject${a.subDiscipline ? ' (as ' + a.subDiscipline + ')' : ''}. Check Workday.`;
        } else {
          const other = otherCatalogListing(cat.name, a.code);
          why = other
            ? h('span', {}, 'Listed for this requirement in the ',
              h('a', { href: courseUrl(other.meta.catoid, other.course.coid), target: '_blank', rel: 'noopener' }, catalogLabel(other.meta) + ' catalog'), '.')
            : 'Listed for this requirement in another catalog year.';
        }
        return h('li', { class: 'extra-course', dataset: { kind: 'extra-course', code: a.code, provenance: a.isAssumed ? 'assumed' : 'other-catalog' } },
          h('strong', {}, a.code), a.title ? ' ' + a.title : '', ` · ${fmtHours(a.hours)} hrs — `, why);
      })));
  }

  function hoursLine(cat, r) {
    if (cat.reqType !== 'hour-range') return null;
    const parts = [`Counts ${cat.minHours}–${cat.maxHours} hrs`];
    if (cat.maxPerDiscipline) parts.push(`at most ${cat.maxPerDiscipline} from one discipline`);
    if (!r) return h('p', { class: 'req-hours' }, parts.join(', ') + '.');
    let text = `You have ${fmtHours(r.hoursEarned)} hrs here. ` + parts.join(', ') + '.';
    if (cat.maxHours !== null && r.hoursEarned > cat.maxHours) text += ` Only ${cat.maxHours} count toward the K&U total.`;
    return h('p', { class: 'req-hours' }, text);
  }

  function requirementCard(cat) {
    const r = resultsByIndex.get(cat.coreIndex);
    let status = statusInfo(r);
    const notes = [];
    if (cat.alternatives) {
      notes.push('Read as: ' + cat.alternatives.map(alt => alt.join(' and ')).join(', or ') + '.');
    }
    // "Complete at least one tagged course in all three areas" (no course list of its own).
    if (classifyInstructions(cat.instructions).some(s => s.rule?.id === 'three-tags') && analysis) {
      const tags = analysis.results.filter(t => t.type === 'tag' && t.section === cat.section);
      const done = tags.filter(t => t.status === 'complete').length;
      status = { cls: done === tags.length ? 'done' : 'todo', text: `${done} of ${tags.length} tags` };
    }
    const hasCourses = cat.courses?.length > 0;
    const defaultOpen = analysis ? (r?.status !== 'complete' && !r?.isExempt) : cat.courses?.length <= 12;
    const open = openLists.has(cat.slug) ? openLists.get(cat.slug) : defaultOpen;
    const activeHere = (r?.courseAnnotations || []).filter(a => (a.isTaken || a.isInProgress) && !a.isFromOtherCatalog && !a.isAssumed);

    return h('article', { class: 'req' + (cat.type === 'tag' ? ' is-tag' : '') + (status ? ' status-' + status.cls : ''),
      id: cat.slug, dataset: { coreIndex: cat.coreIndex } },
      h('header', { class: 'req-header' },
        h('h3', { class: 'req-name' }, cat.name),
        cat.type === 'tag' ? h('span', { class: 'tag-label' }, 'Overlaps other requirements') : null,
        status ? h('span', { class: 'status-pill status-' + status.cls }, status.text) : null),
      wording(cat.instructions),
      notes.map(n => h('p', { class: 'req-note' }, n)),
      hoursLine(cat, r),
      activeHere.length && !open ? h('p', { class: 'req-taken' }, 'Counted: ',
        activeHere.map((a, i) => [i ? ', ' : '', a.code])) : null,
      extraCourses(cat, r),
      r?.isExempt ? h('p', { class: 'req-note' }, 'Academic Progress lists an exemption for this requirement.') : null,
      hasCourses ? h('details', { class: 'course-options', open: open || null,
        ontoggle: e => state.onListToggle?.(cat.slug, e.target.open) },
        h('summary', {}, `Course options (${cat.courses.length})`),
        courseList(cat, r)) : null,
      h('p', { class: 'req-source' }, h('a', { href: requirementUrl(meta, cat.coreId), target: '_blank', rel: 'noopener' },
        `View in the ${catalogLabel(meta)} catalog`)));
  }

  function summary() {
    if (!analysis) return null;
    const groups = [];
    let cur = null;
    for (const cat of catalog.categories) {
      if (cat.type === 'section-header') { cur = { section: cat, items: [] }; groups.push(cur); continue; }
      const r = resultsByIndex.get(cat.coreIndex);
      if (!cur || !r || r.status === 'info-only') continue;
      cur.items.push({ cat, r });
    }
    const ku = kuStatus(analysis);
    const countable = groups.flatMap(g => g.items).filter(({ cat }) => !KU_NAMES.includes(cat.name));
    const done = countable.filter(({ r }) => r.status === 'complete' || r.isExempt).length + (ku?.met ? 1 : 0);
    const total = countable.length + (ku ? 1 : 0);

    return h('section', { class: 'summary', 'aria-label': 'Summary' },
      h('h2', {}, `${done} of ${total} requirements met`),
      h('p', { class: 'summary-sub' }, 'By this tool’s reading of the catalog. Workday may differ.'),
      groups.filter(g => g.items.length).map(g => h('div', { class: 'summary-group' },
        h('h3', {}, g.section.section),
        KU_NAMES.includes(g.items[0].cat.name) && ku ? kuMeter(ku) : null,
        h('ul', { class: 'summary-chips' }, g.items.map(({ cat, r }) => {
          const s = statusInfo(r) || { cls: 'muted', text: '' };
          const label = KU_NAMES.includes(cat.name) ? `${fmtHours(r.hoursEffective)} hrs` : s.text;
          return h('li', {}, h('a', { href: '#' + cat.slug, class: 'summary-chip status-' + s.cls },
            h('span', { class: 'chip-name' }, cat.name), h('span', { class: 'chip-value' }, label)));
        })))));
  }

  function kuMeter(ku) {
    const pct = Math.min(100, Math.round(ku.totalHours / ku.requiredHours * 100));
    return h('div', { class: 'ku-meter' + (ku.met ? ' is-met' : '') },
      h('div', { class: 'ku-numbers' },
        h('span', {}, h('strong', {}, `${fmtHours(ku.totalHours)} of ${ku.requiredHours}`), ' hrs'),
        h('span', {}, h('strong', {}, `${ku.categoriesUsed} of ${ku.requiredCategories}`), ' categories')),
      h('div', { class: 'meter', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': ku.requiredHours, 'aria-valuenow': ku.totalHours },
        h('div', { class: 'meter-fill', style: `width:${pct}%` })));
  }

  function warnings() {
    if (!analysis) return null;
    const items = [];
    for (const w of analysis.kuWarnings || []) {
      items.push(h('li', {}, h('strong', {}, w.code), w.title ? ' ' + w.title : '', ` (${fmtHours(w.hours)} hrs): ${w.reason}. Your K&U totals may be too low.`));
    }
    for (const r of analysis.results) {
      for (const a of r.courseAnnotations || []) {
        if (a.isExcludedTransfer) items.push(h('li', {}, h('strong', {}, a.code),
          ` is transfer credit, which `, h('a', { href: '#' + r.slug }, r.name), ' doesn’t accept, so it isn’t counted there.'));
      }
    }
    if (items.length === 0) return null;
    return h('section', { class: 'callout callout-warn' }, h('h2', {}, 'Check these in Workday'), h('ul', {}, items));
  }

  // Interpretations this result depends on, listed only when they apply.
  function assumptions() {
    if (!analysis) return null;
    const items = [];
    const all = analysis.results.flatMap(r => (r.courseAnnotations || []).map(a => ({ r, a })));
    const active = all.filter(({ a }) => (a.isTaken || a.isInProgress) && !a.isExcludedTransfer);
    if (active.some(({ a }) => a.isFromOtherCatalog)) items.push('A course listed for a requirement in another catalog year is counted toward that requirement too (courses get renumbered between years).');
    if (active.some(({ a }) => a.isAssumed)) items.push('Transfer or AP credit without a course number is placed by its subject, e.g. HIST counts as History.');
    const catByName = new Map(catalog.categories.filter(c => c.name).map(c => [c.name, c]));
    const unconfirmed = active.filter(({ r, a }) => (a.otherCategories || [])
      .some(n => !doubleCountConfirmed(catByName.get(r.name), catByName.get(n))));
    if (unconfirmed.length) {
      const codes = [...new Set(unconfirmed.map(({ a }) => a.code))].join(', ');
      items.push(`A course listed under several requirements counts toward each of them (${codes}).`);
    }
    if (active.some(({ a }) => a.isInProgress)) items.push('In-progress courses are counted as if completed.');
    if (analysis.plannedCourses?.length) items.push('Planned courses are shown but not counted.');
    if (items.length === 0) return null;
    return h('section', { class: 'callout' }, h('h2', {}, 'This result assumes'), h('ul', {}, items.map(t => h('li', {}, t))));
  }

  function transcriptTable() {
    const transcript = analysis?.transcript;
    if (!transcript?.length) return null;
    const where = new Map();
    for (const r of analysis.results) {
      for (const a of r.courseAnnotations || []) {
        if (!(a.isTaken || a.isInProgress) || a.isExcludedTransfer) continue;
        if (!where.has(a.code)) where.set(a.code, []);
        where.get(a.code).push(r.name);
      }
    }
    const statusText = { 'in-progress': 'In progress', transfer: 'Transfer', exemption: 'Exemption', completed: '' };
    return h('section', { class: 'transcript' },
      h('h2', {}, `Your courses (${transcript.length})`),
      h('div', { class: 'table-wrap' }, h('table', {},
        h('thead', {}, h('tr', {}, ['Course', 'Title', 'Grade', 'Hrs', 'Counts toward'].map(t => h('th', {}, t)))),
        h('tbody', {}, transcript.map(c => {
          const names = where.get(c.code) || [];
          return h('tr', {},
            h('td', {}, h('strong', {}, c.code || '—'), statusText[c.status] ? h('span', { class: 'cell-status' }, statusText[c.status]) : null),
            h('td', {}, c.title),
            h('td', {}, c.grade || '—'),
            h('td', {}, fmtHours(c.hours)),
            h('td', {}, names.length ? categoryLinks(names) : h('span', { class: 'muted' }, 'none')));
        })))));
  }

  const body = [];
  body.push(warnings(), summary(), assumptions());
  for (const cat of catalog.categories) {
    if (cat.type === 'section-header') {
      body.push(h('section', { class: 'req-section', id: cat.slug, dataset: { coreIndex: cat.coreIndex } },
        h('h2', { class: 'req-section-title' }, cat.section),
        wording(cat.instructions)));
    } else {
      const sections = body.filter(el => el?.classList?.contains('req-section'));
      const container = sections[sections.length - 1];
      if (container) container.append(requirementCard(cat));
      else body.push(requirementCard(cat));
    }
  }
  body.push(transcriptTable());
  root.replaceChildren(...body.filter(Boolean));
}
