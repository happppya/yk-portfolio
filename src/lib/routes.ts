export type Route =
  | { page: 'art' | 'music' | 'research' }
  | { page: 'detail'; slug: string }
  | { page: 'not-found' }

/**
 * The front page is the Art collection, so `/` and `/art` both resolve to it.
 * Music and Research keep their own paths, and `/art/:slug` is the subordinate
 * artwork view.
 */
export function resolveRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/' || path === '/art') return { page: 'art' }
  if (path === '/music') return { page: 'music' }
  if (path === '/research') return { page: 'research' }
  const match = /^\/art\/([a-z0-9-]+)$/.exec(path)
  if (match) return { page: 'detail', slug: match[1] }
  return { page: 'not-found' }
}

// The destination identity that owns an accent: detail views keep the collection's.
export type AccentKey = 'me' | 'art' | 'music' | 'research'

// The accent a route wears. The plum "me" identity now belongs to the hero that sits
// on the Art page, so Art carries its own accent and nothing maps to "me" any more.
export function accentKey(page: Route['page']): AccentKey {
  if (page === 'not-found') return 'art'
  if (page === 'detail') return 'art'
  return page
}

// The accent a link promises: where it leads, not the page being left. Undefined for
// external, hash, query, or unknown targets, which keep the current accent.
export function linkAccent(href: string | null | undefined): AccentKey | undefined {
  if (!href || !href.startsWith('/') || href.startsWith('//') || /[?#]/.test(href)) return undefined
  const route = resolveRoute(href)
  return route.page === 'not-found' ? undefined : accentKey(route.page)
}

// The navigation href a route belongs to. Art owns the front page, and an artwork
// detail keeps the collection's own entry active.
export function activePath(route: Route) {
  if (route.page === 'art') return '/'
  if (route.page === 'detail') return '/'
  if (route.page === 'not-found') return ''
  return `/${route.page}`
}

type LinkClick = {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  defaultPrevented?: boolean
}

export function shouldNavigate(event: LinkClick) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

export function shouldHandleLink(event: LinkClick, href: string, options: { target?: string; download?: unknown } = {}) {
  return !event.defaultPrevented && shouldNavigate(event) && !options.target && options.download === undefined
    && href.startsWith('/') && !href.startsWith('//') && !/[?#]/.test(href)
}
