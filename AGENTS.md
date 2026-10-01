# Agent guide

Frontend-only Vite + React + TypeScript portfolio. Read [README.md](README.md) for
architecture and [notes/design_plan.md](notes/design_plan.md) for the design contract.
Use `npm` (`package-lock.json` is the lockfile).

## Verification: prefer code checks over the preview

Run these first. They are fast and deterministic, and they are the primary evidence
that a change works:

```bash
npm test                 # node --test, ~0.3s
npx tsc -b --noEmit
npm run lint             # oxlint
```

**Avoid interacting with preview screenshots when applicable.** In this workspace the
screenshot path is slow and unreliable: captures return stale or alternating frames
from earlier in the session, requests can fail with "no frames" because the webview is
not compositing, `requestAnimationFrame` stalls in background tabs, evaluations and
wheel/scroll actions hit their timeouts, and capture results lag DOM changes. Time
spent retrying them is almost always wasted.

When a change can be verified another way, do that instead:

- Layout, geometry, layering, overflow: one short read-only evaluation returning
  `getBoundingClientRect()`, computed styles, and `scrollWidth` vs `clientWidth`.
  A single evaluation beats a screenshot.
- Shader and WebGL behavior: check `data-ready`, console errors, canvas backing size,
  and uniforms through `getComputedStyle`. Do not chase pixels.
- Visual taste ("does it look good"): ask the user to glance at the Preview tab, or
  say plainly that you could not review it visually and name the knobs to tune.

If a visual capture is genuinely unavoidable, take at most one or two of them and stop.
Never retry in a loop, and never detach, hide, or restyle page elements to force a
capture. Leave the preview tab and its dev server running when you finish.

If you do need the browser: start a dev server on a free port, find its listener pid
(`netstat -ano | grep :<port>`), then register that url and pid as the preview. Lenis
owns scrolling, so `window.scrollTo` can be fought by it — use wheel input instead.

## Conventions

- Tests encode design decisions, including source-level policy tests
  ([tests/atmosphere.test.ts](tests/atmosphere.test.ts),
  [tests/surface.test.ts](tests/surface.test.ts)) that assert CSS and GLSL conventions.
  When a change alters a convention, update those assertions as part of the change
  rather than deleting them.
- Document user-visible work in [README.md](README.md); the shader and surface sections
  describe intent, budgets, and knobs.
- Motion: wrap animations and transitions in `@media (prefers-reduced-motion: no-preference)`;
  the global reduce rule kills the rest. Never make reduced motion depend on JavaScript.
- Layer contract: atmosphere/ambient `-1`, content `0`, header `10`, contextual `20`,
  dialogs `30`, cursor `40`. Background treatments stay behind content with
  `pointer-events: none`.
- Colors come from the semantic tokens in [src/index.css](src/index.css). Never place
  effects over artwork or text.
- Prefer editing existing files, and keep diffs minimal. Do not commit, push, or open a
  pull request unless the user asks.
