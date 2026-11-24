// After `vite build`: copy dist/index.html to every route, so a deep link (/projects/gorantla) opens on any static host.
// Each copy gets its own title, description and link preview (og: tags with absolute addresses, which WhatsApp,
// Facebook and X need), so a shared project link shows that project's name and picture.
// The live address comes from SITE_URL, or defaults to the GitHub Pages address.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PAGES, ORDER, LEGAL } from '../src/content.js';

const dist = resolve(import.meta.dirname, '../dist');
const SITE = (process.env.SITE_URL || 'https://sandeep14865.github.io/tamala-homes').replace(/\/+$/, '');
const html = readFileSync(resolve(dist, 'index.html'), 'utf8');
// the folder Vite put in front of file addresses ('/tamala-homes' on Pages, '' locally), read off the poster preload
const base = (html.match(/href="([^"]*)\/media\/hero-poster/) || [, ''])[1];
const PRELOADS = /<link rel="preload" as="image" href="[^"]*hero-poster[^>]*>\n?/g;
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const HOME = {
  route: '', title: 'Tamala Homes: 2 and 3 BHK apartments in Guntur',
  desc: 'Tamala Homes builds and sells its own apartment projects in Arundelpet, on Amaravati Road and in Gorantla, Guntur. See the flats and book a site visit.',
  ogTitle: 'Tamala Homes: apartments in Guntur',
  ogDesc: 'Three apartment projects in Guntur, from ready flats in Arundelpet to a new launch in Gorantla.',
  image: 'share.jpg',
};
const routes = [
  HOME,
  ...ORDER.map(k => {
    const p = PAGES[k];
    return {
      route: `projects/${k}`, title: `${p.name}: ${p.title}`,
      desc: `${p.title}. ${p.card} ${p.overviewP}`,
      ogTitle: p.name, ogDesc: `${p.title}. ${p.card}`, image: `share-${k}.jpg`, hero: p.hero,
    };
  }),
  ...['privacy', 'terms'].map(k => ({ route: k, title: `${LEGAL[k].title}: Tamala Homes, Guntur`, desc: `${LEGAL[k].title} for the Tamala Homes website.`, image: 'share.jpg' })),
  { route: 'credits', title: 'Credits: Tamala Homes, Guntur', desc: 'Who made the photographs, film and type on the Tamala Homes website.', image: 'share.jpg' },
];

// replace a tag's content if it is there, or add it before </head>
const meta = (doc, attr, key, value) => {
  const re = new RegExp(`<meta ${attr}="${key}" content="[^"]*">`);
  const tag = `<meta ${attr}="${key}" content="${esc(value)}">`;
  return re.test(doc) ? doc.replace(re, tag) : doc.replace('</head>', `${tag}\n</head>`);
};
for (const r of routes) {
  const url = `${SITE}/${r.route ? r.route + '/' : ''}`;
  let doc = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(r.title)}</title>`);
  // the film poster is only the home page's first screen; a project page fetches its own hero photo at once instead,
  // in the size that fits the screen (the same srcset the page uses), and the legal pages need neither
  if (r.route) {
    const img = `${base}/media/img`;
    const hero = r.hero ? `<link rel="preload" as="image" href="${img}/${r.hero}" imagesrcset="${img}/480/${r.hero} 480w, ${img}/800/${r.hero} 800w, ${img}/1200/${r.hero} 1200w, ${img}/${r.hero} 1800w" imagesizes="100vw" fetchpriority="high">\n` : '';
    doc = doc.replace(PRELOADS, '').replace('</head>', `${hero}</head>`);
  }
  doc = meta(doc, 'name', 'description', r.desc);
  doc = meta(doc, 'property', 'og:title', r.ogTitle || r.title);
  doc = meta(doc, 'property', 'og:description', r.ogDesc || r.desc);
  doc = meta(doc, 'property', 'og:url', url);
  doc = meta(doc, 'property', 'og:image', `${SITE}/${r.image}`);
  doc = meta(doc, 'property', 'og:image:width', '1200');
  doc = meta(doc, 'property', 'og:image:height', '630');
  doc = meta(doc, 'property', 'og:site_name', 'Tamala Homes');
  const dir = resolve(dist, r.route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), doc);
  console.log(`dist/${r.route ? r.route + '/' : ''}index.html  ${r.title}`);
}
// any other address gets the app too, which shows its own "page not found"
copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'));
console.log('dist/404.html');
