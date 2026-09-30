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
  Ordinary navigation is used under reduced motion or in unsupported browsers.
- Per-history-entry scroll and focus restoration.
- Responsive artwork collection with hover/focus descriptions and touch disclosures.
- One full artwork image with facts alongside it, without a redundant lower detail section.
  A native modal inspector provides zoom, keyboard panning, Escape, and focus return.
- Muted visibility-aware featured-video playback, manual controls, and single-audio behavior.
- Recording disclosures, project sections, GHP, and paper widgets.
- Persistent System / Light / Dark themes, semantic navigation, and skip-to-content.
- Self-hosted Space Grotesk, image loading placeholders, and contextual media errors.
- Lenis smooth wheel scrolling, with native touch and synchronized history restoration.
- A spring-follow custom cursor that expands into contextual input hints.
- Magnetic controls, subtle portrait/close-up depth, staggered type entrances,
  layered document panels, and more expressive media reveals.
- A low-resolution GLSL atmosphere on Me with cursor-driven, persistent swirls.
- Pointer-lit paper panels and hover-reactive navigation and video-control accents.

## Content status

**This is a working preview, not a publish-ready record of Yujin's practice.**

The portrait and supporting photographs are stock references from Unsplash.
The reference paintings are public-domain images from the Art Institute of
Chicago, with their actual artists, titles, dates, materials, and museum links.
The featured video is MDN's CC0 flower demo, not a musical performance.
No biography, credentials, paper findings, or performance history is invented.

The site labels preview material. Resume and paper links remain honestly
unavailable until actual files are supplied. The lower recording slots become
real players when their sources are configured.

### Replace the preview material

Start in [src/content.ts](src/content.ts). Put approved files in `public/media`
and refer to them with paths such as `/media/portrait.webp` or `/media/resume.pdf`.

- `portfolio.resumeHref`: the actual resume PDF or approved external URL.
- `portfolio.introduction`, `portrait`, `portraitAlt`, and `portraitCaption`:
  Yujin's approved introduction and portrait.
- `portfolio.music`: real featured recording, poster, caption, and `demo: false`.
- `recordings`: add `src` and optional `caption` for Bach prelude, Viola, and Concerto.
- `portfolio.papers`: add actual titles, `href` URLs, and optional citations.
- `artworks`: replace reference records. Local work images use `image`; optional
  `srcSet`, `closeUp`, and `highResolution` support optimized and detail views.
  Supply intrinsic dimensions, truthful descriptions, credits, and `reference: false`.
- Research project media and provisional page text are in
  [src/pages.tsx](src/pages.tsx). Replace them with actual content.

Set `portfolio.preview` to `false` only after replacing all reference assets and
provisional copy. Do not remove acknowledgments while stock content remains.

## Architecture

- React 19, TypeScript, Vite 8, and Tailwind CSS v4.
- No backend or routing package. Lenis handles scrolling and Motion handles cursor springs.
- [src/App.tsx](src/App.tsx): shared shell, navigation, themes, metadata, preview/resume dialogs.
- [src/pages.tsx](src/pages.tsx): page compositions and artwork details.
- [src/content.ts](src/content.ts): typed content and media configuration.
- [src/index.css](src/index.css): semantic theme tokens, layouts, layers, and motion.
- [src/lib/router.ts](src/lib/router.ts): history, view transitions, and focus/scroll restoration.
- [src/components/Media.tsx](src/components/Media.tsx): images and artwork inspection.
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

Keep `@/` imports and semantic CSS variables. Three.js is lazy-loaded only for the
requested Me atmosphere. React Three Fiber and Drei remain unused.

## Interaction prototype

The custom cursor and smooth-scrolling layer were explicitly requested as a
prototype extension to the original plan. Hover artwork links for **View work**,
inspect controls for **Zoom in**, recordings for **Play/Pause**, and paper links
for **Read paper**. `data-cursor` supplies the hint, `data-magnetic` adds a bounded
7px pull, and `data-depth` adds subtle perspective feedback.

Cursor movement uses Motion values, not React state on every pointer frame.
The native cursor returns for touch, keyboard navigation, editable controls,
and modal dialogs. Labels and normal controls still work without the cursor.
Lenis keeps native touch scrolling, pauses for dialogs, and resets immediately
on navigation instead of continuing old momentum. Existing reduced-motion
fallbacks are retained. No browser visual review was performed for this pass.

## Shader atmosphere

[MeAtmosphere.tsx](src/components/MeAtmosphere.tsx) draws a full-screen, non-interactive
background behind the Me content. The shader runs at a maximum of 30fps with
DPR 1 and a 320px longest rendering edge. Linear upscaling is deliberate.

Two RGBA8 render targets advect decaying cursor velocity and mist. Slow analytic
swirls provide ambient movement between pointer gestures. This is a lightweight
fluid-like feedback effect, not a pressure-solved physical fluid simulation.
The GLSL sources are [the flow shader](src/shaders/atmosphere-flow.frag) and
[the display shader](src/shaders/atmosphere-display.frag).

Colors come from the current theme tokens; images and text remain unaffected.
Rendering pauses when the hero is offscreen, the tab is hidden, a dialog is open,
or a page transition is active. Reduced motion renders a static field. Failed
WebGL contexts leave a subtle CSS fallback. All targets, materials, geometry,
listeners, and the renderer are cleaned up on unmount.

Tune resolution and frame rate in [atmosphere.ts](src/lib/atmosphere.ts),
and density/flow speed in the GLSL files. The deferred Three.js/shader chunk is
approximately 133KB gzipped; Vite reports its uncompressed size above 500KB.
[Shader tests](tests/atmosphere.test.ts) verify budgets, inputs, lifecycle policy,
and source conventions. They do not compile GLSL on a GPU or verify the final
visual appearance; those checks remain pending user feedback.

## Hosting

Deploy the generated `dist` directory. Configure the host to rewrite application
paths to `index.html` so refreshes and direct links work at `/art`, `/music`,
`/research`, and `/art/:slug`. The Vite development server already provides this fallback.

No production deployment has been performed. Before public launch, replace
preview material, verify permissions, supply route-specific sharing metadata,
and audit performance/accessibility on the chosen host. Screenshot review was
intentionally left to the user, and further preview interaction checks were
replaced by automated tests at the user's request. Mocked tests do not verify
native dialog behavior, decoding, layout, or screen-reader output. Lighthouse
and cross-browser/mobile-device checks remain launch tasks, not claimed as passed.
