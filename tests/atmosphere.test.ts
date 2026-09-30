import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ATMOSPHERE_FPS, ATMOSPHERE_MAX_EDGE, atmosphereSize, pointerImpulse, pointerUv, shouldRenderAtmosphere, simulationDelta } from '../src/lib/atmosphere.ts'

const source = (name: string) => readFileSync(new URL(`../src/shaders/${name}`, import.meta.url), 'utf8')

test('render resolution stays small on high-density and ultrawide displays', () => {
  assert.equal(ATMOSPHERE_FPS, 30)
  for (const [width, height] of [[1440, 900], [3840, 2160], [390, 844], [10000, 300], [0, 0], [NaN, Infinity]]) {
    const size = atmosphereSize(width, height)
    assert.ok(size.width <= ATMOSPHERE_MAX_EDGE && size.height <= ATMOSPHERE_MAX_EDGE)
    assert.ok(size.width >= 24 && size.height >= 24)
    assert.ok(Number.isInteger(size.width) && Number.isInteger(size.height))
  }
  assert.deepEqual(atmosphereSize(1920, 1080), { width: 320, height: 180 })
})

test('cursor coordinates map to shader UVs and stay bounded', () => {
  assert.deepEqual(pointerUv(0, 0, 100, 100), { x: 0, y: 1 })
  assert.deepEqual(pointerUv(50, 50, 100, 100), { x: 0.5, y: 0.5 })
  assert.deepEqual(pointerUv(999, -100, 100, 100), { x: 1, y: 1 })
})

test('feedback timesteps do not explode after tab suspension', () => {
  assert.equal(simulationDelta(20), 0.05)
  assert.equal(simulationDelta(-1), 0)
  assert.equal(simulationDelta(NaN), 0)
  assert.equal(simulationDelta(1 / 30), 1 / 30)
})

test('cursor wakes decay naturally and impulses remain bounded', () => {
  const still = pointerImpulse({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, 1 / 30)
  assert.deepEqual(still, { x: 0, y: 0 })
  const fast = pointerImpulse({ x: 0, y: 1 }, { x: 1, y: 0 }, 0)
  assert.deepEqual(fast, { x: 1, y: -1 })
  assert.ok(pointerImpulse({ x: 0, y: 0 }, { x: 0.01, y: 0.01 }, 1 / 30).x < 1)
})

test('hidden, offscreen, and lost-context atmospheres do not render', () => {
  const active = { visible: true, hidden: false, contextLost: false }
  assert.equal(shouldRenderAtmosphere(active), true)
  assert.equal(shouldRenderAtmosphere({ ...active, visible: false }), false)
  assert.equal(shouldRenderAtmosphere({ ...active, hidden: true }), false)
  assert.equal(shouldRenderAtmosphere({ ...active, contextLost: true }), false)
})

test('GLSL follows the Three.js injected-attribute convention and implements feedback', () => {
  for (const name of ['atmosphere.vert', 'atmosphere-flow.frag', 'atmosphere-display.frag']) {
    const shader = source(name)
    assert.doesNotMatch(shader, /\bprecision\b|attribute\s+\w+\s+(position|uv)\b|#version\s+300/)
    assert.match(shader, /varying vec2 vUv/)
    assert.match(shader, /void main\(\)/)
  }
  assert.match(source('atmosphere-flow.frag'), /texture2D\(uPrevious, back\)/)
  assert.match(source('atmosphere-flow.frag'), /uImpulse/)
  assert.match(source('atmosphere-display.frag'), /#include <colorspace_fragment>/)
})

test('atmosphere is lazy-loaded only on Me and avoids continuous React state', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../src/components/MeAtmosphere.tsx', import.meta.url), 'utf8')
  assert.match(app, /lazy\(\(\) => import\('@\/components\/MeAtmosphere'\)\)/)
  assert.match(app, /route\.page === 'me' && <Suspense/)
  assert.doesNotMatch(component, /useState|addEventListener\('scroll'/)
  assert.match(component, /read\.dispose\(\); write\.dispose\(\)/)
  assert.match(component, /renderer\.forceContextLoss\(\)/)
})
