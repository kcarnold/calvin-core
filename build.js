import { copyFileSync } from 'node:fs';
import * as esbuild from 'esbuild';

const common = {
  bundle: true,
  sourcemap: true,
  target: ['chrome120', 'firefox120'],
};

// Chrome extension content script — pdfjs-dist is bundled, worker copied to dist/
await esbuild.build({
  ...common,
  entryPoints: ['src/main.js'],
  outfile: 'dist/extension.js',
  format: 'iife',
  define: { __USE_BUNDLED_PDFJS__: 'true' },
});
copyFileSync('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'dist/pdf.worker.min.mjs');

const bookmarkletCommon = {
  ...common,
  format: 'iife',
  minify: true,
  sourcemap: false,
  define: { __USE_BUNDLED_PDFJS__: 'false' },
  external: ['pdfjs-dist'],
};

// Local bookmarklet bundle (same app bundle, minified)
await esbuild.build({
  ...bookmarkletCommon,
  entryPoints: ['src/main.js'],
  outfile: 'dist/bookmarklet.js',
});

// Hosted bookmarklet bundle for GitHub Pages.
await esbuild.build({
  ...bookmarkletCommon,
  entryPoints: ['src/bookmarklet-entry.js'],
  outfile: 'docs/bookmarklet.js',
});

console.log('Built dist/extension.js, dist/bookmarklet.js, and docs/bookmarklet.js');
