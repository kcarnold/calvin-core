/**
 * Real students' records, de-identified: each test/fixtures/cases/*.json was
 * copied from the "Test case" section at the bottom of the Core Planner page
 * (src/test-case.js) while advising. `expected` is what's right for that
 * student. A case marked "toolIsWrong" is a known bug: reported as a todo, not
 * a failure, until it's fixed.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { parseProgressRows } from '../src/core.js';
import { analyze } from './recorder.js';
import { expectedFrom } from '../src/test-case.js';
import { KNOWN_COURSE_CATEGORIES } from '../src/catalog-courses.js';
import { loadCategories } from './helpers.js';

const DIR = new URL('./fixtures/cases/', import.meta.url);
const files = readdirSync(DIR).filter(f => f.endsWith('.json')).sort();

describe('advising cases (real students, de-identified)', () => {
  for (const file of files) {
    const c = JSON.parse(readFileSync(new URL(file, DIR), 'utf-8'));
    it(c.about || file, { todo: c.toolIsWrong || undefined }, () => {
      const analysis = analyze(loadCategories(c.catalog), c.courses, {
        workdayStatus: new Map(c.workdayStatus), overrides: new Set(c.overrides), extraCourses: KNOWN_COURSE_CATEGORIES,
      });
      assert.deepEqual(expectedFrom(analysis), c.expected, file);
    });
    // A case stores the parser's output (`courses`), not the export, so the
    // test above only covers analyze(). But `workdayStatus` keeps each
    // registration verbatim as Workday listed it, so re-parsing those items
    // covers the parser: a course it can't read (as the old parser couldn't
    // read "SOC 250/ SOWK 250 - ...") would have been dropped from `courses`.
    it(`${file}: every registration Workday lists reads as a course or dated item`, () => {
      for (const [requirement, { status, items }] of c.workdayStatus || []) {
        for (const item of items) {
          const { courses, exemptions } = parseProgressRows([
            ['Requirement', 'Status', 'Remaining', 'Registrations Used', 'Academic Period', 'Hours', 'Grade'],
            [requirement, status, '', item, '', '', '']]);
          assert.ok(courses.length + exemptions.length > 0, item);
        }
      }
    });
  }
});
