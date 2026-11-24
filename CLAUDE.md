# Tamala Homes

A website for a fictional apartment builder in Guntur, Andhra Pradesh: three projects (Arundelpet, Amaravati Road, Gorantla), each with a project page, a 3D tower, floor plans and a visit form. Tamala Homes is a coined name for now. All photos and films are Pexels stand-ins; phone numbers, addresses, prices and project facts are placeholders.

- **Live site:** https://sandeep14865.github.io/tamala-homes/
- **Repo:** https://github.com/Sandeep14865/tamala-homes (public). Every push to `main` deploys through `.github/workflows/pages.yml`.

## Stack and layout

React 18 single-page app built with Vite 6 (plain JSX, no TypeScript), Framer Motion for animation, three.js for the 3D tower and floor plans.

| File | What it holds |
|---|---|
| `src/App.jsx` | Router, intro, page curtain |
| `src/lib.jsx` | History router (`BASE`, `Link`, `navigate`), motion helpers (`Words`, `Rise`, `Picture`, `Magnetic`, `Counter`), springs |
| `src/components.jsx` | Nav, cursor, hero, 3D frame, visit form, footer |
| `src/Home.jsx` | Home sections: projects, map, promise, build stages, amenities, visit |
| `src/Project.jsx` | Project pages |
| `src/Orb.jsx` | The travelling turmeric shape on the home page |
| `src/Legal.jsx` | Privacy, terms, credits |
| `src/content.js`, `src/data.js` | Page copy; flats, plans, map, contacts |
| `src/three/*` | Imperative three.js scenes, each with `dispose()` |
| `src/styles.css` | All styles, one file |

Routes: `/`, `/projects/<key>`, `/privacy`, `/terms`, `/credits`.

## Commands

- `npm run dev`: dev server on http://localhost:5173/
- `npm run build`: builds to `dist/`, then `scripts/spa-pages.mjs` copies `index.html` to every route and to `404.html` for static hosting
- `node scripts/posters.mjs`: regenerates the 3D poster images (needs the dev server running)
- `node scripts/sizes.mjs`: makes the 480, 800 and 1200 px copies of every photo in `public/media/img` (run it after adding or changing a photo)

## Rules that must hold

- **Paths go through `BASE`.** The site is served from the `/tamala-homes/` sub-folder. Media and file paths are written as `` `${BASE}/media/...` `` and links use `Link` from `src/lib.jsx`. A bare `/media/...` string breaks the live site.
- **Text selection is off site-wide** (`user-select: none`). This is deliberate.
- **Motion:** use springs with no bounce (`SPRING` in `lib.jsx`); bounce only after a flick or drag. Every animation needs a calm `prefers-reduced-motion` fallback.
- **Keep it light on phones.** Photos go through `srcSet()` in `lib.jsx` (Picture does it for you) with a `sizes` that matches the slot. The hero film is 1.9 MB on desktop and 0.7 MB on phones (H.264, no sound), skipped on Save-Data and 3G or slower, where the WebP poster stays. Google maps mount only when they come near (`useNear`).
- **Each page has its own title and link preview.** `scripts/spa-pages.mjs` writes them into every route's HTML at build time with absolute addresses (`SITE_URL`, default the Pages address). A new route goes in its list, with a 1200×630 share picture in `public/`.
- **Mobile is a first-class target.** Check every change at 390px wide as well as on desktop.

## Look (the client's choices: keep them)

- **Colours:** limewash `#f1f2ec` (background), tamala green `#0f231d` (ink and dark sections), action blue `#295290`, muted `#6f7f77`, turmeric `#e0a526`.
- **Type:** Anek Latin, condensed (`font-stretch: 76%`) for display text.
- **Hero:** full-screen film or photo, the giant name and one glass button. Nothing else.
- **Build stages:** the heading and the four stage titles are turmeric, in a deeper shade (`#9c6f0c`) so they pass contrast on the light background; photos change with a wipe, never a blend.
- **Contrast:** text must pass WCAG AA (muted grey is `#56665e` for that reason). Check new colour pairs before using them.
- **Enquiries go through WhatsApp:** the visit form and the "Ask about this flat" button open a pre-filled WhatsApp message; email is only a fallback link.
- **Floor plans add up:** carpet area is worked out from the drawn rooms and shown next to the balcony and the super built-up figure. If you change a plan, the drawn rooms must stay below the super built-up area.
- **Raised sheets:** cards and panels float a layer above the page, sharing `--sheet`, `--lift` and `--edge` in `styles.css` (project cards, flat panel, maps, 3D frames, visit form and photo, gallery photos, amenity discs). Things you click as a whole (project cards, gallery photos) also lift and lean toward the mouse (`Tilt` / `useTilt` in `lib.jsx`); maps and 3D views you drag stay level. On touch they rest raised and still. A clip-path cuts off a shadow, so reveal masks are dropped once open.
- **Tower view:** only the selected flat is coloured.
- **Map section:** a Google Maps embed with project tabs and drive-time rows that draw the route (keyless embed URLs).
- **Amenities:** round photos that roll in; a swipe row on phones.
- **Travelling shape (`Orb.jsx`):** one turmeric shape follows the home page, resting at `<Spot shape="..."/>` markers (pin, ring, brick, sun, target). It sits on the page, not the screen: absolute position in page coordinates, so it scrolls natively while it rests. It holds still at full size for the first and last fifth of each gap and glides through the middle, with sine easing and a short follow. All shapes rest at one size (136px desktop, 68px phone).
  - Desktop: the section name curves round inside the shape in pure black.
  - Phone: a one-word cream tag (MAP, PROMISE, BUILD, AMENITIES, VISIT) slides out beside it.

## How to check a change

1. Run the dev server and look at the change at 1440×900 and at 390×844.
2. No errors in the console.
3. For motion, scroll through it, including a fast flick and a jerky wheel; one still frame doesn't show motion problems.
4. Before a risky experiment, tag the current commit (for example `git tag amenities-list-version`) so going back is one step.
5. After pushing, confirm the Pages run passed (`gh run list -L1`) and the change is in the live bundle.
