# calvin-core

Unofficial planning aid that checks a student's Workday courses against Calvin's core requirements.

## Core Planner (standalone app)

`docs/index.html`, served by GitHub Pages at https://kcarnold.github.io/calvin-core/. Students pick their entry-year catalog, paste Workday Academic Progress (or Academic History), and see each requirement's status, course options, and where each course counts.

- Workday is the official record; the page says so up front.
- Requirements come from catalog snapshots in `catalog/` (saved from a browser; see CLAUDE.md). Catalog wording, course codes, titles, and list order are shown as the catalog has them; `test/test-app-fidelity.js` checks this against the saved HTML.
- Each sentence of catalog wording is labeled Checked, Partly checked, Not checked, or Advice (`INSTRUCTION_RULES` in `src/core.js`). New catalog wording fails `test/test-catalog-claims.js` until it's classified.
- Course codes link to `preview_course_nopop.php`; each requirement links to its spot on the official catalog page.
- Everything runs in the browser. The page's Content-Security-Policy blocks network requests (`connect-src 'none'`), so pasted data can't leave it.

## Development

```sh
npm install
npm run build   # → docs/app.js, docs/overlap-view.js
npm test        # unit, claims, fidelity, and integration tests
# Preview the app (its CSP needs http, not file://):
python3 -m http.server --directory docs
```

## Testing

Put transcript `.txt` files in `test/fixtures/` (gitignored so student data stays local):

```sh
# First run prints analysis JSON for review:
npm test

# Snapshot the output as the expected baseline:
node test/run-test.js test/fixtures/transcript-alice.txt > test/fixtures/transcript-alice.expected.json

# Future runs assert results match the snapshot:
npm test
```

The integration harness uses `catalog/catalog-24.html`.

## Program Overlap Viewer (Separate)

The overlap viewer is intentionally distributed as a separate tool from the core transcript annotator.

- Install page: `https://kcarnold.github.io/calvin-core/overlap.html`
- Hosted script: `https://kcarnold.github.io/calvin-core/overlap-view.js`
- Source script: `overlap_view.js` (runs on `preview_program.php` pages)

Run `npm run build` to regenerate `docs/overlap-view.js`.

## Files

```
src/
  core.js       ← parsers, catalog instruction rules, analyze (pure, testable)
  app.js        ← standalone app entry (bundles catalog/*.json)
  app-render.js ← standalone app rendering (testable in jsdom)
catalog/        ← catalog-<catoid>.html (saved from a browser) + generated catalog-categories-<catoid>.json
docs/           ← GitHub Pages: app (index.html, app.js), overlap viewer install page + bundle
test/           ← node:test suites, integration harness, catalog JSON generator
build.js        ← esbuild config
script.js       ← legacy monolith (kept for reference, not used by build)
overlap_view.js ← standalone program/core overlap panel script
```
