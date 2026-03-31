/**
 * Parsing unit tests — parseTranscript, parseProgress, detectInputFormat, parseCoreProgram.
 * Tests the extraction layer in isolation from business logic.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseTranscript, parseProgress, detectInputFormat, parseCoreProgram } from '../src/core.js';
import { JSDOM } from 'jsdom';

// ---- parseTranscript ----

describe('parseTranscript', () => {
  it('extracts basic course fields', () => {
    const text = `Opens in new window
HIST 152 - United States History
A
4.000
4
16.000`;
    const courses = parseTranscript(text);
    assert.equal(courses.length, 1);
    assert.equal(courses[0].code, 'HIST 152');
    assert.equal(courses[0].title, 'United States History');
    assert.equal(courses[0].grade, 'A');
    assert.equal(courses[0].hours, 4);
    assert.equal(courses[0].status, 'completed');
  });

  it('extracts multiple courses', () => {
    const text = `Opens in new window
CHEM 101 - General Chemistry
A
4.000
4
16.000
Opens in new window
HIST 152 - United States History
B+
4.000
4
13.320`;
    const courses = parseTranscript(text);
    assert.equal(courses.length, 2);
    assert.equal(courses[0].code, 'CHEM 101');
    assert.equal(courses[1].code, 'HIST 152');
    assert.equal(courses[1].grade, 'B+');
  });

  it('merges lab hours into parent lecture course', () => {
    const text = `Opens in new window
CS 108 - Introduction to Computing
A
4.000
3
12.000
Opens in new window
CS 108L - Introduction to Computing Lab
A
4.000
1
4.000`;
    const courses = parseTranscript(text);
    assert.equal(courses.length, 1, 'lab should be merged');
    assert.equal(courses[0].code, 'CS 108');
    assert.equal(courses[0].hours, 4, 'CS 108 should have 3 + 1 = 4 hours');
  });

  it('keeps standalone lab if parent not present', () => {
    const text = `Opens in new window
CS 108L - Introduction to Computing Lab
A
4.000
1
4.000`;
    const courses = parseTranscript(text);
    assert.equal(courses.length, 1);
    assert.equal(courses[0].code, 'CS 108L');
    assert.equal(courses[0].hours, 1);
  });

  it('handles course codes with letter suffixes', () => {
    const text = `Opens in new window
HIST 153B - Topics in History
A
4.000
4
16.000`;
    const courses = parseTranscript(text);
    assert.equal(courses.length, 1);
    assert.equal(courses[0].code, 'HIST 153B');
  });

  it('handles CR grade', () => {
    const text = `Opens in new window
PHYS 222 - General Physics II
CR
4.000
4
0.000`;
    const courses = parseTranscript(text);
    assert.equal(courses.length, 1);
    assert.equal(courses[0].grade, 'CR');
  });

  it('returns empty array for no courses', () => {
    assert.deepEqual(parseTranscript('no course data here'), []);
    assert.deepEqual(parseTranscript(''), []);
  });

  it('handles flattened single-line input', () => {
    // Workday sometimes flattens to one line
    const text = `Opens in new window CHEM 101 - General Chemistry A 4.000 4 16.000 Opens in new window HIST 152 - United States History A 4.000 4 16.000`;
    const courses = parseTranscript(text);
    assert.equal(courses.length, 2);
  });
});

// ---- parseProgress ----

describe('parseProgress', () => {
  it('extracts basic completed course', () => {
    const text = `RequirementSort and filter column
StatusSort and filter column
Satisfied With

CORE 100 - Gateway to the Core
2024 Fall
2
A`;
    const { courses } = parseProgress(text);
    const real = courses.filter(c => c.code);
    assert.equal(real.length, 1);
    assert.equal(real[0].code, 'CORE 100');
    assert.equal(real[0].hours, 2);
    assert.equal(real[0].grade, 'A');
    assert.equal(real[0].status, 'completed');
  });

  it('detects in-progress courses', () => {
    const text = `RequirementSort and filter column
StatusSort and filter column
Satisfied With

CS 384 - Artificial Intelligence (In Progress)
2025 Spring
4`;
    const { courses } = parseProgress(text);
    const cs384 = courses.find(c => c.code === 'CS 384');
    assert.ok(cs384, 'should find CS 384');
    assert.equal(cs384.status, 'in-progress');
    assert.equal(cs384.hours, 4);
  });

  it('detects transfer credit', () => {
    const text = `RequirementSort and filter column
StatusSort and filter column
Satisfied With

PHYS 222 - General Physics II (Transfer Credit)
2024 Fall
4
CR`;
    const { courses } = parseProgress(text);
    const phys = courses.find(c => c.code === 'PHYS 222');
    assert.ok(phys, 'should find PHYS 222');
    assert.equal(phys.status, 'transfer');
    assert.equal(phys.grade, 'CR');
  });

  it('detects exemptions and maps target', () => {
    const text = `RequirementSort and filter column
StatusSort and filter column
Satisfied With

Language Exemption - 07/01/2023
0`;
    const { courses, exemptions } = parseProgress(text);
    assert.equal(exemptions.length, 1);
    assert.equal(exemptions[0].target, 'World Languages I');
    const exemptionEntry = courses.find(c => c.status === 'exemption');
    assert.ok(exemptionEntry, 'should have exemption in courses');
    assert.equal(exemptionEntry.exemptionTarget, 'World Languages I');
  });

  it('detects overrides', () => {
    const text = `RequirementSort and filter column
StatusSort and filter column
Satisfied With

Knowledge and Understanding - minimum 26 hours (Click for more details) (Override Assigned)`;
    const { overrides } = parseProgress(text);
    assert.ok(overrides.has('Knowledge and Understanding - minimum 26 hours'));
  });

  it('merges lab into parent and deduplicates', () => {
    const text = `RequirementSort and filter column
StatusSort and filter column
Satisfied With

CS 108 - Introduction to Computing
2024 Fall
3
A

CS 108L - Introduction to Computing Lab
2024 Fall
1
A

CS 108 - Introduction to Computing
2024 Fall
3
A`;
    const { courses } = parseProgress(text);
    const cs108 = courses.filter(c => c.code === 'CS 108');
    assert.equal(cs108.length, 1, 'CS 108 should appear once (deduplicated)');
    assert.equal(cs108[0].hours, 4, 'CS 108 should have 3 + 1 = 4 hours');
    assert.ok(!courses.find(c => c.code === 'CS 108L'), 'CS 108L should be merged away');
  });

  it('returns empty for no courses', () => {
    const { courses } = parseProgress('RequirementSort and filter column\nStatusSort and filter column\nSatisfied With\n');
    assert.equal(courses.filter(c => c.code).length, 0);
  });
});

// ---- detectInputFormat ----

describe('detectInputFormat', () => {
  it('detects transcript format by "Opens in new window"', () => {
    assert.equal(detectInputFormat('Opens in new window\nCHEM 101 - General Chemistry\nA\n4.000\n4\n16.000'), 'transcript');
  });

  it('detects progress format by "RequirementSort"', () => {
    assert.equal(detectInputFormat('RequirementSort and filter column\nStatusSort and filter column'), 'progress');
  });

  it('detects progress format by "Satisfied With"', () => {
    assert.equal(detectInputFormat('Satisfied With\nCORE 100 - Gateway'), 'progress');
  });

  it('falls back to heuristic for ambiguous input', () => {
    // Plain course data with no markers — should pick whichever parser finds more
    const result = detectInputFormat('CHEM 101 - General Chemistry');
    assert.ok(result === 'transcript' || result === 'progress', `should return a valid format, got ${result}`);
  });
});

// ---- parseCoreProgram ----

describe('parseCoreProgram', () => {
  function makeDOM(html) {
    return new JSDOM(`<html><body>${html}</body></html>`).window.document;
  }

  it('parses pick-one category', () => {
    const doc = makeDOM(`
      <div class="acalog-core">
        <h3>Foundational Writing</h3>
        <p>Complete one of the following:</p>
        <ul>
          <li class="acalog-course"><a>ENGL 101 - Intro to Writing</a></li>
          <li class="acalog-course"><a>RHET 101 - Rhetoric</a></li>
        </ul>
      </div>
    `);
    const cats = parseCoreProgram(doc);
    const fw = cats.find(c => c.name === 'Foundational Writing');
    assert.ok(fw, 'should find Foundational Writing');
    assert.equal(fw.reqType, 'pick-one');
    assert.equal(fw.courses.length, 2);
    assert.equal(fw.courses[0].code, 'ENGL 101');
  });

  it('parses hour-range category with en-dash', () => {
    const doc = makeDOM(`
      <div class="acalog-core">
        <h3>Humanities</h3>
        <p>2\u20136 semester hours. Take up to 4 semester hours in any one discipline.</p>
        <ul>
          <li class="acalog-adhoc acalog-adhoc-before">History</li>
          <li class="acalog-course"><a>HIST 151 - History of the West I</a></li>
          <li class="acalog-course"><a>HIST 152 - History of the West II</a></li>
          <li class="acalog-adhoc acalog-adhoc-before">Philosophy</li>
          <li class="acalog-course"><a>PHIL 153 - Intro to Philosophy</a></li>
        </ul>
      </div>
    `);
    const cats = parseCoreProgram(doc);
    const hum = cats.find(c => c.name === 'Humanities');
    assert.ok(hum, 'should find Humanities');
    assert.equal(hum.reqType, 'hour-range');
    assert.equal(hum.minHours, 2);
    assert.equal(hum.maxHours, 6);
    assert.equal(hum.maxPerDiscipline, 4);
    assert.equal(hum.courses.length, 3);
    assert.equal(hum.courses[0].subDiscipline, 'History');
    assert.equal(hum.courses[1].subDiscipline, 'History');
    assert.equal(hum.courses[2].subDiscipline, 'Philosophy');
  });

  it('parses tag categories (h4)', () => {
    const doc = makeDOM(`
      <div class="acalog-core">
        <h4>Diversity and Difference (Tag)</h4>
        <p>Select one:</p>
        <ul>
          <li class="acalog-course"><a>SOC 151 - Intro to Sociology</a></li>
        </ul>
      </div>
    `);
    const cats = parseCoreProgram(doc);
    const tag = cats.find(c => c.name === 'Diversity and Difference (Tag)');
    assert.ok(tag, 'should find tag');
    assert.equal(tag.type, 'tag');
    assert.equal(tag.reqType, 'pick-one');
  });

  it('parses section headers (h2 only)', () => {
    const doc = makeDOM(`
      <div class="acalog-core">
        <h2>Foundations</h2>
        <p>The foundations of the core.</p>
      </div>
    `);
    const cats = parseCoreProgram(doc);
    assert.equal(cats.length, 1);
    assert.equal(cats[0].type, 'section-header');
    assert.equal(cats[0].section, 'Foundations');
  });

  it('skips adhoc items like "Or" and "One from"', () => {
    const doc = makeDOM(`
      <div class="acalog-core">
        <h3>Test Category</h3>
        <p>Pick one.</p>
        <ul>
          <li class="acalog-adhoc acalog-adhoc-before">Or</li>
          <li class="acalog-course"><a>TEST 101 - Test Course</a></li>
          <li class="acalog-adhoc acalog-adhoc-before">One from</li>
          <li class="acalog-course"><a>TEST 201 - Another Test</a></li>
        </ul>
      </div>
    `);
    const cats = parseCoreProgram(doc);
    const tc = cats.find(c => c.name === 'Test Category');
    // "Or" and "One from" should not be treated as sub-discipline labels
    assert.equal(tc.courses[0].subDiscipline, null);
    assert.equal(tc.courses[1].subDiscipline, null);
  });
});
