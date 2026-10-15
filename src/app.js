// Standalone app entry (docs/index.html). Everything runs in the browser:
// pasted Workday text is parsed here and never sent anywhere.

import { parseTranscript, parseProgress, detectInputFormat, analyze } from './core.js';
import { KNOWN_COURSE_CATEGORIES } from './catalog-courses.js';
import { renderApp, catalogLabel } from './app-render.js';
import catalog25 from '../catalog/catalog-categories-25.json';
import catalog24 from '../catalog/catalog-categories-24.json';

// Newest first.
const CATALOGS = [catalog25, catalog24];
const YEAR_KEY = 'calvin-core:catalog';

const state = {
  catoid: CATALOGS[0]._meta.catoid,
  text: '',
  plannedCourses: new Set(),
  openLists: new Map(),
};

const $ = id => document.getElementById(id);

function loadYear() {
  try {
    const saved = localStorage.getItem(YEAR_KEY);
    if (CATALOGS.some(c => c._meta.catoid === saved)) state.catoid = saved;
  } catch { /* storage unavailable: use the newest catalog */ }
}

function saveYear() {
  try { localStorage.setItem(YEAR_KEY, state.catoid); } catch { /* ignore */ }
}

function setStatus(message, kind) {
  const el = $('status');
  el.textContent = message;
  el.className = 'status' + (kind ? ' status-' + kind : '');
}

function parseInput(text) {
  const format = detectInputFormat(text);
  if (format === 'progress') {
    const { courses, overrides } = parseProgress(text);
    return { format, courses, overrides };
  }
  return { format, courses: parseTranscript(text), overrides: undefined };
}

function update() {
  const catalog = CATALOGS.find(c => c._meta.catoid === state.catoid);
  const meta = catalog._meta;
  document.querySelectorAll('[data-catalog-year]').forEach(el => { el.textContent = catalogLabel(meta); });
  document.querySelectorAll('[data-catalog-saved]').forEach(el => { el.textContent = meta.savedAt; });
  document.querySelectorAll('a[data-catalog-link]').forEach(el => { el.href = meta.sourceUrl; });

  let analysis = null;
  const text = state.text.trim();
  if (text) {
    const { format, courses, overrides } = parseInput(text);
    if (courses.length === 0) {
      setStatus('No courses found. Copy the whole Academic History or Academic Progress page from Workday and paste again.', 'error');
    } else {
      analysis = analyze(catalog.categories, courses, {
        plannedCourses: Array.from(state.plannedCourses), overrides, extraCourses: KNOWN_COURSE_CATEGORIES,
      });
      state.plannedCourses = new Set(analysis.plannedCourses);
      const n = courses.filter(c => c.code).length;
      const source = format === 'progress' ? 'Academic Progress' : 'Academic History';
      setStatus(`Read ${n} course${n === 1 ? '' : 's'} from ${source}.`
        + (analysis.kuWarnings.length ? ` ${analysis.kuWarnings.length} need checking (see below).` : ''), 'ok');
    }
  } else {
    setStatus('', null);
  }

  renderApp($('results'), {
    catalog, catalogs: CATALOGS, analysis, openLists: state.openLists,
    onTogglePlanned: code => {
      if (state.plannedCourses.has(code)) state.plannedCourses.delete(code);
      else state.plannedCourses.add(code);
      update();
    },
    onListToggle: (slug, open) => state.openLists.set(slug, open),
  });
}

function init() {
  loadYear();
  const select = $('catalog-select');
  select.replaceChildren(...CATALOGS.map(c => {
    const opt = document.createElement('option');
    opt.value = c._meta.catoid;
    opt.textContent = catalogLabel(c._meta) + ' catalog';
    return opt;
  }));
  select.value = state.catoid;
  select.addEventListener('change', () => {
    state.catoid = select.value;
    state.openLists.clear();
    saveYear();
    update();
  });

  const input = $('workday-input');
  input.addEventListener('input', () => {
    state.text = input.value;
    update();
  });
  $('clear-button').addEventListener('click', () => {
    input.value = '';
    state.text = '';
    state.plannedCourses.clear();
    state.openLists.clear();
    update();
    input.focus();
  });
  update();
}

init();
