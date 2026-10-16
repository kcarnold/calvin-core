/**
 * Grades, repeated courses, and Workday's own Status column.
 *
 * - Failed, withdrawn, incomplete, and audited courses count toward nothing;
 *   resolved incompletes ("IA") do.
 * - A repeated course's later attempt wins.
 * - Where Workday says Satisfied by something that isn't a course (a military
 *   exemption), the tool goes by Workday. Any other disagreement is a mismatch
 *   the app shows loudly, with a bug report.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { parseProgress, parseProgressRows, parseTranscript } from '../src/core.js';
import { analyze } from './recorder.js';
import { readXlsxRows } from '../src/xlsx.js';
import { KNOWN_COURSE_CATEGORIES } from '../src/catalog-courses.js';
import { renderApp, bugReport } from '../src/app-render.js';
import { loadCategories, makeCourse, getResult } from './helpers.js';

const categories = loadCategories();
const run = (courses, opts = {}) => analyze(categories, courses, { extraCourses: KNOWN_COURSE_CATEGORIES, ...opts });

describe('grades that earn no credit', () => {
  for (const grade of ['F', 'W', 'WF', 'I', 'NC', 'AU']) {
    it(`grade ${grade}: REL 121 doesn't complete Foundations of Christianity I or add hours`, () => {
      const a = run([makeCourse('REL 121', 4, { grade }), makeCourse('HIST 152', 4, { grade })]);
      assert.equal(getResult(a, 'Foundations of Christianity I').status, 'incomplete');
      assert.equal(getResult(a, 'Humanities').hoursEarned, 0);
      assert.deepEqual(a.notCounted.map(c => c.code), ['REL 121', 'HIST 152']);
    });
  }
  for (const grade of ['IA', 'IB', 'CR', 'D-']) {
    it(`grade ${grade} counts`, () => {
      const a = run([makeCourse('REL 121', 4, { grade })]);
      assert.equal(getResult(a, 'Foundations of Christianity I').status, 'complete');
      assert.equal(a.notCounted.length, 0);
    });
  }
  it('in-progress courses (no grade yet) count', () => {
    const a = run([makeCourse('REL 121', 4, { grade: null, status: 'in-progress' })]);
    assert.equal(getResult(a, 'Foundations of Christianity I').status, 'complete');
  });
});

describe('repeated courses: the later attempt wins', () => {
  it('Academic Progress: by academic period, whatever the listing order', () => {
    const { courses } = parseProgress([
      'Knowledge and Understanding - minimum 26 hours', 'In Progress',
      'HIST 152 - United States History', '2025 Fall', '4', 'B',
      'HIST 152 - United States History', '2024 Fall', '4', 'F',
    ].join('\n'));
    assert.equal(courses.length, 1);
    assert.equal(courses[0].grade, 'B');
    assert.equal(getResult(run(courses), 'Humanities').hoursEarned, 4);
  });
  it('Academic Progress: a passed course retaken and failed counts as failed', () => {
    const { courses } = parseProgress([
      'Knowledge and Understanding - minimum 26 hours', 'In Progress',
      'HIST 152 - United States History', '2024 Fall', '4', 'B',
      'HIST 152 - United States History', '2025 Spring', '4', 'F',
    ].join('\n'));
    assert.equal(courses[0].grade, 'F');
  });
  it('Academic History: the later listing', () => {
    const entry = g => `Opens in new window\nHIST 152 - United States History\n${g}\n4.000\n4\n16.000\n`;
    assert.equal(parseTranscript(entry('F') + entry('B'))[0].grade, 'B');
  });
});

describe('Workday Status: read from both progress inputs', () => {
  it('pasted Academic Progress: the line after a requirement name', () => {
    const { workdayStatus, exemptions } = parseProgress([
      'Foundational Writing Core', 'Not Satisfied',
      'Health & Movement - Fitness & Wellness Core', 'Satisfied', 'Military - 05/01/2025', '0',
    ].join('\n'));
    assert.equal(workdayStatus.get('Foundational Writing Core').status, 'Not Satisfied');
    assert.deepEqual(workdayStatus.get('Health & Movement - Fitness & Wellness Core'),
      { status: 'Satisfied', items: ['Military - 05/01/2025'] });
    assert.deepEqual(exemptions, [{ name: 'Military', date: '05/01/2025', target: null }]);
  });
  it('.xlsx export: the Status column', () => {
    const { workdayStatus } = parseProgressRows([
      ['Requirement', 'Status', 'Remaining', 'Registrations Used', 'Academic Period', 'Hours', 'Grade'],
      ['Health & Movement - Fitness & Wellness Core', 'Satisfied', '', 'Military - 05/01/2025', '', '', ''],
    ]);
    assert.deepEqual(workdayStatus.get('Health & Movement - Fitness & Wellness Core'),
      { status: 'Satisfied', items: ['Military - 05/01/2025'] });
  });
});

const ws = entries => new Map(entries.map(([req, status, items = []]) => [req, { status, items }]));

describe('Workday Status vs this tool', () => {
  it('Satisfied by a military exemption: goes by Workday and keeps the registration verbatim', () => {
    const a = run([], { workdayStatus: ws([['Health & Movement - Fitness & Wellness Core', 'Satisfied', ['Military - 05/01/2025']]]) });
    const r = getResult(a, 'Health and Movement (Personal Fitness)');
    assert.equal(r.status, 'complete');
    assert.deepEqual(r.workdaySatisfied.items, ['Military - 05/01/2025']);
    assert.deepEqual(a.workdayChecks.map(c => c.kind), ['accepted']);
  });
  it('Satisfied with nothing listed (an override): goes by Workday', () => {
    const a = run([], { workdayStatus: ws([['Foundations of Christianity I Core', 'Satisfied']]) });
    assert.equal(getResult(a, 'Foundations of Christianity I').status, 'complete');
  });
  it('Satisfied by a course this tool doesn\'t count: mismatch', () => {
    // A W the registrar counted (or a tool bug): either way, someone should look.
    const a = run([makeCourse('REL 121', 4, { grade: 'W' })],
      { workdayStatus: ws([['Foundations of Christianity I Core', 'Satisfied', ['REL 121 - Biblical Literature']]]) });
    assert.equal(getResult(a, 'Foundations of Christianity I').status, 'incomplete');
    assert.deepEqual(a.workdayChecks.map(c => [c.kind, c.ourStatus]), [['mismatch', 'incomplete']]);
  });
  it('Not Satisfied, but this tool says complete: mismatch', () => {
    const a = run([makeCourse('ENGL 101', 4)], { workdayStatus: ws([['Competencies & Skills: Foundational Writing Core', 'Not Satisfied']]) });
    assert.deepEqual(a.workdayChecks.map(c => [c.requirement, c.kind]), [['Foundational Writing', 'mismatch']]);
  });
  it('K&U Satisfied by courses, but this tool says not met: mismatch', () => {
    const a = run([makeCourse('HIST 152', 4)],
      { workdayStatus: ws([['Knowledge and Understanding - minimum 26 hours', 'Satisfied', ['HIST 152 - United States History']]]) });
    assert.deepEqual(a.workdayChecks.map(c => [c.requirement, c.kind, c.ourStatus]), [['K&U', 'mismatch', 'not met']]);
    assert.equal(a.kuSummary.met, false);
  });
  it('agreement and "In Progress" produce no checks', () => {
    const a = run([makeCourse('ENGL 101', 4), makeCourse('REL 121', 4, { status: 'in-progress' })], { workdayStatus: ws([
      ['Competencies & Skills: Foundational Writing Core', 'Satisfied', ['ENGL 101 - Written Rhetoric']],
      ['Foundations of Christianity I Core', 'In Progress', ['REL 121 - Biblical Literature (In Progress)']],
      ['Knowledge and Understanding - minimum 26 hours', 'In Progress'],
    ]) });
    assert.deepEqual(a.workdayChecks, []);
  });
  it('the scrubbed sample export agrees with Workday on every core requirement, in both catalogs', () => {
    const { DOMParser } = new JSDOM('').window;
    const rows = readXlsxRows(fs.readFileSync(new URL('./fixtures/academic-progress-sample.xlsx', import.meta.url)), { DOMParser });
    const { courses, overrides, workdayStatus } = parseProgressRows(rows);
    for (const catoid of ['24', '25']) {
      const a = analyze(loadCategories(catoid), courses, { overrides, workdayStatus, extraCourses: KNOWN_COURSE_CATEGORIES });
      assert.deepEqual(a.workdayChecks, [], `catalog ${catoid}`);
    }
  });
});

describe('the app shows Workday checks', () => {
  const catalog = JSON.parse(fs.readFileSync(new URL('../catalog/catalog-categories-25.json', import.meta.url), 'utf-8'));
  const render = analysis => {
    const doc = new JSDOM('<main></main>').window.document;
    renderApp(doc.querySelector('main'), { catalog, analysis, source: 'Academic Progress export' });
    return doc;
  };
  it('a mismatch: a loud box with a copyable bug report, and a note on the card', () => {
    const a = run([makeCourse('ENGL 101', 4)], { workdayStatus: ws([['Competencies & Skills: Foundational Writing Core', 'Not Satisfied']]) });
    const doc = render(a);
    const box = doc.querySelector('#workday-mismatches');
    assert.ok(box, 'mismatch box shown');
    assert.equal(doc.querySelector('main').firstElementChild, box, 'shown first');
    const report = box.querySelector('textarea').value;
    for (const s of ['Requirement: Foundational Writing', 'Workday status: Not Satisfied', 'Core Planner status: Complete',
      'Catalog: 2026–27', 'Input: Academic Progress export', '  ENGL 101 (4 hrs)']) {
      assert.ok(report.includes(s), `report includes "${s}"\n${report}`);
    }
    assert.equal(report, bugReport(a, a.workdayChecks[0], { catalog: catalog._meta, source: 'Academic Progress export' }));
    assert.ok(doc.querySelector('.req-note.is-mismatch'), 'card note');
  });
  it('accepted: "Satisfied in Workday" with the registration verbatim', () => {
    const a = run([], { workdayStatus: ws([['Health & Movement - Fitness & Wellness Core', 'Satisfied', ['Military - 05/01/2025']]]) });
    const doc = render(a);
    assert.equal(doc.querySelector('#workday-mismatches'), null);
    const note = doc.querySelector('.req-note.is-workday');
    assert.match(note.textContent, /Satisfied with: Military - 05\/01\/2025/);
    assert.match(note.closest('.req').querySelector('.status-pill').textContent, /Satisfied in Workday/);
  });
  it('a failing grade is listed as not counted', () => {
    const doc = render(run([makeCourse('REL 121', 4, { grade: 'W' })]));
    assert.match(doc.querySelector('.callout-warn').textContent, /REL 121.*grade W/);
    assert.match(doc.querySelector('.transcript').textContent, /not counted \(grade W\)/);
  });
});
