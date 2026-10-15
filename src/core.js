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
      status: 'completed',
    });
    match = rowRe.exec(normalized);
  }

  // Deduplicate by course code; keep first occurrence from the transcript.
  const byCode = new Map();
  for (const c of raw) {
    if (!byCode.has(c.code)) byCode.set(c.code, { ...c });
  }
  return Array.from(byCode.values());
}

// ========== PROGRESS PARSER ==========
// Parses copy-paste from Workday Academic Progress page.
// Returns { courses: [...], exemptions: [...], overrides: Set }
export function parseProgress(text) {
  const lines = text
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const courseRe = /^([A-Z]{2,5})\s+(\d{3}[A-Z]?L?)\s*-\s*(.+)$/;
  const exemptionRe = /^(.+?\bExemption)\s*-\s*(\d{2}\/\d{2}\/\d{4})$/;
  const overrideRe = /\(Override Assigned\)/;
  const raw = [];
  const exemptions = [];
  const overrides = new Set();

  for (let i = 0; i < lines.length; i++) {
    // Detect overrides on requirement lines
    if (overrideRe.test(lines[i])) {
      const reqName = lines[i].replace(/\s*\(Click for more details\)/g, '').replace(/\s*\(Override Assigned\)/g, '').trim();
      overrides.add(reqName);
    }

    // Detect exemptions (e.g., "Language Exemption - 07/01/2023")
    const exMatch = lines[i].match(exemptionRe);
    if (exMatch) {
      const exName = exMatch[1].trim();
      let target = null;
      if (/language/i.test(exName)) target = 'World Languages I';
      exemptions.push({ name: exName, date: exMatch[2], target });
      // Look ahead for hours
      let hours = 0;
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        if (/^\d+$/.test(lines[j])) { hours = parseInt(lines[j]); break; }
        if (courseRe.test(lines[j])) break;
      }
      if (target) {
        raw.push({
          code: null, title: exName, grade: null, hours,
          status: 'exemption', exemptionTarget: target,
        });
      }
      continue;
    }

    // Detect course lines
    const cm = lines[i].match(courseRe);
    if (!cm) continue;

    let title = cm[3].trim();
    let status = 'completed';
    if (/\(In Progress\)/.test(title)) {
      status = 'in-progress';
      title = title.replace(/\s*\(In Progress\)/, '').trim();
    } else if (/\(Transfer Credit\)/.test(title)) {
      status = 'transfer';
      title = title.replace(/\s*\(Transfer Credit\)/, '').trim();
    }

    // Look ahead for academic period, hours, grade
    let hours = 0;
    let grade = null;
    let period = null;
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const line = lines[j];
      if (courseRe.test(line) || exemptionRe.test(line)) break;
      if (/^\d{4}\s+(Fall|Spring|Summer|Winter|Interim)$/i.test(line)) {
        period = line;
      } else if (/^\d+$/.test(line) && hours === 0) {
        hours = parseInt(line);
      } else if (/^[A-Z]{1,2}[+-]?$/.test(line) || line === 'CR') {
        grade = line;
      }
    }

    raw.push({ code: cm[1] + ' ' + cm[2], title, grade, hours, status, period });
  }

  // Deduplicate by code/title; keep first occurrence.
  const byCode = new Map();
  for (const c of raw) {
    if (c.code === null) {
      if (!byCode.has(c.title)) byCode.set(c.title, c);
      continue;
    }
    if (!byCode.has(c.code)) {
      byCode.set(c.code, { ...c });
    }
  }
  const courses = Array.from(byCode.values());
  return { courses, exemptions, overrides };
}

