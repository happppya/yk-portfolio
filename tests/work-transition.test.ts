import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { scrollEndsTransition, transitionWork, workTransitionFrames } from '../src/lib/work-transition.ts'

test('only collection-to-work and work-to-collection navigation selects an image', () => {
  // Art lives at the front page, so both / and /art are the collection.
  assert.equal(transitionWork('/art', '/art/work-01'), 'work-01')
  assert.equal(transitionWork('/', '/art/work-01'), 'work-01')
  assert.equal(transitionWork('/art/work-01', '/'), 'work-01')
  assert.equal(transitionWork('/art/work-01/', '/art/'), 'work-01')
  assert.equal(transitionWork('/music', '/art/work-01'), undefined)
  assert.equal(transitionWork('/art/work-01', '/art/work-02'), undefined)
  assert.equal(transitionWork('/art', '/research'), undefined)
})

test('artwork handoff animates position and scale, never width or height', () => {
  const frames = workTransitionFrames({ x: 12, y: 20, width: 400, height: 300 }, { x: 60, y: 90, width: 800, height: 600 })!
  assert.equal(frames[0].width, frames[1].width)
  assert.equal(frames[0].height, frames[1].height)
  assert.equal(frames[0].transform, 'translate(12px, 20px) scale(0.5, 0.5)')
  assert.equal(frames[1].transform, 'translate(60px, 90px) scale(1)')
})

test('a deliberate scroll ends the screen-space choreography instead of pinning the image', () => {
  assert.equal(scrollEndsTransition(0, 0), false)
  assert.equal(scrollEndsTransition(0, 7), false)
  assert.equal(scrollEndsTransition(0, 8), true)
  assert.equal(scrollEndsTransition(0, -40), true)
  assert.equal(scrollEndsTransition(1200, 1192), true)
  // Non-finite positions cannot claim a scroll happened.
  assert.equal(scrollEndsTransition(NaN, NaN), false)
  assert.equal(scrollEndsTransition(Infinity, Infinity), false)
})

test('unmeasurable images do not create invalid transforms', () => {
  assert.equal(workTransitionFrames({ x: 0, y: 0, width: 0, height: 30 }, { x: 0, y: 0, width: 80, height: 60 }), undefined)
})

test('the artwork view keeps Back to Art at the top left and inspects from the work itself', () => {
  const pages = readFileSync(new URL('../src/pages.tsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const bar = pages.match(/<div className="detail-actions[^>]*>([\s\S]*?)<\/div>/)![1]
  // Inspecting moved onto the artwork, so the bar carries the back control alone, at the left.
  assert.match(bar, /className="button button-quiet back-link"/)
  assert.doesNotMatch(bar, /Inspect work/)
  assert.doesNotMatch(pages, /inspect-trigger/)
  assert.match(css, /\.detail-actions \{[^}]*justify-content: flex-start;/)
  assert.match(css, /\.button-quiet \{[^}]*border: 1px solid var\(--line\);/)
  // The work is the inspect target: cursor hint, accessible name, and a real click target.
  assert.match(pages, /className="detail-inspect"/)
  assert.match(pages, /data-cursor="Inspect"/)
  assert.match(pages, /aria-label=\{`Inspect work: \$\{work\.title\}`\}/)
  assert.match(pages, /onClick=\{\(\) => setInspecting\(true\)\}/)
  assert.match(css, /\.detail-inspect \{ position: absolute; inset: 0;/)
  // No navigation and no footer on this view, so nothing pushes the work below the fold.
  assert.match(app, /\{route\.page !== 'detail' && <header className="site-header">/)
  assert.match(app, /\{route\.page !== 'detail' && <footer className="site-footer">/)
  // The complete work is scaled to the viewport rather than the column, so nothing is cropped.
  assert.match(css, /\.detail-image \{ display: flex; justify-content: center; --detail-room: max\(240px, 100dvh - 220px\); \}/)
  assert.match(css, /\.detail-image-frame \{ position: relative; width: min\(100%, calc\(var\(--detail-room\) \* var\(--image-ratio-v, 1\)\)\); \}/)
  // Narrow screens keep the same top-left control instead of stretching it full width.
  assert.match(css, /\.detail-actions \{ margin-top: 20px; margin-bottom: 24px; \}/)
})

test('artworks use opt-in metadata, not persistent snapshot names, and omit duplicate detail section', () => {
  const pages = readFileSync(new URL('../src/pages.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(pages, /viewTransitionName|detail-closeup|closeup-heading/)
  assert.match(pages, /workSlug=\{work\.slug\}/)
  assert.match(pages, /<Inspector work=\{work\}/)
})
