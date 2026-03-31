/**
 * Business logic tests — analyze() with real catalog categories.
 *
 * These tests use pre-parsed catalog data (catalog-categories.json) and
 * the fluent scenario API to verify requirement status progression.
 * Designed to be walkable with the registrar.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scenario, loadCategories, makeCourse, makeExemption, assertStatus, assertKU, getResult } from './helpers.js';
import { analyze } from '../src/core.js';

// ---- Pick-one requirements ----

describe('pick-one requirements', () => {
  it('Community & Commitments: incomplete → take CORE 100 → complete', async (t) => {
    await scenario('Community & Commitments')
      .expect('Community and Commitments', { status: 'incomplete' })
      .taken('CORE 100', 2)
      .expect('Community and Commitments', { status: 'complete', hours: 2, takenCount: 1 })
      .run(t);
  });

  it('Foundational Writing: incomplete → take ENGL 101 → complete', async (t) => {
    await scenario('Foundational Writing')
      .expect('Foundational Writing', { status: 'incomplete' })
      .taken('ENGL 101', 4)
      .expect('Foundational Writing', { status: 'complete', takenCount: 1 })
      .run(t);
  });

  it('World Languages I: incomplete → take SPAN 102 → complete', async (t) => {
    await scenario('World Languages I')
      .expect('World Languages I', { status: 'incomplete' })
      .taken('SPAN 102', 4)
      .expect('World Languages I', { status: 'complete', takenCount: 1 })
      .run(t);
  });

  it('Diversity tag: incomplete → take any tagged course → complete', async (t) => {
    await scenario('Diversity and Difference tag')
      .expect('Diversity and Difference (Tag)', { status: 'incomplete' })
      .taken('COMM 141', 4)
      .expect('Diversity and Difference (Tag)', { status: 'complete', takenCount: 1 })
      .run(t);
  });
});

// ---- Hour-range K&U categories ----

describe('hour-range K&U: Humanities (2–6h, max 4h/discipline)', () => {
  it('no courses → incomplete', async (t) => {
    await scenario('Humanities empty')
      .expect('Humanities', { status: 'incomplete', hours: 0 })
      .run(t);
  });

  it('one discipline at 4h → satisfied (min met, room in other disciplines)', async (t) => {
    await scenario('Humanities one discipline maxed')
      .taken('HIST 152', 4)
      .expect('Humanities', { status: 'satisfied', hours: 4, effective: 4 })
      .expect('Humanities/History', { maxed: true, hours: 4 })
      .expect('Humanities/Philosophy', { maxed: false, hours: 0 })
      .run(t);
  });

  it('two disciplines → complete at max hours', async (t) => {
    await scenario('Humanities two disciplines filled')
      .taken('HIST 152', 4)
      .taken('PHIL 153', 4)
      .expect('Humanities', { status: 'complete', hours: 8, effective: 6 })
      .expect('Humanities/History', { maxed: true })
      .expect('Humanities/Philosophy', { maxed: true })
      .run(t);
  });

  it('one course below discipline cap → satisfied (room in same discipline too)', async (t) => {
    await scenario('Humanities partial discipline')
      .taken('HIST 152', 2)  // hypothetical 2h course — under 4h cap
      .expect('Humanities', { status: 'satisfied', hours: 2 })
      .run(t);
  });
});

describe('hour-range K&U: Natural Sciences (0–6h, max 4h/discipline)', () => {
  it('no courses → optional-available (minHours = 0)', async (t) => {
    await scenario('Natural Sciences empty')
      .expect('Natural Sciences', { status: 'optional-available', hours: 0 })
      .run(t);
  });

  it('one discipline at 4h → satisfied (0–6h range, room for more)', async (t) => {
    await scenario('Natural Sciences one discipline')
      .taken('CHEM 101', 4)
      .expect('Natural Sciences', { status: 'satisfied', hours: 4, effective: 4 })
      .expect('Natural Sciences/Chemistry', { maxed: true })
      .run(t);
  });

  it('two disciplines → complete', async (t) => {
    await scenario('Natural Sciences two disciplines')
      .taken('CHEM 101', 4)
      .taken('PHYS 133', 4)
      .expect('Natural Sciences', { status: 'complete', hours: 8, effective: 6 })
      .run(t);
  });
});

describe('hour-range K&U: optional categories (minHours = 0)', () => {
  it('World Languages II: 0h → optional-available', async (t) => {
    await scenario('World Languages II empty')
      .expect('World Languages II', { status: 'optional-available', hours: 0 })
      .run(t);
  });

  it('World Languages II: take one course → complete', async (t) => {
    await scenario('World Languages II with course')
      .taken('CHIN 201', 4)
      .expect('World Languages II', { status: 'complete', hours: 4 })
      .run(t);
  });

  it('Mathematical Sciences: 0h → optional-available, take course → complete', async (t) => {
    await scenario('Mathematical Sciences progression')
      .expect('Mathematical Sciences', { status: 'optional-available', hours: 0 })
      .taken('CS 108', 4)
      .expect('Mathematical Sciences', { status: 'complete', hours: 4 })
      .run(t);
  });
});

// ---- Exemptions ----

describe('exemptions', () => {
  it('World Languages I exemption → complete without courses', async (t) => {
    await scenario('Language exemption')
      .expect('World Languages I', { status: 'incomplete' })
      .exempt('World Languages I')
      .expect('World Languages I', { status: 'complete', isExempt: true })
      .run(t);
  });
});

// ---- In-progress courses ----

describe('in-progress courses', () => {
  it('in-progress counts for pick-one', async (t) => {
    await scenario('In-progress pick-one')
      .inProgress('CORE 100', 2)
      .expect('Community and Commitments', { status: 'complete', takenCount: 1 })
      .run(t);
  });

  it('in-progress contributes hours to K&U', async (t) => {
    await scenario('In-progress K&U hours')
      .inProgress('HIST 152', 4)
      .expect('Humanities', { status: 'satisfied', hours: 4 })
      .expectKU({ total: 4, categories: 1 })
      .run(t);
  });
});

// ---- Transfer credits ----

describe('transfer credits', () => {
  it('transfer credit counts same as completed', async (t) => {
    await scenario('Transfer credit')
      .transfer('CHEM 101', 4)
      .expect('Natural Sciences', { status: 'satisfied', hours: 4 })
      .run(t);
  });
});

// ---- Multi-section courses (double-counting) ----

describe('multi-section courses', () => {
  it('FREN 202 appears in World Languages II and Global Regions tag', () => {
    const cats = loadCategories();
    const transcript = [makeCourse('FREN 202', 4)];
    const analysis = analyze(cats, transcript);

    const wl2 = getResult(analysis, 'World Languages II');
    assert.equal(wl2.status, 'complete');
    assert.equal(wl2.takenCount, 1);

    const grc = getResult(analysis, 'Global Regions and Cultures (Tag)');
    assert.equal(grc.status, 'complete');
    assert.equal(grc.takenCount, 1);
  });
});

// ---- K&U aggregate ----

describe('K&U aggregate (26h from 5+ categories)', () => {
  it('two categories → 8h, 2 categories used', async (t) => {
    await scenario('K&U two categories')
      .taken('HIST 152', 4)
      .taken('CHEM 101', 4)
      .expectKU({ total: 8, categories: 2 })
      .run(t);
  });

  it('hours capped at category maxHours for aggregate', () => {
    // Humanities max is 6h, so 8h raw → 6h effective
    const cats = loadCategories();
    const transcript = [
      makeCourse('HIST 152', 4),
      makeCourse('PHIL 153', 4),
    ];
    const analysis = analyze(cats, transcript);
    const kuHum = analysis.kuSummary.hoursByCategory['Humanities'];
    assert.equal(kuHum.raw, 8);
    assert.equal(kuHum.effective, 6);
    assert.equal(kuHum.max, 6);
  });

  it('build toward 26h across 5+ categories', async (t) => {
    await scenario('K&U build to 26h')
      // Humanities: 4h (History)
      .taken('HIST 152', 4)
      // Natural Sciences: 4h (Chemistry)
      .taken('CHEM 101', 4)
      // Social & Behavioral: 4h (Economics)
      .taken('ECON 221', 4)
      // Arts: 4h (Performing Arts)
      .taken('MUSC 100', 4)
      // Math Sciences: 4h
      .taken('MATH 100', 4)
      .expectKU({ total: 20, categories: 5 })
      // World Languages II: 4h
      .add('SPAN 202', 4)
      .expectKU({ total: 24, categories: 6 })
      // Add another Humanities discipline — Humanities caps at 6h effective
      // so raw goes 4→8 but effective goes 4→6, adding 2 to total
      .add('PHIL 153', 4)
      .expectKU({ total: 26, categories: 6 })
      .run(t);
  });
});

// ---- Discipline cap edge cases ----

describe('discipline cap edge cases', () => {
  it('Social & Behavioral Sciences: all hours in one discipline → capped, then diversify', async (t) => {
    await scenario('S&B discipline diversification')
      // 4h in Economics → hits discipline cap
      .taken('ECON 221', 4)
      .expect('Social and Behavioral Sciences', { status: 'satisfied', hours: 4 })
      .expect('Social and Behavioral Sciences/Economics', { maxed: true })
      // Add from another discipline → more hours
      .add('PSYC 151', 4)
      .expect('Social and Behavioral Sciences', { status: 'complete', hours: 8, effective: 6 })
      .run(t);
  });
});
