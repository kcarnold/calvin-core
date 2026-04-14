import { parseTranscript, parseProgress, detectInputFormat, parseCoreProgram, analyze } from './core.js';
import { clearRenderedState, render } from './render.js';

const TARGET_PAGE = { pathname: '/content.php', catoid: '24', navoid: '780' };
const UI_IDS = {
  panel: 'ca-launcher-panel',
  details: 'ca-launcher-details',
  textarea: 'ca-transcript-input',
  pdfInput: 'ca-pdf-input',
  status: 'ca-launcher-status',
  styles: 'ca-launcher-styles',
};

const PDFJS_VERSION = '4.9.155';
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

async function extractTextFromPdf(file) {
  let pdfjsLib;
  // __USE_BUNDLED_PDFJS__ is set by esbuild define; dead branch is tree-shaken per build target
  /* global __USE_BUNDLED_PDFJS__ */
  if (__USE_BUNDLED_PDFJS__) {
    pdfjsLib = await import('pdfjs-dist/build/pdf.min.mjs');
    // Worker must be a separate file declared as web_accessible_resource in manifest.json
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('dist/pdf.worker.min.mjs');
  } else {
    pdfjsLib = await import(`${PDFJS_CDN}/pdf.min.mjs`);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.mjs`;
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lines = [];
    let lastY = null;
    for (const item of content.items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) lines.push('\n');
      lines.push(item.str);
      lastY = item.transform[5];
    }
    pages.push(lines.join(''));
  }
  return pages.join('\n');
}

const plannedCourses = new Set();

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
      color: #2d8a4e;
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

function runAnnotation(text) {
  const normalized = (text || '').trim();
  if (normalized.length === 0) {
    setStatus('Paste your Workday Academic History or Academic Progress to see your core opportunities.', null);
    return;
  }

  const format = detectInputFormat(normalized);
  let courses, overrides;
  if (format === 'progress') {
    const result = parseProgress(normalized);
    courses = result.courses;
    overrides = result.overrides;
  } else {
    courses = parseTranscript(normalized);
  }

  if (courses.length === 0) {
    clearRenderedState();
    setStatus('Could not parse any courses. Copy from Workday Academic Record (Academic History or Academic Progress) and paste the full content here.', 'error');
    return;
  }

  const categories = parseCoreProgram();
  const analysis = analyze(categories, courses, { plannedCourses: Array.from(plannedCourses), overrides });
  const appliedPlanned = new Set(analysis.plannedCourses || []);
  plannedCourses.clear();
  for (const code of appliedPlanned) plannedCourses.add(code);
  render(analysis, {
    onTogglePlanned: (courseCode) => {
      if (plannedCourses.has(courseCode)) plannedCourses.delete(courseCode);
      else plannedCourses.add(courseCode);
      runAnnotation(text);
    }
  });
  const inProgressCount = courses.filter(c => c.status === 'in-progress').length;
  const statusParts = [
    'Progress updated: ' + courses.filter(c => c.code).length + ' courses',
    analysis.kuSummary.totalHours + '/' + analysis.kuSummary.requiredHours + ' K&U hours',
    analysis.kuSummary.categoriesUsed + '/' + analysis.kuSummary.requiredCategories + ' K&U categories',
  ];
  if (inProgressCount > 0) statusParts.push(inProgressCount + ' in-progress');
  if (plannedCourses.size > 0) statusParts.push(plannedCourses.size + ' planned');
  setStatus(statusParts.join(', ') + '.', 'success');
  console.log('[Core Annotator]', courses.length, 'courses (' + format + '):', courses.filter(c => c.code).map(c => c.code + '(' + c.hours + 'h)'));
  console.log('[Core Annotator] K&U:', analysis.kuSummary);
  if (inProgressCount > 0) console.log('[Core Annotator] In-progress:', courses.filter(c => c.status === 'in-progress').map(c => c.code));
  if (plannedCourses.size > 0) console.log('[Core Annotator] Planned:', Array.from(plannedCourses));
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
      <p>Open Workday, go to Academic Record, open Academic History (or Academic Progress), select all, copy, then paste here — or load a PDF transcript below.</p>
      <textarea id="${UI_IDS.textarea}" spellcheck="false" placeholder="Paste Workday Academic History or Academic Progress here"></textarea>
      <input type="file" id="${UI_IDS.pdfInput}" accept=".pdf" style="display:none">
      <div class="ca-launcher-actions">
        <button type="button" class="ca-launcher-button" data-action="analyze">Show core opportunities</button>
        <button type="button" class="ca-launcher-button ca-launcher-button-secondary" data-action="load-pdf">Load from PDF…</button>
        <button type="button" class="ca-launcher-button ca-launcher-button-secondary" data-action="reset">Reset annotations</button>
        <span id="${UI_IDS.status}">Paste your Workday Academic History or Academic Progress to see your core opportunities.</span>
      </div>
    </details>`;
  firstCore.parentElement.insertBefore(panel, firstCore);

  const details = panel.querySelector('details');
  const textarea = panel.querySelector('textarea');
  const pdfInput = panel.querySelector(`#${UI_IDS.pdfInput}`);
  pdfInput.addEventListener('change', async () => {
    const file = pdfInput.files[0];
    if (!file) return;
    pdfInput.value = '';
    setStatus('Extracting text from PDF…', null);
    try {
      const text = await extractTextFromPdf(file);
      textarea.value = text;
      runAnnotation(text);
      details.open = false;
    } catch (err) {
      setStatus(`PDF extraction failed: ${err.message}`, 'error');
    }
  });

  panel.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'analyze') runAnnotation(textarea.value);
    if (button.dataset.action === 'load-pdf') pdfInput.click();
    if (button.dataset.action === 'reset') {
      textarea.value = '';
      plannedCourses.clear();
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

export function main() {
  console.log("v0.0.3");
  if (!isSupportedCatalogPage()) return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountLauncher, { once: true });
    return;
  }
  mountLauncher();
}
