// Smaller copies of every photo for phones and narrow columns: public/media/img/480/, 800/ and 1200/x.webp beside the
// full-size x.webp (1100 to 1800 px wide). The site picks one through srcset (see srcSet in src/lib.jsx).
// Run after adding or changing a photo: node scripts/sizes.mjs
import sharp from 'sharp';
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
const dir = resolve(import.meta.dirname, '../public/media/img');
for (const w of [480, 800, 1200]) mkdirSync(resolve(dir, String(w)), { recursive: true });
for (const f of readdirSync(dir).filter(f => f.endsWith('.webp'))) {
  for (const w of [480, 800, 1200]) {
    const out = resolve(dir, String(w), f);
    await sharp(resolve(dir, f)).resize({ width: w, withoutEnlargement: true }).webp({ quality: 74, effort: 6 }).toFile(out);
  }
  console.log(f, ['', '1200/', '800/', '480/'].map(p => Math.round(statSync(resolve(dir, p + f)).size / 1024) + 'k').join(' / '));
}
