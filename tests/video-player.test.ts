import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const player = readFileSync(new URL('../src/components/VideoPlayer.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

test('hovering the video toggles playback and shows the hint on the cursor', () => {
  // The whole frame is one transparent control, so every point over the video is the target.
  assert.match(player, /className="video-toggle" data-cursor=\{playing \? 'Pause' : 'Play'\}/)
  assert.match(player, /aria-label=\{`\$\{playing \? 'Pause' : 'Play'\} \$\{label\}`\}/)
  assert.match(css, /\.video-toggle \{ position: absolute; inset: 0; z-index: 1; \}/)
})

test('the progress bar under the video seeks by drag as well as by the keys', () => {
  // A range input is what makes a drag, a touch, and the arrow keys seek the same way.
  assert.match(player, /<input type="range" className="video-progress"/)
  assert.match(player, /onChange=\{\(event\) => seek\(Number\(event\.currentTarget\.value\)\)\}/)
  assert.match(player, /video\.current\.currentTime = fraction \* duration\.current/)
  // It follows the stage in the source, so it reads as a small bar beneath the picture.
  assert.ok(player.indexOf('className="video-progress"') > player.indexOf('className="video-stage"'))
  assert.match(css, /\.video-progress \{ appearance: none;/)
})

test('a drag owns the bar until the pointer lifts, so playback cannot fight it', () => {
  assert.match(player, /const dragging = useRef\(false\)/)
  assert.match(player, /if \(!dragging\.current && duration\.current > 0\) setProgress/)
  assert.match(player, /onPointerDown=\{\(\) => \{ dragging\.current = true \}\}/)
})

test('sound is a small square in the corner that names the action in code', () => {
  assert.match(player, /className="video-sound" data-cursor=\{muted \? 'Play sound' : 'Mute'\}/)
  assert.match(player, /aria-pressed=\{!muted\}/)
  assert.match(player, /aria-label=\{muted \? `Play sound for \$\{label\}` : `Mute \$\{label\}`\}/)
  // It sits above the play/pause surface, so its press is never swallowed by the frame.
  assert.match(css, /\.video-sound \{ position: absolute; top: 14px; right: 14px; z-index: 2;/)
})

test('the poster keeps a play mark that is an indicator, not a second control', () => {
  assert.match(player, /<div className="video-overlay" aria-hidden="true"><span className="play-button">/)
  assert.match(css, /\.video-overlay \{[^}]*pointer-events: none;/)
})

test('the old text control row is gone rather than layered over the new controls', () => {
  assert.doesNotMatch(player, /video-controls/)
  assert.doesNotMatch(css, /\.video-controls/)
  // The state line survives, but as a screen-reader announcement rather than a visible row
  // that a small-screen rule could hide from assistive technology.
  assert.match(player, /className="video-state sr-only" role="status"/)
  assert.doesNotMatch(css, /\.video-state \{ display: none/)
})
