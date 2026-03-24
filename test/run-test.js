/**
 * Test harness for Calvin Core Annotator.
 *
 * Usage:
 *   node test/run-test.js [test/fixtures/transcript-*.txt ...]
 *
 * If no arguments, runs all transcript-*.txt files found in test/fixtures/.
 *
 * Each transcript file can have a companion .expected.json with the expected
 * topline outputs. If present, the test asserts they match; if absent, the
 * actual output is printed so you can review and snapshot it:
 *
 *   node test/run-test.js test/fixtures/transcript-alice.txt > test/fixtures/transcript-alice.expected.json
 *
 * The catalog HTML is fetched once from the live site and cached at
 * test/fixtures/catalog.html.  Pass --refresh-catalog to re-fetch.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { parseTranscript, parseCoreProgram, analyze, KU_NAMES } from '../src/core.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES = join(__dirname, 'fixtures');
const CATALOG_PATH = join(FIXTURES, 'catalog.html');
const CATALOG_URL = 'https://catalog.calvin.edu/content.php?catoid=24&navoid=780';

// ---- Catalog HTML ----

async function ensureCatalog(refresh) {
  if (!refresh && existsSync(CATALOG_PATH)) return;
  console.error(`Fetching catalog from ${CATALOG_URL} ...`);
  const res = await fetch(CATALOG_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching catalog`);
  const html = await res.text();
  writeFileSync(CATALOG_PATH, html, 'utf-8');
  console.error(`Saved ${CATALOG_PATH} (${(html.length / 1024).toFixed(0)} KB)`);
}

function loadCatalogDOM() {
  const html = readFileSync(CATALOG_PATH, 'utf-8');
  const dom = new JSDOM(html);
  return dom.window.document;
}

// ---- Summarize analysis for comparison ----

function summarize(analysis) {
  const { kuSummary, results } = analysis;
  const categories = {};
  for (const r of results) {
    if (r.status === 'header' || r.status === 'info-only') continue;
    categories[r.name] = {
      status: r.status,
      hoursEarned: r.hoursEarned ?? null,
      hoursEffective: r.hoursEffective ?? null,
      takenCount: r.takenCount ?? 0,
    };
  }
  return {
    kuSummary: {
      totalHours: kuSummary.totalHours,
      categoriesUsed: kuSummary.categoriesUsed,
      hoursByCategory: kuSummary.hoursByCategory,
    },
    categories,
  };
}

// ---- Test runner ----

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function diffSummaries(expected, actual) {
  const diffs = [];
  // K&U top-level
  for (const key of ['totalHours', 'categoriesUsed']) {
    if (expected.kuSummary[key] !== actual.kuSummary[key]) {
      diffs.push(`kuSummary.${key}: expected ${expected.kuSummary[key]}, got ${actual.kuSummary[key]}`);
    }
  }
  // Per-category
  const allCats = new Set([...Object.keys(expected.categories), ...Object.keys(actual.categories)]);
  for (const cat of allCats) {
    const e = expected.categories[cat];
    const a = actual.categories[cat];
    if (!e) { diffs.push(`category "${cat}": unexpected (not in expected)`); continue; }
    if (!a) { diffs.push(`category "${cat}": missing (expected ${e.status})`); continue; }
    for (const key of ['status', 'hoursEarned', 'takenCount']) {
      if (e[key] !== a[key]) {
        diffs.push(`category "${cat}".${key}: expected ${e[key]}, got ${a[key]}`);
      }
    }
  }
  return diffs;
}

async function main() {
  const args = process.argv.slice(2);
  const refresh = args.includes('--refresh-catalog');
  const files = args.filter(a => !a.startsWith('--'));

  await ensureCatalog(refresh);
  const doc = loadCatalogDOM();
  const categories = parseCoreProgram(doc);

  // Discover test transcripts
  let transcriptFiles = files;
  if (transcriptFiles.length === 0) {
    if (!existsSync(FIXTURES)) {
      console.error(`No fixtures directory. Create test/fixtures/ and add transcript-*.txt files.`);
      process.exit(1);
    }
    transcriptFiles = readdirSync(FIXTURES)
      .filter(f => f.startsWith('transcript-') && f.endsWith('.txt'))
      .map(f => join(FIXTURES, f));
  }

  if (transcriptFiles.length === 0) {
    console.error('No transcript files found. Add .txt files to test/fixtures/ or pass paths as arguments.');
    console.error('Example: echo "your transcript" > test/fixtures/transcript-sample.txt');
    process.exit(1);
  }

  let passed = 0, failed = 0;

  for (const file of transcriptFiles) {
    const name = basename(file, '.txt');
    const text = readFileSync(file, 'utf-8');
    const transcript = parseTranscript(text);
    const analysis = analyze(categories, transcript);
    const actual = summarize(analysis);

    const expectedPath = file.replace(/\.txt$/, '.expected.json');

    if (existsSync(expectedPath)) {
      const expected = JSON.parse(readFileSync(expectedPath, 'utf-8'));
      if (deepEqual(expected, actual)) {
        console.log(`✓ ${name} (${transcript.length} courses, ${analysis.kuSummary.totalHours}/${analysis.kuSummary.requiredHours} K&U hrs)`);
        passed++;
      } else {
        const diffs = diffSummaries(expected, actual);
        console.log(`✗ ${name}`);
        for (const d of diffs) console.log(`    ${d}`);
        failed++;
      }
    } else {
      // No expected file — print summary for review / snapshot creation
      console.log(`? ${name} — no expected file, printing actual output:`);
      console.log(JSON.stringify(actual, null, 2));
      console.error(`  To snapshot: node test/run-test.js ${file} > ${expectedPath}`);
    }
  }

  console.log(`\n${passed} passed, ${failed} failed, ${transcriptFiles.length - passed - failed} unsnapshotted`);
  if (failed > 0) process.exit(1);
}

main();
