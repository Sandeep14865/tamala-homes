import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

// Dev only: POST /__poster?name=map with a data URL saves public/media/posters/<name>.webp.
// The 3D views render their own still (see viewer.js), so each poster is exactly what the view first shows.
const posterSaver = () => ({
  name: 'tamala-poster-saver',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__poster', (req, res) => {
      const name = new URL(req.url, 'http://x').searchParams.get('name') || '';
      if (req.method !== 'POST' || !/^[a-z0-9-]+$/.test(name)) { res.statusCode = 400; return res.end('bad'); }
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        const b64 = body.replace(/^data:image\/\w+;base64,/, '');
        const dir = resolve(import.meta.dirname, 'public/media/posters');
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, `${name}.webp`), Buffer.from(b64, 'base64'));
        res.end('saved');
      });
    });
  },
});

// A React single-page app (JSX compiled by Vite's own esbuild, no Babel plugin needed).
// scripts/spa-pages.mjs copies index.html to every route after a build, so deep links work on any static host.
export default defineConfig({
  // GitHub Pages serves the site at /tamala-homes/; the deploy workflow sets BASE. Locally it is '/'.
  base: process.env.BASE || '/',
  plugins: [posterSaver()],
  esbuild: { jsx: 'automatic' },
  build: {
    assetsDir: '_app', chunkSizeWarningLimit: 700,
    // framer-motion marks its files "use client" for other frameworks; the bundler's notice about it is noise here
    rollupOptions: { onwarn(w, warn) { if (w.code !== 'MODULE_LEVEL_DIRECTIVE') warn(w); } },
  },
  server: { port: 5173, strictPort: true, watch: { ignored: ['**/public/media/posters/**'] } },
});
