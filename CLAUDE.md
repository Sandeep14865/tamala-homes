# Tamala Homes

A website for a fictional apartment builder in Guntur, Andhra Pradesh: three projects (Arundelpet, Amaravati Road, Gorantla), each with a project page, a 3D tower, floor plans and a visit form. Tamala Homes is a coined name for now. All photos and films are Pexels stand-ins; phone numbers, addresses, prices and project facts are placeholders.

- **Live site:** https://sandeep14865.github.io/tamala-homes/
- **Repo:** https://github.com/Sandeep14865/tamala-homes (public). Every push to `main` deploys through `.github/workflows/pages.yml`.

## Stack and layout

React 18 single-page app built with Vite 6 (plain JSX, no TypeScript), Framer Motion for animation, Lenis for smooth wheel scrolling, three.js for the 3D tower and floor plans.

| File | What it holds |
|---|---|
| `src/App.jsx` | Router, intro, page curtain |
| `src/lib.jsx` | History router (`BASE`, `Link`, `navigate`), motion helpers (`Words`, `Rise`, `Picture`, `Magnetic`, `Counter`), springs |
| `src/components.jsx` | Nav, cursor, hero, 3D frame, visit form, footer |
| `src/Home.jsx` | Home sections: projects, map, promise, build stages, amenities, visit |
| `src/Project.jsx` | Project pages |
| `src/Orb.jsx` | The travelling turmeric shape on the home page |
| `src/fx.jsx` | Signature moments: `Dome`, `Leaf`, `Marquee`, `Giant`, `Chapter`; the leaf masks |
| `src/smooth.js` | Smooth wheel scrolling (Lenis) and the site's own scroll helpers |
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
- **Keyboard and screen readers work everywhere.** Anything you click is a real `<button>` or link (rows that do something hold a `.rows__btn`). Layers that cover the page (phone menu, photo viewer) use `useFocusTrap` from `lib.jsx`: Tab stays inside, Escape closes, focus goes back. Groups of choices that swap a view are real tabs (`role="tab"`, arrow keys, one Tab stop). Text split up for animation keeps a whole `.sr-only` copy and hides the pieces with `aria-hidden`. Style state from `aria-selected` / `aria-pressed`, not from a class alone.
- **Keep it light on phones.** Photos go through `srcSet()` in `lib.jsx` (Picture does it for you) with a `sizes` that matches the slot. The hero film is 1.9 MB on desktop and 0.7 MB on phones (H.264, no sound), skipped on Save-Data and 3G or slower, where the WebP poster stays. Google maps mount only when they come near (`useNear`).
- **Each page has its own title and link preview.** `scripts/spa-pages.mjs` writes them into every route's HTML at build time with absolute addresses (`SITE_URL`, default the Pages address). A new route goes in its list, with a 1200×630 share picture in `public/`.
- **Mobile is a first-class target.** Check every change at 390px wide as well as on desktop.

## Look (second revamp, Nov 26, 2026; the client gave free rein, so these are the current choices, not fixed rules)

- **Colours:** limewash `#f1f2ec` (background), tamala green `#0f231d` (ink, dark sections, buttons), leaf green `#2f6b52` (hover and selected text, focus ring on light), turmeric `#e0a526` (the one yellow: accents, the travelling shape, button hover sweep, focus ring on dark). The old action blue is retired; don't bring it back unless asked.
- **Type:** Instrument Serif for headings, names and big numbers, with italic accents written as `*word*` in heading text (`Words` turns them italic). Anek Latin for body and UI. The brand name itself ("Tamala Homes": nav, home hero, footer) is the heavy condensed Anek wordmark. `font-synthesis: none`, so the single-weight serif is never faked bold.
- **Home hero (`FilmHero`):** the aerial film plays inside the letters of the wordmark, which are real holes cut in the solid green ground (an SVG mask, not a blend: a blend let the film's shadows leak into the ground and made the name hard to read). A fine cream outline traces the letters until the dive starts. Scrolling dives through the l of Tamala by narrowing the SVG's viewBox (vector, so edges stay sharp at any depth) until the film fills the screen, then it leaves as a card under the projects. The film runs brighter while it is only inside the letters. Project pages keep the photo hero (`Hero`) with the name in serif.
- **The leaf is the window:** the intro draws a turmeric leaf while it counts, then the leaf opens as a window onto the page; between pages a green leaf grows to close the old page and the new one opens through a leaf (`APERTURE` / `LEAF` masks in `fx.jsx`). Plain fades with less motion.
- **Smooth scrolling (`src/smooth.js`, Lenis):** mouse and trackpad only, off for touch and for less motion; paused while the menu or the photo viewer is open. Every scroll the site makes goes through `scrollToY` / `scrollToEl`.
- **Film grain:** a fine animated grain over everything (`.grain`), still on touch and with less motion, gone with more contrast.
- **Map:** the Google embed, toned toward the palette (desaturated, warm) and in full colour on hover.
- **Visit form:** the day is chosen from the next twelve days as a row of real radio buttons (arrow keys move), not a date box.
- **Build stages:** the heading and the four stage titles are turmeric; photos change with a wipe, never a blend.
- **Contrast:** text must pass WCAG AA (muted grey is `#56665e`). The one exception is turmeric text on the light background, the client's choice.
- **Enquiries go through WhatsApp:** the visit form and the "Ask about this flat" button open a pre-filled WhatsApp message; email is only a fallback link.
- **Floor plans add up:** carpet area is worked out from the drawn rooms and shown next to the balcony and the super built-up figure. Wall tops are drawn dark, like a plan.
- **Raised sheets:** cards and panels float above the page, sharing `--sheet`, `--lift` and `--edge`. Things you click as a whole (project cards, gallery photos) lean toward the mouse (`Tilt` / `useTilt`); maps and 3D views you drag stay level.
- **Signature moments (`src/fx.jsx`):** chapter lines on every heading (`Head chapter={[n, 'Name']}`), dark sections rising on a curved edge (`Dome`), the promise photo opening out of the leaf (`Leaf`), one giant italic word measured to the width (`Giant`), marquee bands alternating serif italic and condensed caps (`Marquee`), the footer name over towers at dusk.
- **Nav:** a full-width bar over the hero; past it, a floating glass capsule.
- **Amenities:** round photos that roll in; a swipe row on phones.
- **Travelling shape (`Orb.jsx`):** one turmeric shape follows the home page, resting at `<Spot shape="..."/>` markers. It sits on the page (absolute, page coordinates), holds still at full size for the first and last fifth of each gap and glides through the middle. All shapes rest at one size (136px desktop, 68px phone). Desktop: the section name curves round inside the shape in pure black. Phone: a one-word cream tag slides out beside it.

## How to check a change

1. Run the dev server and look at the change at 1440×900 and at 390×844.
2. No errors in the console.
3. For motion, scroll through it, including a fast flick and a jerky wheel; one still frame doesn't show motion problems.
4. Before a risky experiment, tag the current commit (for example `git tag amenities-list-version`) so going back is one step.
5. After pushing, confirm the Pages run passed (`gh run list -L1`) and the change is in the live bundle.
