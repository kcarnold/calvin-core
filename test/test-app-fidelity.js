/**
 * Fidelity: the standalone app shows what the official catalog shows.
 *
 * Renders the app in jsdom from the bundled catalog data, then compares it to
 * the saved catalog HTML read directly (not through parseCoreProgram, so a
 * parser bug can't hide here): every requirement in order, heading text,
 * instruction wording, and each list's headings, connectors, course codes,
 * titles, and course links. Also checks that anything the app adds beyond the
 * catalog's lists is labeled, and that the page keeps its official-record
 * notice and no-network policy.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { analyze } from '../src/core.js';
import { KNOWN_COURSE_CATEGORIES } from '../src/catalog-courses.js';
import { renderApp, courseUrl } from '../src/app-render.js';
import { makeCourse } from './helpers.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CATALOG_DIR = join(ROOT, 'catalog');
const CATOIDS = readdirSync(CATALOG_DIR).map(f => f.match(/^catalog-(\d+)\.html$/)?.[1]).filter(Boolean);
const CATALOGS = CATOIDS.map(id => JSON.parse(readFileSync(join(CATALOG_DIR, `catalog-categories-${id}.json`), 'utf-8')));

const norm = s => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const squash = s => (s || '').replace(/\s+/g, '');

// The official page, read straight from the DOM.
function officialBlocks(catoid) {
  const doc = new JSDOM(readFileSync(join(CATALOG_DIR, `catalog-${catoid}.html`), 'utf-8')).window.document;
  return Array.from(doc.querySelectorAll('div.acalog-core')).map(b => {
    const heading = b.querySelector('h2, h3, h4');
    const items = Array.from(b.querySelector('ul')?.children || []).map(li => {
      if (li.classList.contains('acalog-adhoc')) return { text: norm(li.textContent) };
      const a = li.querySelector('a');
      return { text: norm(a.textContent), coid: a.getAttribute('onclick').match(/showCourse\('\d+',\s*'(\d+)'/)[1] };
    });
    return {
      isSection: heading.tagName === 'H2',
      heading: norm(heading.textContent),
      instructions: norm(Array.from(b.children).filter(el => el.tagName === 'P').map(p => p.textContent).join(' ')),
      items,
    };
  });
}

function render(catalog, transcript) {
  const doc = new JSDOM('<!doctype html><main id="results"></main>').window.document;
  const root = doc.getElementById('results');
  const analysis = transcript && analyze(catalog.categories, transcript, { extraCourses: KNOWN_COURSE_CATEGORIES });
  renderApp(root, { catalog, catalogs: CATALOGS, analysis, onTogglePlanned: () => {} });
  return root;
}

// Exercises taken, in-progress, transfer (accepted and excluded), the
// alternatives list, an other-catalog course, and placeholder credit.
const SAMPLE_TRANSCRIPT = [
  makeCourse('CORE 100', 2, { status: 'transfer' }),
  makeCourse('ENGL 100', 4),
  makeCourse('HIST 152', 4),
  makeCourse('MATH 171', 4),
  makeCourse('ENST 210', 4),
  makeCourse('COMM 200', 4, { status: 'in-progress' }),
  { code: 'ARTS CORE', subject: 'ARTS', isPlaceholder: true, title: 'AP Art', hours: 4, grade: 'CR', status: 'transfer' },
];

describe('app fidelity to the official catalog', () => {
  for (const catalog of CATALOGS) {
    const catoid = catalog._meta.catoid;
    const official = officialBlocks(catoid);

    for (const [label, transcript] of [['before pasting', null], ['with a transcript', SAMPLE_TRANSCRIPT]]) {
      describe(`catalog ${catoid}, ${label}`, () => {
        const root = render(catalog, transcript);
        const rendered = Array.from(root.querySelectorAll('[data-core-index]'));

        it('shows every catalog requirement once, in catalog order', () => {
          assert.deepEqual(rendered.map(el => Number(el.dataset.coreIndex)), official.map((_, i) => i));
        });

        it('headings and instruction wording match the catalog', () => {
          official.forEach((o, i) => {
            const el = rendered[i];
            const heading = el.querySelector(o.isSection ? '.req-section-title' : '.req-name');
            assert.equal(norm(heading.textContent), o.heading, `block ${i} heading`);
            const sentences = Array.from(el.querySelectorAll(':scope > .catalog-wording .sentence-text')).map(s => s.textContent);
            // The app splits run-together sentences, so compare ignoring whitespace.
            assert.equal(squash(sentences.join('')), squash(o.instructions), `${o.heading} wording`);
          });
        });

        it('course lists match the catalog item for item, with links to each course', () => {
          official.forEach((o, i) => {
            const items = Array.from(rendered[i].querySelectorAll(':scope > details > .course-list > li')).map(li => {
              if (li.dataset.kind === 'course') {
                const a = li.querySelector('.course-code');
                return { text: `${norm(a.textContent)} - ${norm(li.querySelector('.course-title').textContent)}`, href: a.href };
              }
              return { text: norm(li.querySelector('.heading-text')?.textContent ?? li.textContent) };
            });
            const expected = o.items.map(x => x.coid ? { text: x.text, href: courseUrl(catoid, x.coid) } : { text: x.text });
            assert.deepEqual(items, expected, `${o.heading} list`);
          });
        });

        it('links each requirement to its place in the official catalog', () => {
          for (const el of rendered.filter(e => e.matches('article'))) {
            const href = el.querySelector('.req-source a').href;
            assert.ok(href.startsWith(catalog._meta.sourceUrl + '#core_'), href);
          }
        });

        it('courses outside the catalog lists are labeled with where they come from', () => {
          for (const li of root.querySelectorAll('[data-kind="course"]')) {
            assert.ok(li.closest('.course-list'), `${li.dataset.code} rendered outside a catalog list`);
          }
          for (const li of root.querySelectorAll('.extra-course')) {
            assert.ok(['assumed', 'other-catalog'].includes(li.dataset.provenance), li.textContent);
            assert.match(li.textContent, /Assumed|Listed for this requirement in the/);
            assert.match(li.closest('.extra-courses').textContent, /catalog doesn.t list them/);
          }
        });
      });
    }
  }

  it('the sample transcript exercises the labeled extras', () => {
    const root = render(CATALOGS.find(c => c._meta.catoid === '25'), SAMPLE_TRANSCRIPT);
    const kinds = new Set(Array.from(root.querySelectorAll('.extra-course')).map(li => li.dataset.provenance));
    assert.deepEqual([...kinds].sort(), ['assumed', 'other-catalog']);
    assert.ok(root.querySelector('.course.is-excluded'), 'excluded transfer shown');
    assert.match(root.querySelector('.callout-warn').textContent, /CORE 100 is transfer credit/);
  });
});

describe('app page', () => {
  const html = readFileSync(join(ROOT, 'docs', 'index.html'), 'utf-8');

  it('says Workday is the official record', () => {
    assert.match(html, /Workday is the official record/);
  });

  it('forbids network requests, so pasted data cannot leave the browser', () => {
    const csp = new JSDOM(html).window.document.querySelector('meta[http-equiv="Content-Security-Policy"]').content;
    assert.match(csp, /connect-src 'none'/);
    assert.match(csp, /form-action 'none'/);
    assert.match(csp, /script-src 'self'(;|$)/);
  });
});
