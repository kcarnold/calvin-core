// ========== TRANSCRIPT PARSER ==========
export function parseTranscript(text) {
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
export function slugify(name) {
  return 'ca-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ========== DOM PARSER ==========
// Accepts a root element (defaults to document in browser).
// In tests, pass a jsdom document or a container element with querySelectorAll.
export function parseCoreProgram(root) {
  if (!root) root = document;
  const blocks = root.querySelectorAll('div.acalog-core');
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
export const KU_NAMES = [
  'World Languages II', 'Arts, Oral Rhetoric, Visual Rhetoric', 'Humanities',
  'Mathematical Sciences', 'Natural Sciences', 'Social and Behavioral Sciences'
];

export function analyze(cats, transcript) {
  const takenSet = new Set(transcript.map(c => c.code));
  const takenMap = {}; transcript.forEach(c => { takenMap[c.code] = c; });
  const c2c = {};
  for (const cat of cats) {
    if (!cat.courses || !cat.name) continue;
    for (const c of cat.courses) { if (!c2c[c.code]) c2c[c.code] = []; c2c[c.code].push(cat.name); }
  }
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
    if (KU_NAMES.includes(cat.name)) {
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
