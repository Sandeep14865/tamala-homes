// After `vite build`: copy dist/index.html to every route, so a deep link (/projects/gorantla) opens on any static host.
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const dist = resolve(import.meta.dirname, '../dist');
for (const route of ['projects/arundelpet', 'projects/amaravati-road', 'projects/gorantla', 'privacy', 'terms', 'credits']) {
  mkdirSync(resolve(dist, route), { recursive: true });
  copyFileSync(resolve(dist, 'index.html'), resolve(dist, route, 'index.html'));
  console.log(`dist/${route}/index.html`);
}
// any other address gets the app too, which shows its own "page not found"
copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'));
console.log('dist/404.html');
