// Tamala Homes: project, flat, floor-plan and map data.
// Everything here is a placeholder for a fictional agency (DESIGN-PLAN.md, "Placeholders you'll replace").

// Stand-in contact details: replace with the real numbers before launch.
export const CONTACT = {
  phone: '+910000000000',          // stand-in: no real number was given
  whatsapp: '910000000000',        // wa.me format, digits only
  email: 'hello@tamalahomes.example',
};

export const STATUS = {
  available: { label: 'Available', color: '#5FAE7C' },
  booked:    { label: 'Booked',    color: '#E0A526' },
  sold:      { label: 'Sold',      color: '#D2503F' },
};

export const PROJECTS = {
  arundelpet: {
    name: 'Tamala Arundelpet', place: 'Arundelpet', status: 'Ready to move',
    towers: ['A'], floors: 8, perFloor: 4,
    // share of flats in each state, read by the seeded generator below
    mix: { sold: 0.78, booked: 0.12 },
  },
  'amaravati-road': {
    name: 'Tamala Amaravati Road', place: 'Amaravati Road', status: 'Under construction',
    towers: ['A', 'B'], floors: 12, perFloor: 4,
    mix: { sold: 0.42, booked: 0.18 },
  },
  gorantla: {
    name: 'Tamala Gorantla', place: 'Gorantla', status: 'Launching soon',
    towers: ['A', 'B', 'C'], floors: 14, perFloor: 4,
    mix: { sold: 0, booked: 0.08 },
  },
};

// Four flats a floor around the core: two 2 BHK on the west face, two 3 BHK on the east.
export const UNIT_TYPES = [
  { code: 'A', bhk: 2, area: 1180, facing: 'West' },
  { code: 'B', bhk: 2, area: 1180, facing: 'West' },
  { code: 'C', bhk: 3, area: 1640, facing: 'East' },
  { code: 'D', bhk: 3, area: 1640, facing: 'East' },
];

