import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { transitionWork, workTransitionFrames } from '../src/lib/work-transition.ts'

test('only collection-to-work and work-to-collection navigation selects an image', () => {
  assert.equal(transitionWork('/art', '/art/water-lilies'), 'water-lilies')
  assert.equal(transitionWork('/', '/art/improvisation'), 'improvisation')
  assert.equal(transitionWork('/art/water-lilies', '/art'), 'water-lilies')
  assert.equal(transitionWork('/art/water-lilies/', '/art/'), 'water-lilies')
  assert.equal(transitionWork('/music', '/art/water-lilies'), undefined)
  assert.equal(transitionWork('/art/water-lilies', '/art/green-center'), undefined)
  assert.equal(transitionWork('/art', '/research'), undefined)
})

test('artwork handoff animates position and scale, never width or height', () => {
  const frames = workTransitionFrames({ x: 12, y: 20, width: 400, height: 300 }, { x: 60, y: 90, width: 800, height: 600 })!
  assert.equal(frames[0].width, frames[1].width)
  assert.equal(frames[0].height, frames[1].height)
  assert.equal(frames[0].transform, 'translate(12px, 20px) scale(0.5, 0.5)')
  assert.equal(frames[1].transform, 'translate(60px, 90px) scale(1)')
})

test('unmeasurable images do not create invalid transforms', () => {
  assert.equal(workTransitionFrames({ x: 0, y: 0, width: 0, height: 30 }, { x: 0, y: 0, width: 80, height: 60 }), undefined)
})

test('artworks use opt-in metadata, not persistent snapshot names, and omit duplicate detail section', () => {
  const pages = readFileSync(new URL('../src/pages.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(pages, /viewTransitionName|detail-closeup|closeup-heading/)
  assert.match(pages, /workSlug=\{work\.slug\}/)
  assert.match(pages, /<Inspector work=\{work\}/)
})
