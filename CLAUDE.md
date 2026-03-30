# Calvin Core Annotator

Browser extension / bookmarklet that annotates https://catalog.calvin.edu/content.php?catoid=24&navoid=780 with a student's transcript data to show core program fulfillment status.

## Project Structure

- `src/core.js` — Pure logic: `parseTranscript`, `parseCoreProgram(root)`, `analyze`, `KU_NAMES`. No DOM globals; `parseCoreProgram` takes a root element (document or jsdom).
- `src/render.js` — DOM rendering: injects styles, badges, TOC, annotations. Browser-only.
- `src/ui.js` — Launcher panel, paste handler, `main()` entry. Browser-only.
- `src/main.js` — Entry point (imports ui.js, calls `main()`).
- `build.js` — esbuild: bundles to `dist/extension.js` (IIFE) and `dist/bookmarklet.js` (IIFE, minified).
- `test/run-test.js` — Node.js test harness using jsdom. Runs `parseTranscript → parseCoreProgram → analyze` against transcript fixtures.
- `test/fixtures/` — Gitignored. Contains `catalog.html` (auto-fetched), `transcript-*.txt` (student data), `*.expected.json` (snapshots).
- `script.js` — Legacy monolith (kept for reference).

## Build & Test

```sh
npm install
npm run build   # → dist/extension.js + dist/bookmarklet.js
npm test         # runs test/run-test.js against all transcript-*.txt fixtures
```

## Target Page DOM

- Core categories live in `div.acalog-core` blocks (~22 of them). Section headers use `<h2>`, categories `<h3>`, Engaged Citizenship tags `<h4>`.
- Courses are `li.acalog-course` inside `<ul>`. Course text is in the `<a>` child — never use `li.textContent` directly because expanded course descriptions pollute it.
- Sub-discipline labels (e.g., "Performing Arts", "Biology") are `li.acalog-adhoc.acalog-adhoc-before`. The literals "Or", "One from", "And" are also adhoc items but aren't sub-disciplines.
- Course codes match `/^[A-Z]{2,5}\s+\d{3}[A-Z]?/`. All 459 courses on the page match this.

## Transcript Format (Workday Academic History)

- Students copy-paste from Workday's "Student Academic History" page. Entries are tab-delimited, separated by "Opens in new window" strings.
- Fields per entry: course name, grade, grade points (decimal), hours (integer), earned grade points (decimal). The grade regex must allow 1-2 uppercase letters (e.g., "A-", "B+", "CR").
- Lab courses (code ending in `L`, e.g., `CS 106L`) must have their hours merged into the parent lecture course. Labs don't appear in the catalog's core lists.

## Requirement Rules

- **Foundations / Competencies**: pick-one (any course taken = complete).
- **K&U categories**: hour-range parsed from instructions (e.g., "2–6 semester hours"). Note the en-dash `–` not hyphen.
- **Sub-discipline max**: "up to 4 semester hours in any one discipline" — tracked per sub-discipline heading.
- **K&U aggregate**: ≥26 hours from ≥5 of 6 K&U categories. Hours are **capped at maxHours per category** for the aggregate (a student with 8h in Math Sciences 0–4h only contributes 4h to the 26h total).
- **Engaged Citizenship tags**: pick-one, may overlap with any other category. Tags use `<h4>` not `<h3>`.
- **World Languages II**: 0–4h minimum means it's optional (status "optional-available" when 0h earned).

## Status Values

### Category result statuses (from `analyze()`)
- `header` — section-level heading (e.g., "Foundations"); not a real requirement; skipped in tests and rendering.
- `info-only` — category has no courses listed (nothing to fulfill); skipped in tests.
- `complete` — all requirements satisfied. Pick-one: ≥1 course taken. Hour-range: min hours met and no more can be added (discipline cap reached or maxHours hit). Badge: "✓ COMPLETE"; block fades to 0.45 opacity.
- `satisfied` — K&U hour-range: minimum hours met **and** more hours could still be counted (room in discipline/max). Badge: "MIN MET". Distinct from `complete` to signal the student can keep going.
- `incomplete` — requirement not yet met. Pick-one: no course taken. Hour-range: below minHours. Badge: "AREAS TO EXPLORE" or "X/Y+ hrs".
- `optional-available` — optional requirement (minHours = 0) with 0 hours earned (e.g., World Languages II). Badge: "OPTIONAL".

### Transcript course statuses (from `parseTranscript()`)
- `completed` — normal graded/passed course.
- `in-progress` — course marked "(In Progress)" in Workday; included in `allActiveSet`, so it counts for both pick-one and hour-range requirements (same as completed).
- `transfer` — transfer credit, marked "(Transfer Credit)"; treated like `completed` for requirement matching.
- `exemption` — special entry (e.g., "World Languages I Exemption"); satisfies a named category without contributing hours.

## Design Decisions

- Completed non-tag categories get `opacity: 0.45` with `:hover` restore. Tags stay full opacity because they overlap with other requirements.
- Double-count = course appearing in multiple `acalog-core` blocks. Annotated on **both sides** with clickable links that scroll to the other section.
- Double-count uses blue (#e8f0fe / #1a73e8), not red/orange — it's an opportunity, not a warning.
- Cross-references are real DOM `<span>` + `<a>` elements (not `::after` pseudo-elements) so they can be clickable.
- Taken courses that appear in multiple sections get a green→blue gradient background.
- Page reload = reset. No cleanup logic needed beyond what `render()` does for re-runs.

## Not Yet Implemented

- Credit hours for **untaken** courses (would require AJAX calls to `preview_course.php` — see `onclick` attrs on course links for `coid` param). Currently only transcript hours are used.
- Foundational Writing has a two-course sequence option (ENGL 100 + 102) that isn't specially handled.
- No persistence — transcript must be re-pasted each time.
