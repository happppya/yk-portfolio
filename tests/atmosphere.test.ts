import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ATMOSPHERE_FPS, ATMOSPHERE_MAX_EDGE, atmosphereOpacity, atmosphereSize, pointerImpulse, pointerInAtmosphere, pointerUv, shouldRenderAtmosphere, simulationDelta } from '../src/lib/atmosphere.ts'

const source = (name: string) => readFileSync(new URL(`../src/shaders/${name}`, import.meta.url), 'utf8')

test('render resolution stays small on high-density and ultrawide displays', () => {
  assert.equal(ATMOSPHERE_FPS, 30)
  for (const [width, height] of [[1440, 900], [3840, 2160], [390, 844], [10000, 300], [0, 0], [NaN, Infinity]]) {
    const size = atmosphereSize(width, height)
    assert.ok(size.width <= ATMOSPHERE_MAX_EDGE && size.height <= ATMOSPHERE_MAX_EDGE)
    assert.ok(size.width >= 24 && size.height >= 24)
    assert.ok(Number.isInteger(size.width) && Number.isInteger(size.height))
  }
  assert.deepEqual(atmosphereSize(1920, 1080), { width: 224, height: 126 })
})

test('cursor coordinates map to shader UVs and stay bounded', () => {
  assert.deepEqual(pointerUv(0, 0, 100, 100), { x: 0, y: 1 })
  assert.deepEqual(pointerUv(50, 50, 100, 100), { x: 0.5, y: 0.5 })
  assert.deepEqual(pointerUv(999, -100, 100, 100), { x: 1, y: 1 })
})

test('scroll fade holds the opening then smoothly vanishes before the hero leaves', () => {
  assert.equal(atmosphereOpacity(-200, 1000), 1)
  assert.equal(atmosphereOpacity(0, 1000), 1)
  assert.equal(atmosphereOpacity(120, 1000), 1)
  assert.ok(Math.abs(atmosphereOpacity(470, 1000) - 0.5) < 1e-10)
  assert.equal(atmosphereOpacity(820, 1000), 0)
  assert.equal(atmosphereOpacity(5000, 1000), 0)
  assert.equal(atmosphereOpacity(0, 0), 1)
  let previous = 1
  for (let scroll = 0; scroll <= 1200; scroll += 10) {
    const value = atmosphereOpacity(scroll, 1000)
    assert.ok(value >= 0 && value <= previous)
    previous = value
  }
  // Progress is proportional on taller mobile heroes and reverse scrolling restores it.
  assert.equal(atmosphereOpacity(940, 2000), atmosphereOpacity(470, 1000))
  assert.equal(atmosphereOpacity(0, 1000), 1)
  assert.ok(1 - atmosphereOpacity(121, 1000) < 0.00001)
  assert.ok(atmosphereOpacity(819, 1000) < 0.00001)
})

test('cursor warping uses the document-anchored layer, including scroll and side gutters', () => {
  const bounds = { left: 200, top: 100, width: 1000, height: 800 }
  assert.deepEqual(pointerInAtmosphere(700, 500, bounds, 0), { x: 0.5, y: 0.5, inside: true })
  assert.deepEqual(pointerInAtmosphere(700, 300, bounds, 200), { x: 0.5, y: 0.5, inside: true })
  assert.deepEqual(pointerInAtmosphere(100, 300, bounds, 200), { x: 0, y: 0.5, inside: false })
  assert.deepEqual(pointerInAtmosphere(700, 300, bounds, 800), { x: 0.5, y: 0, inside: false })
  assert.deepEqual(pointerInAtmosphere(200, 100, bounds, 0), { x: 0, y: 1, inside: true })
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

test('display retains the reference fBM and relief while a held cursor bends the domain', () => {
  const shader = source('atmosphere-display.frag')
  assert.match(shader, /float fbm4\(vec2 p\)/)
  assert.match(shader, /float fbm6\(vec2 p\)/)
  assert.match(shader, /6\.0 \* n/)
  assert.match(shader, /vec3 normal = normalize/)
  assert.match(shader, /vec2 warpAroundPointer\(vec2 p\)/)
  assert.match(shader, /exp\(-dot\(offset, offset\) \* 5\.0\) \* uHover/)
  assert.match(shader, /p = warpAroundPointer\(p\)/)
  assert.doesNotMatch(shader, /iTime|iResolution|mainImage/)
  // The lens layers a swirl, a pinch, ripple rings, and a faint chromatic split.
  assert.match(shader, /float ring = sin\(radius \* 15\.0 - uTime \* 1\.7\)/)
  assert.match(shader, /influence \* influence \* 0\.22/)
  assert.match(shader, /vec3\(0\.05, 0\.0, -0\.05\) \* lens/)
})

test('atmosphere stays document-anchored and uses scroll values for fading and local input', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../src/components/MeAtmosphere.tsx', import.meta.url), 'utf8')
  const rule = css.match(/\.me-atmosphere \{([^}]+)\}/)![1]
  assert.match(rule, /position: absolute/)
  assert.match(rule, /inset: 0 0 auto/)
  assert.doesNotMatch(rule, /position: fixed|position: sticky|transform/)
  // Soft focus: the canvas is blurred and slightly oversized, and the layer clips the overflow
  // so the blur never fades out before the viewport edges.
  assert.match(rule, /overflow: hidden/)
  assert.match(rule, /--atmosphere-blur: \d+px/)
  const canvasRule = css.match(/\.me-atmosphere canvas \{([^}]+)\}/)![1]
  assert.match(canvasRule, /filter: blur\(var\(--atmosphere-blur\)\)/)
  assert.match(canvasRule, /transform: scale\(1\.06\)/)
  // The layer spans the full viewport width, edge to edge, past the capped shell.
  assert.match(component, /document\.documentElement\.clientWidth/)
  assert.match(component, /useScroll\(\)/)
  assert.match(component, /atmosphereOpacity\(scrollY\.get\(\) - origin\.get\(\), height\.get\(\)\)/)
  assert.match(component, /heroRect\.bottom - rect\.top/)
  assert.match(component, /style=\{\{ height, opacity \}\}/)
  assert.match(component, /visible = value > 0; sync\(\)/)
  assert.match(component, /scrollY\.on\('change', \(\) => updatePointer\(true\)\)/)
  assert.match(component, /!hasPointer \|\| scrolling\) previous\.set/)
  assert.match(component, /cleanupMeasurement\(\); unsubscribeFade\(\); unsubscribeScroll\(\)/)
  // Only canvas readiness transitions in time; scroll opacity follows progress without lag.
  assert.doesNotMatch(css, /\.me-atmosphere, \.me-atmosphere canvas \{ transition/)
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