// Small seeded random so every visit shows the same availability.
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function flatsFor(projectKey) {
  const p = PROJECTS[projectKey];
  const rnd = seeded([...projectKey].reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const flats = [];
  p.towers.forEach((tower, ti) => {
    for (let floor = 1; floor <= p.floors; floor++) {
      UNIT_TYPES.forEach((u, ui) => {
        const r = rnd();
        // lower floors sell first in a finished building, so tilt the odds by height
        const tilt = p.mix.sold > 0.5 ? (1 - floor / p.floors) * 0.25 : 0;
        const status = r < p.mix.sold + tilt ? 'sold' : r < p.mix.sold + tilt + p.mix.booked ? 'booked' : 'available';
        flats.push({
          id: `${tower}-${floor}${u.code}`, tower, towerIndex: ti, floor, unit: u.code, unitIndex: ui,
          bhk: u.bhk, area: u.area, facing: u.facing, status,
        });
      });
    }
  });
  return flats;
}

// Floor plans in feet. x runs west to east, y north to south. Furniture is drawn as low blocks.
export const PLANS = {
  2: {
    label: '2 BHK', area: 1180, w: 40, d: 34,
    rooms: [
      { id: 'living',   name: 'Living and dining', x: 0,  y: 0,  w: 22, d: 16, tone: '#E9E1CF', items: [{ t: 'sofa', x: 2, y: 2, w: 8, d: 3 }, { t: 'table', x: 14, y: 5, w: 5, d: 3.5 }] },
      { id: 'kitchen',  name: 'Kitchen',           x: 22, y: 0,  w: 10, d: 10, tone: '#DCD3BF', items: [{ t: 'counter', x: 22.5, y: 0.5, w: 9, d: 2 }] },
      { id: 'utility',  name: 'Utility',           x: 32, y: 0,  w: 8,  d: 6,  tone: '#D6CDB8', items: [] },
      { id: 'pooja',    name: 'Pooja room',        x: 32, y: 6,  w: 8,  d: 4,  tone: '#E6D6B4', items: [] },
      { id: 'foyer',    name: 'Foyer',             x: 22, y: 10, w: 18, d: 6,  tone: '#EEE7D7', items: [] },
      { id: 'bed1',     name: 'Bedroom 1',         x: 0,  y: 16, w: 16, d: 13, tone: '#E2DAC6', items: [{ t: 'bed', x: 3, y: 19, w: 6, d: 7 }] },
      { id: 'bath1',    name: 'Bath 1',            x: 16, y: 16, w: 8,  d: 7,  tone: '#D9DCD3', items: [] },
      { id: 'bed2',     name: 'Bedroom 2',         x: 24, y: 16, w: 16, d: 13, tone: '#E2DAC6', items: [{ t: 'bed', x: 31, y: 19, w: 5, d: 6.5 }] },
      { id: 'bath2',    name: 'Bath 2',            x: 16, y: 23, w: 8,  d: 6,  tone: '#D9DCD3', items: [] },
      { id: 'balcony',  name: 'Balcony',           x: 0,  y: 29, w: 40, d: 5,  tone: '#CFD8C4', items: [] },
    ],
  },
  3: {
    label: '3 BHK', area: 1640, w: 48, d: 38,
    rooms: [
      { id: 'living',   name: 'Living and dining', x: 0,  y: 0,  w: 26, d: 17, tone: '#E9E1CF', items: [{ t: 'sofa', x: 2, y: 2, w: 9, d: 3 }, { t: 'table', x: 17, y: 6, w: 6, d: 4 }] },
      { id: 'kitchen',  name: 'Kitchen',           x: 26, y: 0,  w: 12, d: 11, tone: '#DCD3BF', items: [{ t: 'counter', x: 26.5, y: 0.5, w: 11, d: 2 }] },
      { id: 'utility',  name: 'Utility',           x: 38, y: 0,  w: 10, d: 6,  tone: '#D6CDB8', items: [] },
      { id: 'pooja',    name: 'Pooja room',        x: 38, y: 6,  w: 10, d: 5,  tone: '#E6D6B4', items: [] },
      { id: 'foyer',    name: 'Foyer',             x: 26, y: 11, w: 22, d: 6,  tone: '#EEE7D7', items: [] },
      { id: 'bed1',     name: 'Bedroom 1',         x: 0,  y: 17, w: 16, d: 14, tone: '#E2DAC6', items: [{ t: 'bed', x: 3, y: 20, w: 6.5, d: 7 }] },
      { id: 'bath1',    name: 'Bath 1',            x: 16, y: 17, w: 8,  d: 7,  tone: '#D9DCD3', items: [] },
      { id: 'bath2',    name: 'Bath 2',            x: 16, y: 24, w: 8,  d: 7,  tone: '#D9DCD3', items: [] },
      { id: 'bed2',     name: 'Bedroom 2',         x: 24, y: 17, w: 12, d: 14, tone: '#E2DAC6', items: [{ t: 'bed', x: 26.5, y: 20, w: 5.5, d: 6.5 }] },
      { id: 'bed3',     name: 'Bedroom 3',         x: 36, y: 17, w: 12, d: 14, tone: '#E2DAC6', items: [{ t: 'bed', x: 39, y: 20, w: 5.5, d: 6.5 }] },
      { id: 'balcony',  name: 'Balconies',         x: 0,  y: 31, w: 48, d: 7,  tone: '#CFD8C4', items: [] },
    ],
  },
};

// The home page's drive-time dial. Positions are a stylised layout of the city, not survey data: they set each place's direction.
// x: west (-) to east (+), z: north (-) to south (+), in map units.
export const MAP = {
  projects: [
    { key: 'arundelpet',     name: 'Tamala Arundelpet',     x: 2,   z: 1,   href: '/projects/arundelpet.html' },
    { key: 'amaravati-road', name: 'Tamala Amaravati Road', x: 11,  z: -9,  href: '/projects/amaravati-road.html' },
    { key: 'gorantla',       name: 'Tamala Gorantla',       x: -4,  z: -15, href: '/projects/gorantla.html' },
  ],
  landmarks: [
    { name: 'Guntur railway station',     x: 0,   z: 3,   min: { arundelpet: 4, 'amaravati-road': 14, gorantla: 18 } },
    { name: 'Government General Hospital', x: 4,  z: 6,   min: { arundelpet: 6, 'amaravati-road': 16, gorantla: 22 } },
    { name: 'Brodipet',                   x: -5,  z: 5,   min: { arundelpet: 8, 'amaravati-road': 18, gorantla: 17 } },
    { name: 'Inner Ring Road',            x: -9,  z: -6,  min: { arundelpet: 12, 'amaravati-road': 10, gorantla: 5 } },
    { name: 'NH-16 junction',             x: 15,  z: 2,   min: { arundelpet: 11, 'amaravati-road': 9, gorantla: 20 } },
  ],
};
