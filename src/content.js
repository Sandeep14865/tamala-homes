// Page copy for Tamala Homes. Every project fact here is a placeholder for a fictional agency.
// Numbers and flat data live in data.js.

export const ORDER = ['arundelpet', 'amaravati-road', 'gorantla'];

export const PAGES = {
  arundelpet: {
    // ll: where the map drops its pin. A pin on coordinates shows a plain card; a place-name search showed Google's
    // place card with "No reviews", which reads badly for a builder
    key: 'arundelpet', name: 'Tamala Arundelpet', short: 'Arundelpet', place: 'Arundelpet', ll: '16.2989,80.4439', inPlace: 'in Arundelpet',
    status: 'Ready to move', title: '2 and 3 BHK flats in Arundelpet, Guntur',
    card: 'One tower of 32 flats near the railway station.',
    cardImg: 'arundelpet-exterior.webp', cardAlt: 'White apartment tower among palm trees', cardPos: '50% 30%',
    hero: 'arundelpet-hero.webp', heroAlt: 'A white apartment tower with green bands among palm trees', heroPos: '50% 35%',
    overviewH: 'One tower of 32 flats, ready now',
    overviewP: 'Finished in 2026 with its occupancy certificate. Walk through the show flat on any day of the week.',
    facts: [['Status', 'Ready to move'], ['Tower', 'Stilt and 8 floors'], ['Flats', '32'], ['Types', '2 and 3 BHK'],
      ['Sizes', '1,180 and 1,640 sq ft'], ['Amenities', 'Terrace garden, gym, play area'], ['Price', 'On request']],
    overviewImg: ['living-bright.webp', 'A bright living room with a corner sofa and wooden floor'],
    gallery: [['living-teal.webp', 'A living room with a teal wall, a grey sofa and a dining table'], ['kitchen-dark.webp', 'A dark kitchen with an island and pendant lights'],
      ['bedroom-island.webp', 'A bedroom beside a kitchen island'], ['openplan-wood.webp', 'An open plan flat with a wooden slatted wall'], ['city-view.webp', 'A breakfast counter by a window onto apartment towers']],
  },
  'amaravati-road': {
    key: 'amaravati-road', name: 'Tamala Amaravati Road', short: 'Amaravati Road', place: 'Amaravati Road', ll: '16.3204,80.4390', inPlace: 'on Amaravati Road',
    status: 'Under construction', title: '2 and 3 BHK flats on Amaravati Road, Guntur',
    card: 'Two towers of 96 flats, handover December 2027.',
    cardImg: 'amaravati-exterior.webp', cardAlt: 'Two apartment towers in slate and orange under a cloudy sky', cardPos: '50% 50%',
    hero: 'amaravati-hero.webp', heroAlt: 'Two apartment towers in slate and orange under a cloudy sky', heroPos: '50% 40%',
    overviewH: 'Two towers of 96 flats, rising now',
    overviewP: 'Book now and choose your floor while most are still free. We send photographs of your tower every month.',
    facts: [['Status', 'Under construction'], ['Towers', '2, stilt and 12 floors'], ['Flats', '96'], ['Types', '2 and 3 BHK'],
      ['Sizes', '1,180 and 1,640 sq ft'], ['Handover', 'December 2027'], ['Price', 'On request']],
    overviewImg: ['living-openplan.webp', 'An open plan living room with a balcony door'],
    gallery: [['living-marble.webp', 'A living room with a marble wall and a chandelier'], ['openplan-wood.webp', 'An open plan flat with a wooden slatted wall'],
      ['kitchen-dark.webp', 'A dark kitchen with an island and pendant lights'], ['bedroom-island.webp', 'A bedroom beside a kitchen island'], ['living-teal.webp', 'A living room with a teal wall and a dining table']],
    progress: [['Foundation', 100], ['Structure, Tower A', 75], ['Structure, Tower B', 60], ['Brickwork', 40], ['Plumbing and wiring', 15], ['Finishes', 0]],
    progressImg: ['build-crew.webp', 'Workers in hard hats and safety vests inside a building under construction'],
  },
  gorantla: {
    key: 'gorantla', name: 'Tamala Gorantla', short: 'Gorantla', place: 'Gorantla', ll: '16.3389,80.4268', inPlace: 'in Gorantla',
    status: 'Launching soon', title: '2 and 3 BHK flats in Gorantla, Guntur',
    card: 'Three towers of 168 flats off the Inner Ring Road.',
    cardImg: 'gorantla-exterior.webp', cardAlt: 'Apartment towers lit by the evening sun', cardPos: '50% 50%',
    hero: 'gorantla-hero.webp', heroAlt: 'Apartment towers lit by the evening sun', heroPos: '50% 55%',
    overviewH: 'Three towers of 168 flats, launching soon',
    overviewP: 'Register now to pick a flat in the first round of allotments, at the price of the first round.',
    facts: [['Status', 'Launching soon'], ['Towers', '3, stilt and 14 floors'], ['Flats', '168'], ['Types', '2 and 3 BHK'],
      ['Sizes', '1,180 and 1,640 sq ft'], ['Allotments', 'From February 2027'], ['Price', 'On request']],
    overviewImg: ['playground-blocks.webp', "A children's climbing frame in a courtyard between apartment blocks"],
    gallery: [['living-marble.webp', 'A living room with a marble wall and a chandelier'], ['living-teal.webp', 'A living room with a teal wall and a dining table'],
      ['kitchen-dark.webp', 'A dark kitchen with an island and pendant lights'], ['openplan-wood.webp', 'An open plan flat with a wooden slatted wall'], ['bedroom-island.webp', 'A bedroom beside a kitchen island']],
  },
};

