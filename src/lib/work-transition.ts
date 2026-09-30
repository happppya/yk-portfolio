type Rect = { x: number; y: number; width: number; height: number }

export const WORK_TRANSITION_NAME = 'selected-work'
export const WORK_TRANSITION_DURATION = 760

export function transitionWork(from: string, to: string) {
  const clean = (path: string) => path.replace(/\/+$/, '') || '/'
  const previous = clean(from)
  const next = clean(to)
  const detail = (path: string) => /^\/art\/([a-z0-9-]+)$/.exec(path)?.[1]
  const collection = (path: string) => path === '/' || path === '/art'
  if (collection(previous)) return detail(next)
  if (collection(next)) return detail(previous)
  return undefined
}

export function workTransitionFrames(previous: Rect, next: Rect) {
  if (previous.width <= 0 || previous.height <= 0 || next.width <= 0 || next.height <= 0) return undefined
  return [
    { width: `${next.width}px`, height: `${next.height}px`,
      transform: `translate(${previous.x}px, ${previous.y}px) scale(${previous.width / next.width}, ${previous.height / next.height})` },
    { width: `${next.width}px`, height: `${next.height}px`,
      transform: `translate(${next.x}px, ${next.y}px) scale(1)` },
  ]
}
