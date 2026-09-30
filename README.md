# Atelier — art portfolio

Frontend-only portfolio for generative / real-time artwork. No backend: content is
static TypeScript data, the visuals are WebGL.

## Stack

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite`, no config file — theme lives in `src/index.css`)
- **Three.js** + **@react-three/fiber** + **@react-three/drei** for canvas work
- **GLSL** shaders in standalone `.vert` / `.frag` files, imported with `?raw`
- **oxlint** for linting

## Commands

```bash
npm run dev      # dev server
npm run build    # typecheck + production build
npm run preview  # serve the production build
npm run lint     # oxlint
```

## Conventions

- Import via the `@/` alias (`@/components/...`, `@/shaders/...`).
- Shaders live in `src/shaders/` as raw GLSL. `src/vite-env.d.ts` declares the
  `?raw` module types.
- **Shaders use the GLSL1 dialect** (`varying`, `gl_FragColor`) and do *not*
  declare `position`, `uv`, or `precision` — Three.js injects those. Redeclaring
  them causes a silent link failure that surfaces only as
  `WebGL: INVALID_OPERATION: drawElements: no valid shader program in use`.
- `<Canvas>` renders a wrapper with inline `position: relative`, which beats a
  Tailwind `absolute` class. To position a canvas, wrap it in your own
  `absolute inset-0` div and give the canvas `h-full w-full`.
- Design tokens are CSS custom properties in the `@theme` block: `ink-*` for
  neutrals, `accent-*` for highlights. Use them instead of raw Tailwind colors.
- `cn()` from `@/lib/cn` merges conditional classes and resolves Tailwind conflicts.

## Layout

```
src/
  components/
    ArtworkGrid.tsx
    canvas/FlowCanvas.tsx   # R3F + GLSL example
  data/projects.ts          # artwork content
  lib/cn.ts
  shaders/flow.{vert,frag}  # example shader pair
  App.tsx
  index.css                 # Tailwind import + theme
```
