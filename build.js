import * as esbuild from 'esbuild';

const common = {
  bundle: true,
  sourcemap: true,
  target: ['chrome120', 'firefox120'],
};

// Hosted standalone overlap viewer bundle for program pages.
await esbuild.build({
  ...common,
  entryPoints: ['overlap_view.js'],
  outfile: 'docs/overlap-view.js',
  format: 'iife',
  minify: true,
  sourcemap: false,
});

// Standalone app (docs/index.html), with the saved catalogs bundled in.
await esbuild.build({
  ...common,
  entryPoints: ['src/app.js'],
  outfile: 'docs/app.js',
  format: 'iife',
  minify: true,
  sourcemap: false,
});

console.log('Built docs/app.js and docs/overlap-view.js');
