import { lazy, Suspense, useEffect, useState } from 'react'
import { artworks, dialogs, navigation, preview, site } from '@/content'
import { accentKey, activePath, resolveRoute } from '@/lib/routes'
import { usePathname } from '@/lib/router'
import { PageLink } from '@/components/PageLink'
import { ExperienceCursor, SmoothScroll } from '@/components/Experience'
import { useModalDialog } from '@/components/useModalDialog'
import { ArtPage, ArtworkPage, MePage, MusicPage, NotFoundPage, ResearchPage } from '@/pages'

const MeAtmosphere = lazy(() => import('@/components/MeAtmosphere'))

type Theme = 'system' | 'light' | 'dark'
type Info = 'resume' | 'preview' | null

/** The theme control is code, not content: the design contract fixes one name per action. */
const THEMES = [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']] as const satisfies readonly (readonly [Theme, string])[]

function getTheme(): Theme {
  try {
    const value = localStorage.getItem('portfolio-theme')
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch { return 'system' }
}

function InfoDialog({ kind, onClose }: { kind: Exclude<Info, null>; onClose: () => void }) {
  const { ref, dialogProps } = useModalDialog(onClose)
  const content = kind === 'resume' ? dialogs.resume : dialogs.preview
  return (
    <dialog ref={ref} className="info-dialog" {...dialogProps} aria-labelledby="info-title">
      <div className="info-content"><button data-cursor="Close" className="text-link info-close" onClick={onClose}>Close <span aria-hidden="true">×</span></button>
        <h2 id="info-title">{content.heading}</h2>
        {content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </dialog>
  )
}

export default function App() {
  const pathname = usePathname()
  const route = resolveRoute(pathname)
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [info, setInfo] = useState<Info>(null)
  const work = route.page === 'detail' ? artworks.find((item) => item.slug === route.slug) : undefined
  const current = activePath(route)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('portfolio-theme', theme) } catch { /* Storage is optional. */ }
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.page = accentKey(route.page)
  }, [route.page])

  useEffect(() => {
    const title = route.page === 'detail' ? work?.title ?? 'Not found' : route.page === 'not-found' ? 'Not found' : navigation.find((item) => item.href === current)?.label ?? 'Me'
    document.title = `${title} | ${site.name}`
    document.querySelector('meta[name="description"]')?.setAttribute('content', `${site.name}: ${title.toLowerCase()}. ${site.tagline}`)
  }, [pathname, current, route.page, work?.title])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08 })
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [pathname])

  return (
    <div className="site-shell">
      {route.page === 'me' && <Suspense fallback={<div className="me-atmosphere" aria-hidden="true" />}><MeAtmosphere /></Suspense>}
      <SmoothScroll />
      <ExperienceCursor />
      <div className="scroll-progress" aria-hidden="true" />
      <a className="skip-link" href="#main-content">Skip to content</a>
      {/* The artwork view is chrome-free: no navigation and no footer, so the work fills the
          viewport and Back to Art is the way back. Every other view keeps both. */}
      {route.page !== 'detail' && <header className="site-header">
        <div className={`identity ${route.page === 'me' ? 'identity-me' : ''}`}>
          {route.page === 'me' ? <h1 id="page-title" tabIndex={-1}>{site.name}</h1> : <PageLink href="/" className="identity-name">{site.name}</PageLink>}
          {route.page === 'me' && (preview.resumeUrl ? <a data-magnetic data-cursor="Open resume" className="resume-link" href={preview.resumeUrl} target="_blank" rel="noreferrer">Resume <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a> : <button data-magnetic data-cursor="Resume" className="resume-link" onClick={() => setInfo('resume')}>Resume <span aria-hidden="true">↗</span></button>)}
        </div>
        <nav aria-label="Main navigation">{navigation.map((item) => <PageLink data-magnetic data-cursor={`Explore ${item.label}`} key={item.href} href={item.href} aria-current={current === item.href ? 'page' : undefined}>{item.label}</PageLink>)}</nav>
      </header>}
      <main id="main-content" tabIndex={-1} key={pathname}>
        {route.page === 'me' && <MePage />}
        {route.page === 'art' && <ArtPage />}
        {route.page === 'music' && <MusicPage />}
        {route.page === 'research' && <ResearchPage />}
        {route.page === 'detail' && (work ? <ArtworkPage work={work} /> : <NotFoundPage />)}
        {route.page === 'not-found' && <NotFoundPage />}
      </main>
      {route.page !== 'detail' && <footer className="site-footer">
        <PageLink href="/" className="footer-name">{site.name}</PageLink>
        {preview.enabled && <button data-cursor="About" className="preview-link" onClick={() => setInfo('preview')}>Portfolio preview <span aria-hidden="true">↗</span></button>}
        <fieldset className="theme-control"><legend className="sr-only">Color theme</legend>{THEMES.map(([value, label]) => <button data-cursor={`${label} theme`} key={value} aria-pressed={theme === value} onClick={() => setTheme(value)}>{label}</button>)}</fieldset>
      </footer>}
      {info && <InfoDialog kind={info} onClose={() => setInfo(null)} />}
    </div>
  )
}
