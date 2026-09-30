export type Route =
  | { page: 'me' | 'art' | 'music' | 'research' }
  | { page: 'detail'; slug: string }
  | { page: 'not-found' }

export function resolveRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { page: 'me' }
  if (path === '/art') return { page: 'art' }
  if (path === '/music') return { page: 'music' }
  if (path === '/research') return { page: 'research' }
  const match = /^\/art\/([a-z0-9-]+)$/.exec(path)
  if (match) return { page: 'detail', slug: match[1] }
  return { page: 'not-found' }
}

export function activePath(route: Route) {
  if (route.page === 'me') return '/'
  if (route.page === 'detail') return '/art'
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