export const STAGES = [
  ['Approvals before the first brick', 'Plans approved by the Guntur Municipal Corporation and the project registered under AP RERA before we take a booking.', 'build-plans.webp', 'Two men reading building plans spread on the bonnet of a car at a site'],
  ['Structure you can visit', 'Book a walk through the site with our engineer on any Sunday morning while your tower goes up.', 'build-silhouette.webp', 'Workers on the steel frame of a building at sunset'],
  ['Finishes you choose', 'Floor tiles, kitchen counter and bathroom fittings picked from three sets at our office.', 'kitchen-dark.webp', 'A dark kitchen with an island and pendant lights'],
  ['Handover with papers', 'Keys, the occupancy certificate and the sale deed on the same day.', 'living-warm.webp', 'A finished living room with a white sofa and wood panelling'],
];

export const AMENITIES = [
  ['Lap pool', 'A 25 metre pool with a shallow end for children.', 'pool-lawn.webp', 'A long outdoor lap pool between lawns'],
  ['Clubhouse', 'A hall for functions, a gym and an indoor pool for the colder months.', 'pool-club.webp', 'An indoor pool with lanes inside a glass hall'],
  ['Garden pavilion', 'Shade and seating beside the water for evenings outside.', 'pool-pavilion.webp', 'A pool beside a covered pavilion with a sunshade'],
  ["Children's play area", 'Slides and climbing frames on soft ground, in sight of the towers.', 'playground.webp', "A children's slide in a park between apartment buildings"],
];

export const HOURS = [['Monday to Saturday', '9:30 to 19:00'], ['Sunday', '10:00 to 14:00']];

// Every stand-in picture on the site, with its Pexels page (free to use under the Pexels licence).
export const CREDITS = [
  ['Hero film, aerial', 'video', 18005655], ['Hero film, living room', 'video', 10135156],
  ['Arundelpet tower', 'photo', 37019051], ['Amaravati Road towers', 'photo', 33848325], ['Gorantla towers', 'photo', 36342575],
  ['Bright living room', 'photo', 9494898], ['Living room with white sofa', 'photo', 27164969],
  ['Open plan living room', 'photo', 2030037], ['Living room with teal wall', 'photo', 6585598], ['Living room with marble wall', 'photo', 39829283],
  ['Bedroom and kitchen island', 'photo', 6447384], ['Dark kitchen', 'photo', 7511695], ['Open plan with wooden wall', 'photo', 30973390],
  ['Breakfast counter with a view', 'photo', 6447390], ['Lap pool', 'photo', 7546653], ['Indoor pool', 'photo', 8328775],
  ['Pool pavilion', 'photo', 2155202], ['Playground', 'photo', 21077403], ['Courtyard playground', 'photo', 7401101],
  ['Building frame at sunset', 'photo', 9372231], ['Site crew', 'photo', 30592257], ['Plans on site', 'photo', 24525165],
];

export const LEGAL = {
  privacy: {
    title: 'Privacy',
    blocks: [
      [null, 'When you book a site visit we receive your name, your phone number, the project and the day you chose. We use them only to call you about that visit and the flat you asked about.'],
      ['Who sees your details', 'Our sales office in Brodipet. We do not sell or pass your details to anyone else.'],
      ['How long we keep them', 'Twelve months after your last visit, unless you buy a flat, when they become part of your sale file.'],
      ['Maps', 'The home page and the project pages show a Google map. Google receives your request when that map loads.'],
      ['Removing your details', 'Ask us on WhatsApp or by phone and we delete them within a week.'],
    ],
  },
  terms: {
    title: 'Terms',
    blocks: [
      [null, 'Floor plans, sizes, flat availability and the 3D models on this website show what we plan to build. They help you choose; the sale agreement for your flat is what counts.'],
      ['Availability', 'Availability changes every day. A flat is held for you only once we confirm a booking in writing.'],
      ['Photographs', 'Some photographs show finished flats and amenities of the kind we build, not the project itself. See the credits page for each source.'],
    ],
  },
};
