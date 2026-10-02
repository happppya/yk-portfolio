import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ATMOSPHERE_FPS, ATMOSPHERE_LENS_MAX_EDGE, ATMOSPHERE_MAX_EDGE, atmosphereDisplaySize, atmosphereOpacity, atmosphereSize, pointerImpulse, pointerInAtmosphere, pointerUv, shouldRenderAtmosphere, simulationDelta } from '../src/lib/atmosphere.ts'

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

test('the display pass runs at the viewport so a dither cell lands on the pixel grid', () => {
  for (const [width, height] of [[1440, 900], [1920, 1080], [3840, 2160], [390, 844], [0, 0], [NaN, Infinity]]) {
    const size = atmosphereDisplaySize(width, height)
    assert.ok(size.width <= ATMOSPHERE_LENS_MAX_EDGE && size.height <= ATMOSPHERE_LENS_MAX_EDGE)
    assert.ok(size.width >= 1 && size.height >= 1)
    assert.ok(Number.isInteger(size.width) && Number.isInteger(size.height))
  }
  // Below the cap the canvas is one render pixel per viewport pixel; above it, the cap.
  assert.deepEqual(atmosphereDisplaySize(1440, 900), { width: 1440, height: 900 })
  assert.deepEqual(atmosphereDisplaySize(3840, 2160), { width: 1920, height: 1080 })
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
  for (const name of ['atmosphere.vert', 'atmosphere-flow.frag', 'atmosphere-pattern.frag', 'atmosphere-display.frag']) {
    const shader = source(name)
    assert.doesNotMatch(shader, /\bprecision\b|attribute\s+\w+\s+(position|uv)\b|#version\s+300/)
    assert.match(shader, /varying vec2 vUv/)
    assert.match(shader, /void main\(\)/)
  }
  assert.match(source('atmosphere-flow.frag'), /texture2D\(uPrevious, back\)/)
  assert.match(source('atmosphere-flow.frag'), /uImpulse/)
  assert.match(source('atmosphere-display.frag'), /#include <colorspace_fragment>/)
})

test('the hero follows the new reference pattern rather than the archived marble', () => {
  // The hundred-step field is the pattern's own pass, evaluated at the layer's low edge.
  const shader = source('atmosphere-pattern.frag')
  // The reference's fixed-point step, and its hundred-step accumulation of density,
  // turn, and depth, are kept.
  assert.match(shader, /#define HERO_STEPS 100/)
  assert.match(shader, /return z - 0\.05 \* cos\(t\.xz \+ z\.x \* z\.y \+ cos\(t\.yw \+ 4\.712389 \* z\.yx\) \+ z\.yx \* z\.yx\);/)
  assert.match(shader, /for \(int i = 0; i < HERO_STEPS; i\+\+\)/)
  assert.match(shader, /density \+= 1\.0 \/ \(0\.1 \+ d\);/)
  assert.match(shader, /depth \+= exp\(-0\.2 \* d\);/)
  // The reference's relief normal and soft tonemap survive the move to screen space.
  assert.match(shader, /vec3 normal = normalize\(vec3\(dFdx\(density\), 0\.02, dFdy\(density\)\)\);/)
  assert.match(shader, /palette \*= 3\.2 \/ \(3\.0 \+ palette\);/)
  // Its own sources are gone, including the AA supersampling and the vivid cosine palette.
  assert.doesNotMatch(shader, /fbm4|fbm6|marble\(|iTime|iResolution|mainImage|#define AA/)
  // "Turn" is the reference's own accumulation, not the cursor effect that used to swirl.
  assert.match(shader, /turn \+= sin\(atan\(p\.x - z\.x, p\.y - z\.y\)\);/)
  assert.doesNotMatch(shader, /\bswirl\b/)
  // The display pass consumes both, with turn unpacked from the unsigned target.
  const display = source('atmosphere-display.frag')
  assert.match(display, /float relief = pattern\.r;/)
  assert.match(display, /float turn = pattern\.g \* 2\.0 - 1\.0;/)
  assert.match(shader, /gl_FragColor = vec4\(relief, turn \* 0\.5 \+ 0\.5, 0\.0, 1\.0\);/)
})

test('the pointer dithers the pattern instead of swirling it', () => {
  const shader = source('atmosphere-display.frag')
  // The liquid lens is gone: no domain warp, no vortex, no rings, no chromatic split.
  assert.doesNotMatch(shader, /warpAroundPointer|vortex|influence \* influence|vec3\(0\.05, 0\.0, -0\.05\)/)
  // An ordered 4x4 dither rounds the pattern to a few steps, cell by cell.
  assert.match(shader, /float bayer2\(vec2 cell\)/)
  assert.match(shader, /float bayer4\(vec2 cell\)/)
  assert.match(shader, /float dithered = floor\(relief \* DITHER_LEVELS \+ bayer4\(gl_FragCoord\.xy \/ DITHER_CELL\)\) \/ DITHER_LEVELS;/)
  // Its strength falls away from the cursor, and is zero where the pointer is not.
  assert.match(shader, /float reach = exp\(-dot\(toPointer, toPointer\) \* DITHER_FALLOFF\) \* uHover;/)
  // The lens is the same pattern unfocused and stippled, so the soft focus lifts under the
  // cursor rather than a second image arriving on top of the first.
  assert.match(shader, /vec3 lens = heroPigment\(lensRelief, turn, mist, LENS_GAIN\);/)
  assert.match(shader, /gl_FragColor = vec4\(mix\(soft, lens, clamp\(reach, 0\.0, 1\.0\)\), 1\.0\);/)
  // The mark is brighter and higher in contrast than the wash, so it reads as a mark: the
  // steps are pushed away from the pattern's own value, and the lens shows more pigment.
  assert.match(shader, /float lensRelief = clamp\(relief \+ \(dithered - relief\) \* LENS_CONTRAST, 0\.0, 1\.0\);/)
  assert.match(shader, /^#define LENS_CONTRAST ([2-9]|1\.[5-9])\d*$/m)
  assert.match(shader, /^#define LENS_GAIN ([2-9]|1\.[3-9])\d*$/m)
  assert.match(shader, /float density = clamp\(\(0\.012 \+ \(1\.0 - pearl\) \* 0\.13 \+ mist \* 0\.06\) \* gain, 0\.0, 1\.0\) \* feather;/)
  // The wash keeps the pattern's own amplitude; only the lens reads through a gain.
  assert.match(shader, /return heroPigment\(pattern\.r, pattern\.g \* 2\.0 - 1\.0, mist, 1\.0\);/)
  // Four times the old lens figure, which is half its radius; four times again halves it.
  assert.match(shader, /^#define DITHER_FALLOFF 20\.0$/m)
  assert.match(shader, /^#define DITHER_CELL \d+\.\d+$/m)
})

test('the hero stays a whisper over the page', () => {
  const pattern = source('atmosphere-pattern.frag')
  const shader = source('atmosphere-display.frag')
  // The wake stirs the pattern instead of smearing it, and shows as a faint mist.
  assert.match(pattern, /\(field\.gb - 0\.5\) \* 0\.18/)
  assert.match(shader, /mist \* 0\.06/)
  // The same quiet as before: a base wash, a relief-driven amplitude, and a top feather.
  assert.match(shader, /\(0\.012 \+ \(1\.0 - pearl\) \* 0\.13 \+ mist \* 0\.06\) \* gain/)
  assert.match(shader, /float feather = smoothstep\(0\.0, 0\.24, vUv\.y\)/)
  assert.match(shader, /return mix\(uSurface, pigment, density\)/)
})

test('the hero carries its own warm palette instead of the page accent', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../src/components/MeAtmosphere.tsx', import.meta.url), 'utf8')
  const shader = source('atmosphere-display.frag')
  // Two stops, so the hero can read yellow without moving any destination's accent.
  assert.match(css, /--atmosphere-deep: #[0-9a-f]{6};/)
  assert.match(css, /--atmosphere-warm: #[0-9a-f]{6};/)
  assert.match(shader, /uniform vec3 uDeep;/)
  assert.match(shader, /uniform vec3 uWarm;/)
  assert.match(shader, /vec3 pigment = mix\(uDeep, uWarm,/)
  assert.match(component, /getPropertyValue\('--atmosphere-deep'\)/)
  assert.match(component, /getPropertyValue\('--atmosphere-warm'\)/)
  assert.doesNotMatch(component, /getPropertyValue\('--accent'\)/)
  // The CSS wash behind the canvas uses the hero's gold, not the page accent.
  const rule = css.match(/\.me-atmosphere \{([^}]+)\}/)![1]
  assert.match(rule, /var\(--atmosphere-warm\)/)
  assert.doesNotMatch(rule, /var\(--accent\)/)
})

test('the previous marble hero is archived rather than deleted', () => {
  const archived = readFileSync(new URL('../archive/atmosphere-marble/atmosphere-display.frag', import.meta.url), 'utf8')
  const archivedComponent = readFileSync(new URL('../archive/atmosphere-marble/MeAtmosphere.tsx', import.meta.url), 'utf8')
  assert.match(archived, /float fbm4\(vec2 p\)/)
  assert.match(archived, /vec2 warpAroundPointer\(vec2 p\)/)
  assert.match(archivedComponent, /uAccent/)
  // The live hero no longer reads the archived implementation.
  const component = readFileSync(new URL('../src/components/MeAtmosphere.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(component, /archive/)
  assert.doesNotMatch(component, /uAccent|uInk/)
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
  // Soft focus is still the stylesheet's knob, but no longer its effect: a CSS blur covers
  // the whole element and would soften the cursor's dither along with the pattern.
  const canvasRule = css.match(/\.me-atmosphere canvas \{([^}]+)\}/)![1]
  assert.doesNotMatch(canvasRule, /filter:/)
  assert.match(canvasRule, /transform: scale\(1\.06\)/)
  // The component reads that knob and the shader applies it to the pattern alone.
  assert.match(component, /getComputedStyle\(element\)\.getPropertyValue\('--atmosphere-blur'\)/)
  assert.match(component, /display\.uniforms\.uBlur\.value = softFocusPx\(\) \/ \(bounds\.width \/ size\.width\)/)
  assert.match(source('atmosphere-display.frag'), /vec2 step = uPatternTexel \* uBlur \* BLUR_TAP_SIGMA;/)
  // The canvas itself follows the viewport, while the field keeps its own low edge.
  assert.match(component, /atmosphereDisplaySize\(bounds\.width, bounds\.height\)/)
  assert.match(component, /renderer\.setSize\(displaySize\.width, displaySize\.height, false\)/)
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

test('the hero layer dissolves into the page instead of ending on a hard line', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
  const rule = css.match(/\.me-atmosphere \{([^}]+)\}/)![1]
  // The opaque canvas hides the page's own ambient wash and grain for the height of the
  // hero, so without a fade out they would reappear on a line where the next section
  // starts. Reaching fully transparent at the bottom edge is what removes the seam.
  assert.match(rule, /-webkit-mask-image: linear-gradient\(to bottom, #000 0 \d+%, transparent\);/)
  assert.match(rule, /mask-image: linear-gradient\(to bottom, #000 0 \d+%, transparent\);/)
  // The fade covers the tail of the pattern's own fade, so no visible pattern is cut.
  const fadeStart = Number(/mask-image: linear-gradient\(to bottom, #000 0 (\d+)%/.exec(rule)![1])
  assert.ok(fadeStart >= 60 && fadeStart <= 90, `the dissolve should overlap the pattern's own fade, found ${fadeStart}%`)
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
