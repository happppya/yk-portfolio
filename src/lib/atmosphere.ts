export const ATMOSPHERE_FPS = 30
export const ATMOSPHERE_MAX_EDGE = 224
export const ATMOSPHERE_MIN_EDGE = 24

export function atmosphereSize(width: number, height: number) {
  const safeWidth = Math.max(1, Number.isFinite(width) ? width : 1)
  const safeHeight = Math.max(1, Number.isFinite(height) ? height : 1)
  const scale = Math.min(1, ATMOSPHERE_MAX_EDGE / Math.max(safeWidth, safeHeight))
  return {
    width: Math.max(ATMOSPHERE_MIN_EDGE, Math.round(safeWidth * scale)),
    height: Math.max(ATMOSPHERE_MIN_EDGE, Math.round(safeHeight * scale)),
  }
}

export function simulationDelta(seconds: number) {
  return Math.min(0.05, Math.max(0, Number.isFinite(seconds) ? seconds : 0))
}

// Hold the opening composition, then smoothly disappear before the hero leaves.
export function atmosphereOpacity(scrollTop: number, height: number) {
  const progress = Math.max(0, Math.min(1, (scrollTop / Math.max(1, height) - 0.12) / 0.7))
  return 1 - progress * progress * (3 - 2 * progress)
}

export function pointerInAtmosphere(x: number, y: number, bounds: { left: number; top: number; width: number; height: number }, scrollTop: number) {
  const localX = x - bounds.left
  const localY = y + scrollTop - bounds.top
  return { ...pointerUv(localX, localY, bounds.width, bounds.height),
    inside: localX >= 0 && localX <= bounds.width && localY >= 0 && localY <= bounds.height }
}

export function pointerUv(x: number, y: number, width: number, height: number) {
  const clamp = (value: number) => Math.max(0, Math.min(1, value))
  return { x: clamp(x / Math.max(1, width)), y: clamp(1 - y / Math.max(1, height)) }
}

export function pointerImpulse(previous: { x: number; y: number }, next: { x: number; y: number }, seconds: number) {
  const delta = Math.max(1 / 120, simulationDelta(seconds))
  const limit = (value: number) => Math.max(-1, Math.min(1, value))
  return { x: limit((next.x - previous.x) / delta * 0.3), y: limit((next.y - previous.y) / delta * 0.3) }
}

export function shouldRenderAtmosphere({ visible, hidden, contextLost }: { visible: boolean; hidden: boolean; contextLost: boolean }) {
  return visible && !hidden && !contextLost
}
