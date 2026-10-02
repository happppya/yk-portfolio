import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const cursor = readFileSync(new URL('../src/components/Experience.tsx', import.meta.url), 'utf8')

test('the accent is a registered color that drifts per destination', () => {
  assert.match(css, /@property --accent \{[^}]*syntax: '<color>'[^}]*inherits: true/)
  assert.match(css, /:root \{[^}]*transition: --accent /)
  // One source of truth per identity, reusing the same value for the page and the cursor.
  assert.match(css, /--accent-me: #[0-9a-f]{6};/)
  assert.match(css, /--accent-art: #[0-9a-f]{6};/)
  assert.match(css, /--accent-music: #[0-9a-f]{6};/)
  assert.match(css, /--accent-research: #[0-9a-f]{6};/)
  assert.match(css, /:root\[data-page='art'\] \{ --accent: var\(--accent-art\); --accent-ink: var\(--accent-ink-dark\); \}/)
  assert.match(css, /:root\[data-page='music'\] \{ --accent: var\(--accent-music\); \}/)
  assert.match(css, /:root\[data-page='research'\] \{ --accent: var\(--accent-research\); \}/)
  // Artwork detail pages keep the collection's identity.
  assert.match(app, /dataset\.page = accentKey\(route\.page\)/)
})

test('the cursor previews the accent of the destination a hovered link leads to', () => {
  // Each destination carries the accent and its ink together, so a preview on a light-accent
  // page cannot inherit the wrong ink.
  assert.match(css, /\.experience-cursor\[data-accent='me'\] \{ --accent: var\(--accent-me\); --accent-ink: var\(--accent-ink-light\); \}/)
  assert.match(css, /\.experience-cursor\[data-accent='art'\] \{ --accent: var\(--accent-art\); --accent-ink: var\(--accent-ink-dark\); \}/)
  assert.match(css, /\.experience-cursor\[data-accent='music'\] \{ --accent: var\(--accent-music\); --accent-ink: var\(--accent-ink-light\); \}/)
  assert.match(css, /\.experience-cursor\[data-accent='research'\] \{ --accent: var\(--accent-research\); --accent-ink: var\(--accent-ink-light\); \}/)
  // Unknown or external targets clear the attribute, so the page accent stands.
  assert.match(cursor, /element\.dataset\.accent = linkAccent\(next\?\.closest\('a\[href\]'\)\?\.getAttribute\('href'\)\) \?\? ''/)
  // A light accent carries dark ink so the hint label stays legible on the disc.
  assert.match(css, /--accent-ink-light: #[0-9a-f]{6};/)
  assert.match(css, /--accent-ink-dark: #[0-9a-f]{6};/)
  assert.match(css, /@property --accent-ink \{[^}]*syntax: '<color>'[^}]*inherits: true/)
  assert.match(css, /\.cursor-label \{ position: relative; color: var\(--accent-ink\);/)
  assert.match(css, /\.cursor-disc \{[^}]*border: 1px solid color-mix\(in srgb, var\(--accent-ink\) 35%, transparent\);/)
})

test('the custom cursor survives a route change, including a work transition', () => {
  // Pointer tracking owns no route state. Re-running this effect on navigation would hide the
  // cursor through its cleanup, leaving it hidden until the next pointer move, which is the
  // whole 760ms artwork animation.
  assert.doesNotMatch(cursor, /\}, \[pathname/)
  assert.doesNotMatch(cursor, /ExperienceCursor\(\{ pathname \}\)/)
  assert.doesNotMatch(app, /<ExperienceCursor pathname=/)
  // An unresolved point is not the pointer leaving: a View Transition briefly reports nothing
  // under it, and treating that as a departure is what hid the cursor mid-animation.
  assert.match(cursor, /const syncAt = \(atX: number, atY: number\) => \{/)
  assert.match(cursor, /if \(at\) updateTarget\(at\)/)
  assert.doesNotMatch(cursor, /updateTarget\(document\.elementFromPoint/)
  assert.match(cursor, /const syncHover = \(\) => \{ if \(visible\) syncAt\(lastX, lastY\) \}/)
  assert.match(cursor, /const up = \(\) => \{ press\.set\(1\); syncAt\(lastX, lastY\) \}/)
  // The named cursor group is excluded from the snapshot cross-fade, so it never blinks.
  assert.match(css, /::view-transition-old\(interaction-cursor\) \{ display: none; \}/)
  assert.match(css, /::view-transition-new\(interaction-cursor\) \{ animation: none;/)
})

test('the atmosphere divides the Me hero from the section below it, not a hairline', () => {
  // The canvas is document-anchored and ends at the hero's bottom, so its fade is the edge.
  const hero = /^\.me-hero \{([^}]+)\}/m.exec(css)![1]
  const below = /^\.me-art \{([^}]+)\}/m.exec(css)![1]
  assert.doesNotMatch(hero, /border/)
  assert.doesNotMatch(below, /border/)
  assert.match(css, /\.me-atmosphere \{[^}]*inset: 0 0 auto; height: 100dvh;/)
})

test('modal dialogs stay centred instead of anchoring to the top left', () => {
  // A modal dialog is laid out inside an `inset: 0` box and centres itself with auto
  // margins, so a blanket `margin: 0` (Tailwind's preflight) pins it to the top left.
  const base = /^dialog \{([^}]+)\}/m.exec(css)![1]
  assert.match(base, /margin: auto;/)

  // Both overlays keep an explicit box, so the centring margins are what place them.
  assert.match(css, /\.inspector \{ width: calc\(100vw - 48px\); height: calc\(100dvh - 48px\); max-width: 1600px; max-height: none;/)
  assert.match(css, /\.info-dialog \{ width: min\(580px, calc\(100vw - 40px\)\); max-height: calc\(100dvh - 40px\); \}/)
})

test('ambient wash and grain stay behind content and never intercept input', () => {
  for (const rule of [css.match(/body::before \{([^}]+)\}/)![1], css.match(/body::after \{([^}]+)\}/)![1]]) {
    assert.match(rule, /position: fixed/)
    assert.match(rule, /pointer-events: none/)
    assert.match(rule, /z-index: -1/)
    assert.doesNotMatch(rule, /mix-blend-mode|backdrop-filter/)
  }
  // Grain is theme-aware noise, not a dark scrim over the page.
  assert.match(css, /body::after \{[^}]*background: var\(--text\)/)
  assert.match(css, /mask-image: url\("data:image\/svg\+xml/)
})

test('scroll hairline is scroll-driven, and rests at zero without support or under reduced motion', () => {
  const rule = css.match(/\.scroll-progress \{([^}]+)\}/)![1]
  assert.match(rule, /transform: scaleX\(0\)/)
  assert.match(rule, /pointer-events: none/)
  assert.match(css, /@supports \(animation-timeline: scroll\(\)\)/)
  assert.match(css, /animation-timeline: scroll\(root block\)/)
  assert.match(app, /<div className="scroll-progress" aria-hidden="true" \/>/)
})

test('the document scrollbar is hidden so the scroll hairline is the only affordance', () => {
  // Only where the custom hairline can actually be driven; otherwise the scrollbar stays.
  assert.match(css, /@supports \(animation-timeline: scroll\(\)\) \{\s*\n\s*html \{ scrollbar-width: none; \}/)
  assert.match(css, /html::-webkit-scrollbar \{ display: none; \}/)
  // No reserved gutter: the layout width matches the viewport so full-bleed layers stay exact.
  assert.doesNotMatch(css, /scrollbar-gutter/)
})

test('page arrivals settle on the transition snapshot, never on live elements', () => {
  assert.match(css, /@keyframes page-in \{ from \{ opacity: 0; transform: translateY\(10px\); filter: blur\(8px\); \} \}/)
  assert.match(css, /::view-transition-new\(root\) \{ animation: 400ms [^}]*page-in; \}/)
})
