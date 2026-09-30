import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registerScrollController, syncScrollPosition } from '../src/lib/scroll-controller.ts'

test('scroll bridge falls back when no smooth-scroll engine is mounted', () => {
  assert.equal(syncScrollPosition(100), false)
})

test('scroll restoration delegates to the active engine and cleans up', () => {
  const positions: number[] = []
  const cleanup = registerScrollController((top) => positions.push(top))
  assert.equal(syncScrollPosition(650), true)
  assert.deepEqual(positions, [650])
  cleanup()
  assert.equal(syncScrollPosition(0), false)
})

test('stale cleanup cannot remove a newer engine', () => {
  const first = registerScrollController(() => {})
  let received = -1
  const second = registerScrollController((top) => { received = top })
  first()
  assert.equal(syncScrollPosition(240), true)
  assert.equal(received, 240)
  second()
  assert.equal(syncScrollPosition(0), false)
})
