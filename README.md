# Yujin Kim: portfolio

A frontend-only portfolio with four pages: Me, Art, Music, and Research.
The design follows [the design plan](notes/design_plan.md) and
[the structural requirements](notes/structural_requirements.md).

## Run and verify

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
npm run preview
```

Tests use Node's built-in TypeScript support and test runner. Use Node 22.18+
or a current Node 24 release. Vite 8 also requires a supported recent Node release.

## Implemented

- Four top-level destinations, direct artwork detail URLs, and a not-found view.
- Selected-artwork view transitions with a 760ms image handoff and staged
  surrounding-page fades. Unrelated images stay in the page snapshot, not separate layers.
  Those snapshots are fixed to the screen, so a deliberate scroll ends the transition
  rather than pinning the image to the viewport and snapping it back when it completes.
  Ordinary navigation is used under reduced motion or in unsupported browsers.
- Per-history-entry scroll and focus restoration.
- Responsive artwork collection with hover/focus descriptions and touch disclosures.
- One full artwork image with facts alongside it, without a redundant lower detail section.
  A native modal inspector provides zoom, keyboard panning, Escape, and focus return, and
  shares its dialog behavior (open, scroll lock, focus return, Escape, backdrop close)
  with the resume and preview notices.
  The artwork view is chrome-free: no header navigation and no footer, with **Back to Art**
  alone at the top left. The work itself is the inspect control, so nothing is drawn over
  the image: its cursor hint reads **Inspect**, and its accessible name stays
  **Inspect work**. The complete image is scaled to the room the viewport has left instead
  of to its grid column, so it stays uncropped and needs no scroll to be seen whole.
- Muted visibility-aware featured-video playback and single-audio behavior. The video
  frame itself is the play/pause control — hovering shows the hint and pressing toggles —
  with a small draggable progress bar beneath it and a square sound control in the corner.
- Recording disclosures, project sections, GHP, and paper widgets.
- Persistent System / Light / Dark themes, semantic navigation, and skip-to-content.
- Self-hosted Space Grotesk, image loading placeholders, and contextual media errors.
- Lenis smooth wheel scrolling, with native touch and synchronized history restoration.
- A spring-follow custom cursor that expands into contextual input hints.
- Magnetic controls, subtle portrait/close-up depth, staggered type entrances,
  layered document panels, and more expressive media reveals.
- A top-anchored, scroll-fading GLSL hero on Me, built from the new reference pattern in
  the hero's own warm gold, with a cursor dither that stays sharp under the pointer and a
  decaying wake, dissolving into the section below rather than ending on an edge.
- Ambient color fields and theme-aware grain behind all content, an accent that eases
  between destinations, and a CSS scroll-driven hairline.
- Pointer-lit paper panels, hover-reactive navigation, and an accent on the video sound control.
- All visible copy, media, layout choices, and colours parsed from commented files under
  [content/](content): the spine, one file per page, the collection, and the theme, with
  curated per-section options and load-time validation that names the exact file and
  setting to fix.

## Content status

**This is a working preview, not a publish-ready record of Yujin's practice.**

The images are still reference material: the portrait and supporting photographs are
stock references from Unsplash, and the four paintings are public-domain images from the
Art Institute of Chicago, with their actual artists, titles, dates, and materials.
No biography, credentials, paper findings, or performance history is invented.

The site itself no longer carries third-party rights notices. The per-work reference
markers, the collection notice, the artwork-page notice, the preview dialog's credit
list, the recording photo note, and the video's demo caption were removed as the content
moves to Yujin's own material. The images are untouched, and each artwork keeps its
**Museum source** link, which is now the only provenance the interface shows.

The resume and both research papers link to placeholder PDFs in `public/media`, so every
action on the site leads somewhere real while the approved files are prepared. The lower
recording slots stay honestly empty until their sources are configured.

### The content files

Every word, image, link, layout choice, and colour lives in a commented file under
[content/](content), written for a non-technical editor: a note above each block, one
setting per line, and the allowed values written beside the setting they belong to.

| File | Holds |
| --- | --- |
| [content/site.yaml](content/site.yaml) | Identity, preview state, navigation, `layout`, `messages`, `recordings`, `papers`, and the two notices |
| [content/theme.yaml](content/theme.yaml) | Every colour the site uses, in both modes |
| [content/artworks.yaml](content/artworks.yaml) | The collection: one block per work |
| [content/pages/](content/pages) `home`, `art`, `music`, `research`, `not-found` | One page's copy per file |

The spine says where the other files are, so an editor only has to find this table once.
Copy an `artworks` block to add a work, delete one to remove it, and leave a field empty to
empty it.

```yaml
layout:
  art:
    # Which side of the featured work the separate close-up panel takes.
    # left | right
    close_up_side: right
