// Standalone app entry (docs/index.html). Everything runs in the browser:
// pasted Workday text and chosen .xlsx exports are parsed here and never sent
// anywhere.

import { parseTranscript, parseProgress, parseProgressRows, detectInputFormat, analyze } from './core.js';
import { readXlsxRows } from './xlsx.js';
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
  // Parsed .xlsx export: { name, format, courses, overrides } or { name, error }.
  // Replaces the pasted text while set.
  file: null,
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

async function readExport(file) {
  try {
    const rows = readXlsxRows(await file.arrayBuffer());
    const { courses, overrides } = parseProgressRows(rows);
    return { name: file.name, format: 'progress-xlsx', courses, overrides };
  } catch (err) {
    return { name: file.name, error: err.message };
  }
}

const SOURCE_LABELS = {
  progress: 'Academic Progress',
  transcript: 'Academic History',
  'progress-xlsx': 'Academic Progress export',
};

function update() {
  const catalog = CATALOGS.find(c => c._meta.catoid === state.catoid);
  const meta = catalog._meta;
  document.querySelectorAll('[data-catalog-year]').forEach(el => { el.textContent = catalogLabel(meta); });
  document.querySelectorAll('[data-catalog-saved]').forEach(el => { el.textContent = meta.savedAt; });
  document.querySelectorAll('a[data-catalog-link]').forEach(el => { el.href = meta.sourceUrl; });

  let analysis = null;
  const text = state.text.trim();
  const input = state.file ?? (text ? parseInput(text) : null);
  if (input?.error) {
    setStatus(`Couldn’t read ${input.name}: ${input.error}. Choose the .xlsx file Workday exports from Academic Progress.`, 'error');
  } else if (input) {
    const { format, courses, overrides } = input;
    if (courses.length === 0) {
      setStatus(state.file
        ? `No courses found in ${state.file.name}. Choose the .xlsx file Workday exports from Academic Progress.`
        : 'No courses found. Copy the whole Academic History or Academic Progress page from Workday and paste again.', 'error');
    } else {
      analysis = analyze(catalog.categories, courses, {
        plannedCourses: Array.from(state.plannedCourses), overrides, extraCourses: KNOWN_COURSE_CATEGORIES,
      });
      state.plannedCourses = new Set(analysis.plannedCourses);
      const n = courses.filter(c => c.code).length;
      setStatus(`Read ${n} course${n === 1 ? '' : 's'} from ${SOURCE_LABELS[format]}`
        + (state.file ? ` (${state.file.name}).` : '.')
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
  const fileInput = $('workday-file');
  input.addEventListener('input', () => {
    state.text = input.value;
    state.file = null;
    fileInput.value = '';
    update();
  });

  async function loadFile(file) {
    if (!file) return;
    input.value = '';
    state.text = '';
    state.plannedCourses.clear();
    setStatus(`Reading ${file.name}…`, null);
    state.file = await readExport(file);
    update();
  }
  fileInput.addEventListener('change', () => loadFile(fileInput.files[0]));
  // Dropping a file anywhere on the input card reads it instead of opening it.
  const card = $('input-card');
  card.addEventListener('dragover', e => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    card.classList.add('dragging');
  });
  card.addEventListener('dragleave', e => {
    if (!card.contains(e.relatedTarget)) card.classList.remove('dragging');
  });
  card.addEventListener('drop', e => {
    if (!e.dataTransfer.files.length) return;
    e.preventDefault();
    card.classList.remove('dragging');
    loadFile(e.dataTransfer.files[0]);
  });

  $('clear-button').addEventListener('click', () => {
    input.value = '';
    state.text = '';
    state.file = null;
    fileInput.value = '';
    state.plannedCourses.clear();
    state.openLists.clear();
    update();
    input.focus();
  });
  update();
}

init();
