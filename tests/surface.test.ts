import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

test('the accent is a registered color that drifts per destination', () => {
  assert.match(css, /@property --accent \{[^}]*syntax: '<color>'[^}]*inherits: true/)
  assert.match(css, /:root \{[^}]*transition: --accent /)
  assert.match(css, /:root\[data-page='music'\] \{ --accent: #[0-9a-f]{6}; \}/)
  assert.match(css, /:root\[data-page='research'\] \{ --accent: #[0-9a-f]{6}; \}/)
  // Artwork detail pages keep the collection's identity.
  assert.match(app, /dataset\.page = route\.page === 'detail' \? 'art' : route\.page/)
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

test('page arrivals settle on the transition snapshot, never on live elements', () => {
  assert.match(css, /@keyframes page-in \{ from \{ opacity: 0; transform: translateY\(10px\); filter: blur\(8px\); \} \}/)
  assert.match(css, /::view-transition-new\(root\) \{ animation: 400ms [^}]*page-in; \}/)
})
