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
import { parseTranscript, parseProgress, detectInputFormat, parseCoreProgram, analyze, KU_NAMES } from '../src/core.js';

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
    const entry = {
      status: r.status,
      hoursEarned: r.hoursEarned ?? null,
      hoursEffective: r.hoursEffective ?? null,
      takenCount: r.takenCount ?? 0,
    };
    if (r.subDisciplines) entry.subDisciplines = r.subDisciplines;
    categories[r.name] = entry;
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
  let transcriptFiles = files.filter(f => basename(f).startsWith('transcript-'));
  let progressFiles = files.filter(f => basename(f).startsWith('progress-'));
  if (files.length === 0) {
    if (!existsSync(FIXTURES)) {
      console.error(`No fixtures directory. Create test/fixtures/ and add transcript-*.txt files.`);
      process.exit(1);
    }
    const allFiles = readdirSync(FIXTURES);
    transcriptFiles = allFiles
      .filter(f => f.startsWith('transcript-') && f.endsWith('.txt'))
      .map(f => join(FIXTURES, f));
    progressFiles = allFiles
      .filter(f => f.startsWith('progress-') && f.endsWith('.txt'))
      .map(f => join(FIXTURES, f));
  }

  if (transcriptFiles.length === 0 && progressFiles.length === 0) {
    console.error('No test files found. Add .txt files to test/fixtures/ or pass paths as arguments.');
    process.exit(1);
  }

  let passed = 0, failed = 0, unsnapshotted = 0;

  // ---- Transcript tests (existing) ----
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
      console.log(`? ${name} — no expected file, printing actual output:`);
      console.log(JSON.stringify(actual, null, 2));
      console.error(`  To snapshot: node test/run-test.js ${file} > ${expectedPath}`);
      unsnapshotted++;
    }
  }

  // ---- Progress format tests ----
  for (const file of progressFiles) {
    const name = basename(file, '.txt');
    const text = readFileSync(file, 'utf-8');

    // Test 1: detectInputFormat identifies this as progress
    const fmt = detectInputFormat(text);
    if (fmt !== 'progress') {
      console.log(`✗ ${name} detectInputFormat: expected 'progress', got '${fmt}'`);
      failed++;
    } else {
      console.log(`✓ ${name} detectInputFormat → 'progress'`);
      passed++;
    }

    // Test 2: parseProgress extracts courses
    const { courses, exemptions, overrides } = parseProgress(text);
    const realCourses = courses.filter(c => c.code !== null);
    const exemptionEntries = courses.filter(c => c.status === 'exemption');
    const inProgressCourses = realCourses.filter(c => c.status === 'in-progress');
    const transferCourses = realCourses.filter(c => c.status === 'transfer');
    const completedCourses = realCourses.filter(c => c.status === 'completed');

    console.log(`  parseProgress: ${realCourses.length} courses, ${inProgressCourses.length} in-progress, ${transferCourses.length} transfer, ${completedCourses.length} completed`);
    console.log(`  exemptions: ${exemptions.length}, overrides: ${overrides.size}`);

    // Test 3: Specific assertions for the example fixture
    const coursesByCode = {};
    for (const c of courses) { if (c.code) coursesByCode[c.code] = c; }

    const assertions = [
      // In-progress courses detected
      [coursesByCode['REL 212']?.status, 'in-progress', 'REL 212 should be in-progress'],
      [coursesByCode['ECON 221']?.status, 'in-progress', 'ECON 221 should be in-progress'],
      [coursesByCode['CS 384']?.status, 'in-progress', 'CS 384 should be in-progress'],
      // Transfer credit detected
      [coursesByCode['PHYS 222']?.status, 'transfer', 'PHYS 222 should be transfer'],
      [coursesByCode['PHYS 222']?.hours, 4, 'PHYS 222 should have 4 hours'],
      [coursesByCode['PHYS 222']?.grade, 'CR', 'PHYS 222 grade should be CR'],
      // Regular completed course
      [coursesByCode['CORE 100']?.status, 'completed', 'CORE 100 should be completed'],
      [coursesByCode['CORE 100']?.hours, 2, 'CORE 100 should have 2 hours'],
      // Lab merging: CS 108L (1h) should merge into CS 108 (3h) = 4h total
      [coursesByCode['CS 108']?.hours, 4, 'CS 108 should have 4 hours (3 + 1 lab)'],
      [coursesByCode['CS 108L'], undefined, 'CS 108L should not exist (merged into CS 108)'],
      // Lab merging: CS 112L (1h) should merge into CS 112 (3h) = 4h total
      [coursesByCode['CS 112']?.hours, 4, 'CS 112 should have 4 hours (3 + 1 lab)'],
      // Exemption detected
      [exemptions.length >= 1, true, 'Should have at least 1 exemption'],
      [exemptions[0]?.target, 'World Languages I', 'Language Exemption should target World Languages I'],
      // Override detected
      [overrides.has('Knowledge and Understanding - minimum 26 hours'), true, 'Should detect K&U override'],
      // Deduplication: courses appearing in multiple sections should be deduplicated
      [realCourses.filter(c => c.code === 'CS 108').length, 1, 'CS 108 should appear only once (deduplicated)'],
    ];

    for (const [actual, expected, label] of assertions) {
      if (actual === expected) {
        console.log(`  ✓ ${label}`);
        passed++;
      } else {
        console.log(`  ✗ ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        failed++;
      }
    }

    // Test 4: Feed into analyze() and check exemption handling
    const analysis = analyze(categories, courses);
    const wl1 = analysis.results.find(r => r.name === 'World Languages I');
    if (wl1) {
      if (wl1.status === 'complete' && wl1.isExempt) {
        console.log(`  ✓ World Languages I marked complete via exemption`);
        passed++;
      } else {
        console.log(`  ✗ World Languages I: expected complete+exempt, got status='${wl1.status}', isExempt=${wl1.isExempt}`);
        failed++;
      }
    } else {
      console.log(`  ✗ World Languages I category not found in analysis results`);
      failed++;
    }

    // Test 5: In-progress courses contribute hours
    const kuResult = analysis.results.find(r => r.name && r.courseAnnotations?.some(c => c.code === 'CS 384'));
    if (kuResult) {
      const cs384ann = kuResult.courseAnnotations.find(c => c.code === 'CS 384');
      if (cs384ann?.isInProgress) {
        console.log(`  ✓ CS 384 annotated as in-progress in analysis`);
        passed++;
      } else {
        console.log(`  ✗ CS 384 should be annotated as in-progress`);
        failed++;
      }
    }
  }

  console.log(`\n${passed} passed, ${failed} failed, ${unsnapshotted} unsnapshotted`);
  if (failed > 0) process.exit(1);
}

main();
