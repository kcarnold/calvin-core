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

## Files

- `manifest.json`: WebExtension manifest for Chrome, Edge, and Firefox.
- `script.js`: content script that injects the transcript input panel and renders the audit.
