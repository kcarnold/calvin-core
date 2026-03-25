# calvin-core

Browser extension that annotates Calvin's core curriculum page with a student's Workday Academic History transcript.

It runs on:

- https://catalog.calvin.edu/content.php?catoid=24&navoid=780

When the page loads, the extension adds a collapsed Calvin Core Annotator panel above the catalog content. Students can:

1. Open Workday.
2. Go to Academic Record.
3. Open Academic History.
4. Select all and copy.
5. Paste into the panel.

Pasting runs the audit immediately.

## Load Locally

### Chrome or Edge

1. Open the extensions page.
	Chrome: `chrome://extensions`
	Edge: `edge://extensions`
2. Turn on Developer mode.
3. Click Load unpacked.
4. Select this repository folder.

### Firefox

1. Open `about:debugging`.
2. Click This Firefox.
3. Click Load Temporary Add-on.
4. Select `manifest.json` from this repository.

Firefox temporary add-ons unload when the browser restarts, so that path is best for testing. For broader student distribution, publish the extension package.

> **Note:** Run `npm run build` first — the manifest now points to `dist/extension.js`.

## Development

```sh
npm install
npm run build   # → dist/extension.js + dist/bookmarklet.js + docs/bookmarklet.js
npm test         # run test harness against transcript fixtures
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

The test harness auto-fetches the catalog HTML on first run.

## Bookmarklet

For local testing, after `npm run build`, wrap `dist/bookmarklet.js` in a `javascript:` URL:

```sh
echo "javascript:$(cat dist/bookmarklet.js)" | pbcopy
```

Paste as a bookmark's URL. Click it on the catalog page.

For a hosted bookmarklet that always loads the latest deployed bundle, publish the `docs/` directory with GitHub Pages. The install page lives at:

```text
https://kcarnold.github.io/calvin-core/
```

The live bookmarklet there injects `https://kcarnold.github.io/calvin-core/bookmarklet.js`, so pushing a new `docs/bookmarklet.js` updates the bookmarklet behavior without asking users to replace the bookmark.

## Files
  bookmarklet-entry.js ← hosted bookmarklet entry point

```
src/
  core.js       ← parseTranscript, parseCoreProgram, analyze (pure, testable)
  render.js     ← DOM annotation & rendering (browser-only)
  ui.js         ← launcher panel, page detection, runAnnotation
  main.js       ← entry point
docs/           ← GitHub Pages install page + hosted bookmarklet bundle
test/
  run-test.js   ← Node.js test harness (jsdom)
  fixtures/     ← catalog.html (auto-fetched), transcript-*.txt, *.expected.json
build.js        ← esbuild config → dist/extension.js + dist/bookmarklet.js
manifest.json   ← WebExtension manifest (Chrome, Edge, Firefox)
script.js       ← legacy monolith (kept for reference, not used by build)
```