// ========== FORMAT DETECTION ==========
export function detectInputFormat(text) {
  if (/RequirementSort and filter column|StatusSort and filter column|Satisfied With/.test(text)) {
    return 'progress';
  }
  if (/Opens in new window/.test(text)) {
    return 'transcript';
  }
  // Fallback: try both parsers, use whichever returns more courses
  const tCount = parseTranscript(text).length;
  const pCount = parseProgress(text).courses.filter(c => c.code !== null).length;
  return pCount > tCount ? 'progress' : 'transcript';
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
    const inst = p ? p.textContent.replace(/\u00a0/g, ' ').trim() : '';
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

function normalizeCourseCode(code) {
  return (code || '').toUpperCase().replace(/\s+/g, ' ').trim();
}

function mergeLabHoursForAnalysis(transcript) {
  const byCode = new Map();
  const labs = [];
  const nonCourseEntries = [];

  for (const c of transcript) {
    if (!c.code) {
      nonCourseEntries.push(c);
      continue;
    }
    const labMatch = c.code.match(/^([A-Z]{2,5}\s+\d{3})L$/);
    if (labMatch) labs.push({ parentCode: labMatch[1], ...c });
    else if (!byCode.has(c.code)) byCode.set(c.code, { ...c, labCodes: [] });
  }

  for (const lab of labs) {
    if (byCode.has(lab.parentCode)) {
      const parent = byCode.get(lab.parentCode);
      parent.hours += lab.hours;
      parent.labCodes.push(lab.code);
    } else if (!byCode.has(lab.code)) byCode.set(lab.code, { ...lab, labCodes: [] });
  }

  return [...Array.from(byCode.values()), ...nonCourseEntries];
}

// options.extraCourses: { [category name]: { [course code]: sub-discipline or null } }
// Additional course→requirement mappings (e.g. KNOWN_COURSE_CATEGORIES, the union
// of all known catalogs). Additive only: a taken course listed here counts toward
// the named requirement even if the page's own list omits it.
export function analyze(cats, transcript, options = {}) {
  const mergedTranscript = mergeLabHoursForAnalysis(transcript);
  const completedOrTransfer = mergedTranscript.filter(c => c.status !== 'in-progress' && c.status !== 'exemption');
  const inProgressCourses = mergedTranscript.filter(c => c.status === 'in-progress');
  const exemptionEntries = mergedTranscript.filter(c => c.status === 'exemption');
  const exemptedCategories = new Set(exemptionEntries.map(e => e.exemptionTarget).filter(Boolean));

  const takenSet = new Set(completedOrTransfer.map(c => c.code).filter(Boolean));
  const inProgressSet = new Set(inProgressCourses.map(c => c.code).filter(Boolean));
  // Combined set: courses that contribute hours (completed + transfer + in-progress)
  const allActiveSet = new Set([...takenSet, ...inProgressSet]);
  const takenMap = {};
  for (const c of mergedTranscript) { if (c.code) takenMap[c.code] = c; }
  // A merged lab still satisfies requirements that list the lab code itself
  // (e.g. ENGR 303L in the 2025-26 Environmental Sustainability tag).
  for (const c of mergedTranscript) {
    for (const lab of c.labCodes || []) {
      takenMap[lab] = c;
      (inProgressSet.has(c.code) ? inProgressSet : takenSet).add(lab);
      allActiveSet.add(lab);
    }
  }
  const extraCourses = options.extraCourses || {};
  const plannedSet = new Set(
    (options.plannedCourses || [])
      .map(code => normalizeCourseCode(code))
      .filter(code => code.length > 0 && !allActiveSet.has(code))
  );
  const c2c = {};
  for (const cat of cats) {
    if (!cat.courses || !cat.name) continue;
    for (const c of cat.courses) { if (!c2c[c.code]) c2c[c.code] = []; c2c[c.code].push(cat.name); }
  }
  const pageCatNames = new Set(cats.map(c => c.name).filter(Boolean));
  for (const [name, codes] of Object.entries(extraCourses)) {
    if (!pageCatNames.has(name)) continue;
    for (const code of Object.keys(codes)) {
      if (!c2c[code]) c2c[code] = [];
      if (!c2c[code].includes(name)) c2c[code].push(name);
    }
  }
  const kuH = {}; let kuTotal = 0, kuCount = 0;
  const results = [];

  for (const cat of cats) {
    if (cat.type === 'section-header') { results.push({ ...cat, status: 'header' }); continue; }
    if (!cat.courses || cat.courses.length === 0) {
      // Check if this category is exempted even without courses
      if (exemptedCategories.has(cat.name)) {
        results.push({ ...cat, status: 'complete', hoursEarned: 0, hoursEffective: 0,
          hoursByDiscipline: {}, maxedDisciplines: new Set(), subDisciplines: null,
          takenCount: 0, inProgressCount: 0, plannedCount: 0, courseAnnotations: [], isExempt: true });
        continue;
      }
      results.push({ ...cat, status: 'info-only' }); continue;
    }
    // Check exemption first
    if (exemptedCategories.has(cat.name)) {
      const courseAnnotations = cat.courses.map(c => ({
        ...c, isTaken: allActiveSet.has(c.code), isInProgress: inProgressSet.has(c.code),
        isPlanned: false, isMultiSection: false, otherCategories: [],
        isMaxedDiscipline: false, grade: '', hours: 0
      }));
      results.push({ ...cat, status: 'complete', hoursEarned: 0, hoursEffective: 0,
        hoursByDiscipline: {}, maxedDisciplines: new Set(), subDisciplines: null,
        takenCount: 0, inProgressCount: 0, plannedCount: 0, courseAnnotations, isExempt: true });
      continue;
    }
    // Taken courses this page doesn't list here but another known catalog does.
    // They have no element on the page; render lists them in a note.
    const pageCodes = new Set(cat.courses.map(c => c.code));
    const extraHere = Object.entries(extraCourses[cat.name] || {})
      .filter(([code]) => !pageCodes.has(code) && allActiveSet.has(code))
      .map(([code, subDiscipline]) => ({ code, title: takenMap[code]?.title || '', subDiscipline, element: null, isFromOtherCatalog: true }));
    const takenHere = [...cat.courses, ...extraHere].filter(c => allActiveSet.has(c.code));
    let hrsRaw = 0; const hByD = {};
    const counted = new Set();  // a lecture and its merged lab share one transcript entry
    for (const c of takenHere) {
      const tc = takenMap[c.code];
      if (!tc || counted.has(tc)) continue;
      counted.add(tc);
      hrsRaw += tc.hours; const d = c.subDiscipline || 'General'; hByD[d] = (hByD[d] || 0) + tc.hours;
    }
    const hrsEffective = (cat.maxHours !== null) ? Math.min(hrsRaw, cat.maxHours) : hrsRaw;
    const maxedD = new Set();
    if (cat.maxPerDiscipline) for (const [d, h] of Object.entries(hByD)) if (h >= cat.maxPerDiscipline) maxedD.add(d);
    const hasRemainingCourseOptions = cat.courses.some(c => !allActiveSet.has(c.code) && !maxedD.has(c.subDiscipline || 'General'));
    let status;
    if (cat.reqType === 'pick-one') status = takenHere.length > 0 ? 'complete' : 'incomplete';
    else {
      const minReq = cat.minHours || 0;
      if (hrsRaw < minReq) status = 'incomplete';
      else if (hrsRaw === 0 && minReq === 0) status = 'optional-available';
      else if (cat.maxPerDiscipline && cat.maxHours !== null && hrsEffective < cat.maxHours && hasRemainingCourseOptions) status = 'satisfied';
      else status = 'complete';
    }
    if (KU_NAMES.includes(cat.name)) {
      kuH[cat.name] = { raw: hrsRaw, effective: hrsEffective, max: cat.maxHours };
      kuTotal += hrsEffective; if (hrsRaw > 0) kuCount++;
    }
    // Build sub-discipline details for categories with per-discipline limits
    let subDisciplines = null;
    if (cat.maxPerDiscipline && takenHere.length > 0) {
      subDisciplines = {};
      const allSubNames = new Set(cat.courses.map(c => c.subDiscipline).filter(Boolean));
      for (const dName of allSubNames) {
        const earned = hByD[dName] || 0;
        const isMaxed = maxedD.has(dName);
        const untakenCount = cat.courses.filter(c => c.subDiscipline === dName && !allActiveSet.has(c.code)).length;
        subDisciplines[dName] = { hoursEarned: earned, cap: cat.maxPerDiscipline, isMaxed, untakenCount };
      }
    }
    const courseAnnotations = [...cat.courses, ...extraHere].map(c => {
      const isTaken = takenSet.has(c.code);
      const isInProgress = inProgressSet.has(c.code);
      const isActive = isTaken || isInProgress;
      const isPlanned = !isActive && plannedSet.has(c.code);
      const allCats = c2c[c.code] || [];
      const otherCats = allCats.filter(n => n !== cat.name);
      const tc = takenMap[c.code];
      return { ...c, isTaken, isInProgress, isMultiSection: allCats.length > 1, otherCategories: otherCats,
        isPlanned,
        isMaxedDiscipline: maxedD.has(c.subDiscipline || 'General') && !isActive,
        grade: isActive ? (tc?.grade || '') : '', hours: isActive ? (tc?.hours || 0) : 0,
        isTransfer: tc?.status === 'transfer' };
    });
    const plannedCount = courseAnnotations.filter(c => c.isPlanned).length;
    const inProgressCount = courseAnnotations.filter(c => c.isInProgress).length;
    results.push({ ...cat, status, hoursEarned: hrsRaw, hoursEffective: hrsEffective,
      hoursByDiscipline: hByD, maxedDisciplines: maxedD, subDisciplines, takenCount: takenHere.length,
      inProgressCount, plannedCount, courseAnnotations });
  }
  return {
    results,
    transcript,
    plannedCourses: Array.from(plannedSet),
    overrides: options.overrides || new Set(),
    exemptions: exemptionEntries,
    kuSummary: { totalHours: kuTotal, requiredHours: 26, categoriesUsed: kuCount, requiredCategories: 5, hoursByCategory: kuH }
  };
}
