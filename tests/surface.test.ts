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
