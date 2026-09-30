import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { syncScrollPosition } from './scroll-controller.ts'
import { transitionWork, workTransitionFrames, WORK_TRANSITION_DURATION, WORK_TRANSITION_NAME } from './work-transition.ts'

const listeners = new Set<() => void>()
const positions = new Map<string, { y: number; focus: string | null }>()
let currentPath = window.location.pathname
let currentKey = window.history.state?.portfolioKey ?? crypto.randomUUID()
let sequence = 0
let activeTransition: ViewTransition | undefined
let cleanupTransition: (() => void) | undefined
window.history.replaceState({ ...window.history.state, portfolioKey: currentKey }, '', window.location.href)
window.history.scrollRestoration = 'manual'

function rememberPosition() {
  const element = document.activeElement
  positions.set(currentKey, {
    y: window.scrollY,
    focus: element instanceof HTMLElement && element.id ? element.id : null,
  })
}

function selectWork(slug: string | undefined) {
  return slug ? document.querySelector<HTMLElement>(`[data-work-image="${slug}"]`) : null
}

function update(path: string, restore = false) {
  const id = ++sequence
  activeTransition?.skipTransition()
  cleanupTransition?.()
  const animated = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && Boolean(document.startViewTransition)
  const slug = transitionWork(currentPath, path)
  const source = selectWork(slug)
  const before = source?.getBoundingClientRect()
  const sourceImage = source?.querySelector('img')
  const sourceUrl = sourceImage?.complete && sourceImage.naturalWidth ? sourceImage.currentSrc || sourceImage.src : undefined
  const destinationKey = currentKey
  currentPath = path
  let destination: HTMLElement | null = null
  let restoreImage: (() => void) | undefined

  const render = () => {
    if (id !== sequence) return
    flushSync(() => listeners.forEach((listener) => listener()))
    const saved = restore ? positions.get(destinationKey) : undefined
    if (!syncScrollPosition(saved?.y ?? 0)) window.scrollTo({ top: saved?.y ?? 0, behavior: 'instant' })
    const focus = (saved?.focus ? document.getElementById(saved.focus) : null) ?? document.getElementById('page-title')
    focus?.focus({ preventScroll: true })
    if (animated) document.getElementById('main-content')?.classList.add('transition-static')
    if (animated && source && sourceUrl) {
      destination = selectWork(slug)
      const image = destination?.querySelector('img')
      if (destination && image) {
        // Reuse a decoded source for the snapshot instead of capturing a skeleton.
        const originalSrc = image.getAttribute('src')
        const originalSet = image.getAttribute('srcset')
        restoreImage = () => {
          if (originalSrc) image.setAttribute('src', originalSrc)
          if (originalSet) image.setAttribute('srcset', originalSet)
        }
        image.removeAttribute('srcset')
        image.src = sourceUrl
        image.getAnimations().forEach((animation) => animation.cancel())
        destination.classList.remove('loading', 'error')
        destination.classList.add('loaded')
        destination.style.viewTransitionName = WORK_TRANSITION_NAME
      }
    }
  }

  if (!animated) {
    render()
    return
  }

  const animations: Animation[] = []
  if (source && sourceUrl) source.style.viewTransitionName = WORK_TRANSITION_NAME
  document.documentElement.dataset.transition = source && sourceUrl ? 'work' : 'page'
  const transition = document.startViewTransition!(render)
  activeTransition = transition
  const cleanup = () => {
    animations.forEach((animation) => animation.cancel())
    source?.style.removeProperty('view-transition-name')
    destination?.style.removeProperty('view-transition-name')
    restoreImage?.()
    restoreImage = undefined
    if (cleanupTransition === cleanup) {
      cleanupTransition = undefined
      delete document.documentElement.dataset.transition
    }
  }
  cleanupTransition = cleanup
  transition.ready.then(() => {
    if (id !== sequence) return
    const next = destination?.getBoundingClientRect()
    const frames = before && next ? workTransitionFrames(before, next) : undefined
    if (frames) animations.push(document.documentElement.animate(frames, {
      duration: WORK_TRANSITION_DURATION, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both',
      pseudoElement: `::view-transition-group(${WORK_TRANSITION_NAME})`,
    }))
  }).catch(() => {})
  transition.finished.catch(() => {}).finally(() => {
    if (cleanupTransition === cleanup) cleanup()
    if (activeTransition === transition) activeTransition = undefined
  })
}

function onPopState() {
  rememberPosition()
  currentKey = window.history.state?.portfolioKey ?? crypto.randomUUID()
  update(window.location.pathname, true)
}
window.addEventListener('popstate', onPopState)

export function navigate(path: string) {
  if (path === currentPath) return
  rememberPosition()
  // Return to the existing collection entry instead of creating a second copy.
  if (path === '/art' && currentPath.startsWith('/art/') && window.history.state?.from === '/art') {
    window.history.back()
    return
  }
  const previous = currentPath
  currentKey = crypto.randomUUID()
  window.history.pushState({ portfolioKey: currentKey, from: previous }, '', path)
  update(path)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => currentPath)
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('popstate', onPopState)
    activeTransition?.skipTransition()
    cleanupTransition?.()
    listeners.clear()
  })
}
