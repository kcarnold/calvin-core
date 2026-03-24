import { parseTranscript, parseCoreProgram, analyze } from './core.js';
import { clearRenderedState, render } from './render.js';

const TARGET_PAGE = { pathname: '/content.php', catoid: '24', navoid: '780' };
const UI_IDS = {
  panel: 'ca-launcher-panel',
  details: 'ca-launcher-details',
  textarea: 'ca-transcript-input',
  status: 'ca-launcher-status',
  styles: 'ca-launcher-styles',
};

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

export function main() {
  console.log("v0.0.3");
  if (!isSupportedCatalogPage()) return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountLauncher, { once: true });
    return;
  }
  mountLauncher();
}
