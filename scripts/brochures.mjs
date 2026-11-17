// Writes one-page stand-in brochures (public/brochures/*.pdf) until the agency's designed brochures exist.
// Plain PDF 1.4 with the built-in Helvetica, so no library is needed. Run: node scripts/brochures.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const out = resolve(import.meta.dirname, '../public/brochures');
mkdirSync(out, { recursive: true });

const BROCHURES = {
  'tamala-homes': ['Tamala Homes', 'Apartments in Guntur', [
    'Tamala Arundelpet: ready to move. 1 tower, 32 flats, 2 and 3 BHK.',
    'Tamala Amaravati Road: under construction. 2 towers, 96 flats, 2 and 3 BHK.',
    'Tamala Gorantla: launching soon. 3 towers, 168 flats, 2 and 3 BHK.',
    '', '2 BHK: 1,180 sq ft super built-up. 3 BHK: 1,640 sq ft super built-up.',
    'Every flat has a pooja room, a utility area and a balcony.']],
  arundelpet: ['Tamala Arundelpet', '2 and 3 BHK flats in Arundelpet, Guntur', [
    'Status: ready to move.', 'Tower: stilt and 8 floors, 32 flats.', 'Sizes: 1,180 and 1,640 sq ft.',
    'Amenities: terrace garden, gym, children\'s play area.', 'Price: on request.']],
  'amaravati-road': ['Tamala Amaravati Road', '2 and 3 BHK flats on Amaravati Road, Guntur', [
    'Status: under construction. Handover planned for December 2027.', 'Towers: 2, stilt and 12 floors, 96 flats.',
    'Sizes: 1,180 and 1,640 sq ft.', 'Amenities: lap pool, clubhouse, gym, children\'s play area.', 'Price: on request.']],
  gorantla: ['Tamala Gorantla', '2 and 3 BHK flats in Gorantla, Guntur', [
    'Status: launching soon. Allotments from February 2027.', 'Towers: 3, stilt and 14 floors, 168 flats.',
    'Sizes: 1,180 and 1,640 sq ft.', 'Amenities: lap pool, clubhouse, garden pavilion, children\'s play area.', 'Price: on request.']],
};

const esc = (t) => t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function pdf(title, sub, lines) {
  // A4 portrait, 595 x 842 pt
  const ops = [
    '0.118 0.165 0.106 rg 0 742 595 100 re f',                       // leaf-green band
    'BT /F2 30 Tf 0.949 0.929 0.882 rg 48 784 Td (' + esc(title) + ') Tj ET',
    'BT /F1 13 Tf 0.118 0.165 0.106 rg 48 700 Td (' + esc(sub) + ') Tj ET',
    ...lines.map((l, i) => `BT /F1 11 Tf 48 ${660 - i * 20} Td (${esc(l)}) Tj ET`),
    'BT /F1 9 Tf 0.333 0.369 0.310 rg 48 60 Td (Tamala Homes, Brodipet, Guntur. Sizes and dates are indicative until the sale agreement.) Tj ET',
  ].join('\n');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>',
    `<< /Length ${Buffer.byteLength(ops)} >>\nstream\n${ops}\nendstream`,
  ];
  let body = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(Buffer.byteLength(body)); body += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  body += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info << /Title (${esc(title)}) >> >>\nstartxref\n${xref}\n%%EOF\n`;
  return body;
}

for (const [file, [title, sub, lines]] of Object.entries(BROCHURES)) {
  writeFileSync(resolve(out, `${file}.pdf`), pdf(title, sub, lines));
  console.log(`brochures/${file}.pdf`);
}
