import * as esbuild from 'esbuild';

const common = {
  bundle: true,
  sourcemap: true,
  target: ['chrome120', 'firefox120'],
};

// Chrome extension content script
await esbuild.build({
  ...common,
  entryPoints: ['src/main.js'],
  outfile: 'dist/extension.js',
  format: 'iife',
});

// Local bookmarklet bundle (same app bundle, minified)
await esbuild.build({
  ...common,
  entryPoints: ['src/main.js'],
  outfile: 'dist/bookmarklet.js',
  format: 'iife',
  minify: true,
  sourcemap: false,
});

// Hosted bookmarklet bundle for GitHub Pages.
await esbuild.build({
  ...common,
  entryPoints: ['src/bookmarklet-entry.js'],
  outfile: 'docs/bookmarklet.js',
  format: 'iife',
  minify: true,
  sourcemap: false,
});

console.log('Built dist/extension.js, dist/bookmarklet.js, and docs/bookmarklet.js');