```

- `site.name`, `site.tagline`: the identity in the header, footer, and browser tab.
- `preview.enabled`: leave it `true` while reference material is shown. Set it to `false`
  only after every reference image, recording, and provisional sentence is replaced.
  `preview.resume_url` points at the placeholder `/media/resume.pdf`; swap in the approved
  PDF or an approved external URL, or empty it and the header says the resume is missing.
- `content/pages/*.yaml`: the copy for one page each, including headings, introductions,
  captions, alt text, and the honest unavailability notes. A page names the work it
  features by `slug`, so that slug has to exist in `artworks.yaml`. The Me heading also
  takes an optional `heading_attribution`, a small grey credit beside it for a quote's
  author or a source; leave it empty and nothing shows.
- `artworks.yaml`: one block per work, with truthful `title`, `artist`, `year`, `material`,
  `description`, `alt`, intrinsic `width`/`height`, `reference`, and `size`. Reference
  images use the Art Institute's `image_id`; Yujin's own work uses `image: /media/work.webp`
  with optional `src_set`, `close_up`, and `high_resolution`.
- `recordings`, `papers`, `dialogs` (in `site.yaml`): the recording slots, the
  research-paper panels, and the two prototype notices. `papers.*.url` points at
  placeholder PDFs for now; leave `src`, `url`, and `citation` empty and the panels say so
  honestly instead.
- `messages`: sentences shown while something has not been supplied yet.

Put approved files in `public/media` and refer to them as `/media/portrait.webp`. The
portrait already lives there, so it survives a production build.

### Image decks

A picture can be a single image or a **deck** the reader cycles through. A block with
`image:`/`alt:` shows one picture; replace those two settings with an `images:` list and
pressing the picture advances to the next entry and wraps at the end, while hovering it
shows the cursor hint **Next image**. A list of one is simply a single picture, and a block
that sets both `image` and `images` fails to load rather than half-reading.

```yaml
# content/pages/research.yaml
project:
  images:
    - image: /media/project-1.webp
      alt: First view of the project.
    - image: /media/project-2.webp
      alt: Second view of the project.
```

[ImageDeck](src/components/ImageDeck.tsx) renders the list anywhere a block is read with
`pictures(...)`, so another surface gains a deck by listing more entries in its content
file alone — the surrounding CSS decides the slot it fills. The control is a transparent
button over the frame, so nothing is drawn over the image and the cursor hint and focus
ring carry the affordance. Up to two of the next cards peek out behind the frame, edge
only, so the deck reads as a stack there is more to leaf through. The Research page ships
two demos: the project image and each smaller project.

### Colours

[content/theme.yaml](content/theme.yaml) owns colour outright. It holds, in both modes, the
page surface and raised surface, text and secondary text, hairlines, the focus ring, the
scrim behind a dialog, one accent per destination, the ink that sits on an accent, and the
Me hero's own two gold stops: `atmosphere.deep` for the denser fold of the pattern and
`atmosphere.warm` for the veil over it, which is also the wash behind the canvas. No colour
in the stylesheet is outside the file's reach.

The stylesheet keeps the same values so the first paint is already correct before any
JavaScript runs. [tests/theme.test.ts](tests/theme.test.ts) fails when the two drift, and
the file says which block to copy across. [apply-theme.ts](src/lib/apply-theme.ts) writes
the resolved mode onto the document; **System** follows the operating system and repaints
when that preference changes.

### Layout choices

`layout` (in [content/site.yaml](content/site.yaml)) offers a curated value per section
rather than free-form composition. Every combination is one of the designed arrangements,
so no choice needs new CSS.

| Setting | Values | Effect |
| --- | --- | --- |
| `layout.home.teaser_order` | `music_first`, `research_first` | Which teaser row comes first |
| `layout.home.show_art_teaser` | `true`, `false` | Hides the "Look a little closer" section |
| `layout.home.show_registers` | `true`, `false` | Hides the Music and Research teaser rows |
| `layout.art.close_up_side` | `left`, `right` | Mirrors the featured work and its close-up pane |
| `layout.music.feature_side` | `left`, `right` | Which side the featured film takes |
| `layout.music.show_topics` | `true`, `false` | The practice words under the experience text |
| `layout.detail.copy_side` | `left`, `right` | Which side an artwork page's facts take |
| `artworks[].size` | `large`, `small`, `offset`, `wide` | Room a work takes in the collection |
| `artworks[].crop` | `horizontal% vertical%` | Which part of the work the close-up shows |

Mirrored and reordered compositions are desktop-only: below 768px every section is one
column in semantic reading order, as [the design plan](notes/design_plan.md) requires.
Adding a fourth recording still lands in a deliberate column rather than a bare grid cell.

The files are validated as they load. A missing field, a value outside its allowed set, a
misspelled setting, a repeated slug, a colour that is not a colour, a featured work or
paper that does not exist, and a GHP pair that is not exactly two images each fail with the
exact file and setting, for example
`content/site.yaml → layout.art.close_up_side: must be one of: left, right (found "centre")`
and
`content/pages/research.yaml → project.paper: points at a paper named "poject", which content/site.yaml does not define under papers`.
A mistake in one file never reports another file's name.

Parsing costs about 12KB gzipped (`yaml`). The app imports each file as text and parses it
through [site-content.ts](src/lib/site-content.ts) and
[theme-content.ts](src/lib/theme-content.ts), which share the validation vocabulary in
[content-schema.ts](src/lib/content-schema.ts); [content.ts](src/content.ts) is the typed
result the pages read. Content that describes the prototype itself stays in code:
the action labels Resume, Inspect work, Open paper, Play, Pause, Mute, Retry, and Back to
Art, and the theme control, because the design contract fixes one name per action.

## Architecture

- React 19, TypeScript, Vite 8, and Tailwind CSS v4.
- No backend or routing package. Lenis handles scrolling and Motion handles cursor springs.
- [src/App.tsx](src/App.tsx): shared shell, navigation, themes, metadata, preview/resume dialogs.
- [content/](content): the spine, the collection, one file per page, and every colour.
- [src/pages.tsx](src/pages.tsx): page compositions and artwork details.
- [src/content.ts](src/content.ts): the parsed, typed content the pages read.
- [src/lib/content-schema.ts](src/lib/content-schema.ts): the validation vocabulary the content files share.
- [src/lib/site-content.ts](src/lib/site-content.ts): the spine, page, and collection formats, plus image helpers.
- [src/lib/theme-content.ts](src/lib/theme-content.ts): the colour format.
- [src/lib/apply-theme.ts](src/lib/apply-theme.ts): that format, applied to the document's custom properties.
- [src/index.css](src/index.css): theme tokens, layouts, layers, and motion.
- [src/lib/router.ts](src/lib/router.ts): history, view transitions, and focus/scroll restoration.
- [src/components/Media.tsx](src/components/Media.tsx): images and artwork inspection.
- [src/components/ImageDeck.tsx](src/components/ImageDeck.tsx): a picture list the reader cycles through, reused wherever the content offers one.
- [src/components/useModalDialog.ts](src/components/useModalDialog.ts): the native modal behavior both overlays share.
- [src/components/VideoPlayer.tsx](src/components/VideoPlayer.tsx): media playback.
- [src/components/Experience.tsx](src/components/Experience.tsx): smooth scrolling and contextual cursor.
- [src/lib/interaction-policy.ts](src/lib/interaction-policy.ts): pointer eligibility, hints, and bounded effects.
- [src/lib/scroll-controller.ts](src/lib/scroll-controller.ts): scroll-engine/history bridge.
- [tests/interaction-policy.test.ts](tests/interaction-policy.test.ts): hint and pointer calculations.
- [tests/scroll-controller.test.ts](tests/scroll-controller.test.ts): scroll registration and cleanup.
- [tests/work-transition.test.ts](tests/work-transition.test.ts): selected-work isolation and transform-only handoffs.
- [tests/routes.test.ts](tests/routes.test.ts): route resolution and browser-native link behavior.
- [tests/router.test.ts](tests/router.test.ts): actual history routing with mocked browser APIs,
  focus/scroll restoration, reduced motion, interruption, and transition cleanup.
- [tests/media-policy.test.ts](tests/media-policy.test.ts): autoplay, visibility, and playback error policies.
- [tests/content.test.ts](tests/content.test.ts): local assets, responsive sources, and preview-content defaults.
- [tests/theme.test.ts](tests/theme.test.ts): the colour format, its validation, and the
  stylesheet fallback staying in step with the theme file.
- [tests/content-file.test.ts](tests/content-file.test.ts): content-file guidance, curated layout
  choices reaching the page, and the validation messages an editor sees.

Keep `@/` imports and semantic CSS variables. Three.js is lazy-loaded only for the
requested Me atmosphere, and it is imported directly: there is no React Three Fiber or
Drei layer in between. Tailwind is present for its reset and preflight, so pages use
semantic classes rather than utility strings and need no class-merge helper.

## Interaction prototype

The custom cursor and smooth-scrolling layer were explicitly requested as a
prototype extension to the original plan. Hover artwork links for **View work**,
the artwork on its own view for **Inspect**, a video for **Play**/**Pause**, its corner
control for **Play sound**/**Mute**, and paper links for **Read paper**. `data-cursor`
supplies the hint, `data-magnetic` adds a bounded 7px pull, and `data-depth` adds subtle
perspective feedback.

The cursor previews where a link leads: hovering a navigation item takes on that
destination's accent — gold for Art, plum for Music, teal for Research — instead of
the accent of the page it happens to sit on. External, hash, query, and unknown targets keep the
current page accent.

The cursor starts once and stays started: pointer tracking owns no route state, so a
navigation never restarts it. That matters for the artwork handoff, where the 760ms
animation is exactly the window in which a restarted tracker would leave the cursor
hidden until the next pointer move. Re-reading what sits under the pointer also ignores
a point that resolves to nothing, because a View Transition briefly reports none, and
that is not the pointer leaving.

Cursor movement uses Motion values, not React state on every pointer frame.
The native cursor returns for touch, keyboard navigation, editable controls,
and modal dialogs. Labels and normal controls still work without the cursor.
Lenis keeps native touch scrolling, pauses for dialogs, and resets immediately
on navigation instead of continuing old momentum. Existing reduced-motion
fallbacks are retained. No browser visual review was performed for this pass.

## Surface & flow

The flat surface stays quiet but alive. Two very low-alpha color fields drift
behind everything (`body::before`) with a fine, theme-aware grain over the same
layer (`body::after`, a masked noise tile tinted with `--text`). Both live at
z-index -1, never intercept input, and never sit over text or artwork.

The accent itself carries the flow: it is a registered `<color>` custom
property, so navigation eases it over 800ms between the rust identity of Me, the muted
gold of Art and its detail views, the muted plum of Music, and the muted teal of
Research. Gold is a light accent, so it carries a dark `--accent-ink` for the cursor
label while the darker accents keep the light ink. Nav
underlines, the cursor disc, and the scroll hairline all follow the drift; the Me
hero keeps its own fixed gold instead, so the atmosphere reads yellow without
claiming a destination's identity.

A 2px hairline at the top fills with scroll progress using CSS scroll-driven
animations (`animation-timeline: scroll()`): no JavaScript, and it rests at zero
wherever the feature or reduced motion is absent. The native document scrollbar is
hidden (`scrollbar-width: none` plus a `::-webkit-scrollbar` rule) so the hairline is
the only progress affordance. That hiding is nested in `@supports (animation-timeline:
scroll())`, so a browser that cannot drive the hairline keeps its scrollbar rather than
losing every progress cue. Wheel, touch, and keyboard scrolling are untouched, and no
scrollbar gutter is reserved, which keeps the full-bleed layers exact. Scroll containers
inside dialogs keep their own scrollbars. Page arrivals settle with a
small lift and blur applied to the view-transition snapshot only — live content
never filters. Dialog backdrops blur softly behind them.

## Shader atmosphere

[MeAtmosphere.tsx](src/components/MeAtmosphere.tsx) draws a non-interactive background
anchored to the top of the document, ending at the Me hero's bottom, where it dissolves
into the section below instead of stopping on a line. The canvas is opaque, so without
that fade it would hide the page's own ambient wash and grain for the whole hero and
bring them back at the boundary; a gradient mask carries the layer to transparent over
its last fifth, so the page continues underneath and the seam disappears. It is not a
fixed or sticky viewport layer. Measurement spans it the full viewport width,
edge to edge, instead of the capped 1544px shell. Motion scroll values hold full opacity for the
first 12% of its height, then smoothly fade it to zero by 82%; scrolling back
restores it. A ResizeObserver tracks responsive hero and shell dimensions.

The pattern adapts [the new hero reference](inspiration/new_heroshader.txt): a
fixed-point iteration that walks a point through a nest of cosines and accumulates
how far it drifted, which way it turned, and how fast it decayed. Those three sums
become the reference's relief-lit density — a screen-space normal bent by the
density slope, then the reference's own soft tonemap — which here decides how much
pigment shows rather than painting a picture. A held cursor dithers the pattern
instead: it is rounded to a few steps, cell by cell, with a 4x4 ordered threshold
deciding which side of a step each cell lands on, so the tone breaks into a stipple
rather than a band. The lens reads brighter and higher in contrast than the wash around it,
because a mark that only echoes its surroundings is not a mark: each cell is pushed away from
the pattern's own value — which separates the five steps without moving the region's mean
tone — and the lens shows more pigment through a gain. That stipple is the one thing in the
hero that is not soft-focused: the display pass runs at the canvas's own resolution, so a
cell lands on the pixel grid, and the blur the pattern carries lifts inside the cursor's disc
instead of softening the mark with it. The effect falls away with distance and its reach is half the radius
of the swirl it replaced, so it reads as something under the pointer rather than a field
across the hero. One pass advects a decaying cursor wake in one RGBA8 target; the wake
nudges the pattern and shows as a faint mist where the pointer has been. Pointer
input uses document-local coordinates, accounting for scroll and centered-page
gutters. Scrolling does not inject false cursor velocity. This remains a lightweight
feedback effect, not a pressure-solved fluid solver.

The GLSL sources are [the flow shader](src/shaders/atmosphere-flow.frag),
[the pattern shader](src/shaders/atmosphere-pattern.frag) and
[the display shader](src/shaders/atmosphere-display.frag). The pattern is its own pass at
the layer's low edge, because its hundred steps are the one real cost in the effect; the
display pass never pays for them, which is what lets it afford a full-resolution lens over
a mean field. The hero carries its own
warm gold, set by `atmosphere.deep` and `atmosphere.warm` in
[content/theme.yaml](content/theme.yaml) and kept separate from the destination accents so
it can read yellow without claiming Art's identity or moving Me's rust; both stops are
mode-aware. The reference's AA supersampling and its vivid
cosine palette are deliberately not used: the layer already renders small and is
upscaled soft, and the site wants a whisper, not an image.

The shader runs at a maximum of 30fps with DPR 1, and the pattern keeps a 224px longest
rendering edge. Linear upscaling is deliberately soft; the low resolution is part of the
look, not just a budget. The soft focus now lives in the display pass rather than in the
stylesheet, because a CSS blur covers a whole element and would soften the cursor's stipple
along with the pattern: `--atmosphere-blur` (16px) still declares the softness, the
component converts it into pattern texels, and a nine-tap Gaussian at that radius reproduces
what the filter used to do. The canvas is drawn slightly oversized, with the layer clipping
the overflow so the blurred edge never falls short of the viewport. The display canvas
itself runs at the viewport's own size, capped at `ATMOSPHERE_LENS_MAX_EDGE` (1920px), so
the dither lands on the pixel grid; the pattern texture is upscaled into it. Tune the
softness by that one value. Colors come from theme tokens; images and
text remain unaffected. Rendering pauses once faded out, while the tab is hidden,
a dialog is open, or a page transition is active. Reduced motion renders a static
field with no cursor warping. Failed WebGL contexts leave an anchored, fading CSS
fallback. All targets, materials, geometry, observers, subscriptions, listeners,
and the renderer are cleaned up on unmount.

The reference's hundred steps are kept, which is the one real cost here; the small
rendering edge, and the separate pass that holds them, are what make that affordable, and
`HERO_STEPS` in the pattern shader is the knob if a weaker device ever complains. Tune
budgets and scroll fade in
[atmosphere.ts](src/lib/atmosphere.ts), the two gold stops in
[content/theme.yaml](content/theme.yaml), and the density and the three `DITHER_` values in
[the display shader](src/shaders/atmosphere-display.frag) — `DITHER_FALLOFF` is the reach
(each fourfold increase halves it), `DITHER_CELL` the cell size in render pixels, and
`LENS_CONTRAST` and `LENS_GAIN` how much brighter and more contrasty the cursor's mark is
than the wash (both 1.0 for no change). The deferred Three.js/shader chunk is
approximately 139KB gzipped; Vite reports its uncompressed size above 500KB.
[Shader tests](tests/atmosphere.test.ts) verify budgets, document-local inputs,
fade progression, lifecycle policy, the reference's structure, the pointer dither, the
soft focus that now lives in the shader rather than the stylesheet, and the
hero's warm palette. They do not compile GLSL on a GPU or verify final appearance; those checks
remain pending user feedback.

The previous marble hero is kept, unbuilt and untested, in
[archive/atmosphere-marble](archive/atmosphere-marble), with notes on restoring it.

## Hosting

Deploy the generated `dist` directory. Configure the host to rewrite application
paths to `index.html` so refreshes and direct links work at `/art`, `/music`,
`/research`, and `/art/:slug`. The Vite development server already provides this fallback.

### GitHub Pages

[.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) builds and
publishes `dist` on every push to `master` (and on manual dispatch). Enable it once in the
repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The
workflow runs `npm test` before the build so a red test blocks the deploy.

The Pages base path is resolved at run time by `actions/configure-pages` and passed to
Vite as `--base`, so a project site (`https://<user>.github.io/<repo>/`) and a user/org
root site both work without setting `base` in [vite.config.ts](vite.config.ts). Because
Pages has no SPA rewrite, the workflow copies `index.html` to `404.html`, which lets the
client router serve the app shell for deep links.

No production deployment has been performed. Before public launch, replace
preview material, verify permissions, supply route-specific sharing metadata,
and audit performance/accessibility on the chosen host. Screenshot review was
intentionally left to the user, and further preview interaction checks were
replaced by automated tests at the user's request. Mocked tests do not verify
native dialog behavior, decoding, layout, or screen-reader output. Lighthouse
and cross-browser/mobile-device checks remain launch tasks, not claimed as passed.
