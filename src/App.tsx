import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { artworks, navigation, portfolio } from '@/content'
import { accentKey, activePath, resolveRoute } from '@/lib/routes'
import { usePathname } from '@/lib/router'
import { PageLink } from '@/components/PageLink'
import { ExperienceCursor, SmoothScroll } from '@/components/Experience'
import { ArtPage, ArtworkPage, MePage, MusicPage, NotFoundPage, ResearchPage } from '@/pages'

const MeAtmosphere = lazy(() => import('@/components/MeAtmosphere'))

type Theme = 'system' | 'light' | 'dark'
type Info = 'resume' | 'preview' | null

function getTheme(): Theme {
  try {
    const value = localStorage.getItem('portfolio-theme')
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch { return 'system' }
}

function InfoDialog({ kind, onClose }: { kind: Exclude<Info, null>; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement as HTMLElement | null
    element?.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      element?.close()
      document.body.style.overflow = overflow
      previous?.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog ref={dialog} className="info-dialog" onCancel={(event) => { event.preventDefault(); onClose() }} aria-labelledby="info-title" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="info-content"><button data-cursor="Close" className="text-link info-close" onClick={onClose}>Close <span aria-hidden="true">×</span></button>
        <h2 id="info-title">{kind === 'resume' ? 'Resume, soon.' : 'About this preview.'}</h2>
        {kind === 'resume' ? <><p>Yujin’s resume has not been supplied yet.</p><p>The link is ready for an approved PDF. No personal history or credentials have been invented.</p></> : <><p>This is a working portfolio preview. Yujin’s own images, recordings, biography, papers, and resume are still needed.</p><dl className="preview-credits"><div><dt>Artwork</dt><dd>Public-domain works by Vasily Kandinsky and Claude Monet, from the <a href="https://www.artic.edu/open-access/open-access-images" target="_blank" rel="noreferrer">Art Institute of Chicago<span className="sr-only"> (opens in a new tab)</span></a>.</dd></div><div><dt>Photography</dt><dd>Stock reference images from Unsplash. The portrait does not depict Yujin Kim.</dd></div><div><dt>Video</dt><dd>CC0 flower demo footage from <a href="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" target="_blank" rel="noreferrer">MDN<span className="sr-only"> (opens in a new tab)</span></a>, not a performance recording.</dd></div></dl></>}
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
    document.title = `${title} | Yujin Kim`
    document.querySelector('meta[name="description"]')?.setAttribute('content', `Yujin Kim: ${title.toLowerCase()}. A portfolio preview spanning art, music, and research.`)
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
      <ExperienceCursor pathname={pathname} />
      <div className="scroll-progress" aria-hidden="true" />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className={`identity ${route.page === 'me' ? 'identity-me' : ''}`}>
          {route.page === 'me' ? <h1 id="page-title" tabIndex={-1}>Yujin Kim</h1> : <PageLink href="/" className="identity-name">Yujin Kim</PageLink>}
          {route.page === 'me' && (portfolio.resumeHref ? <a data-magnetic data-cursor="Open resume" className="resume-link" href={portfolio.resumeHref} target="_blank" rel="noreferrer">Resume <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a> : <button data-magnetic data-cursor="Resume" className="resume-link" onClick={() => setInfo('resume')}>Resume <span aria-hidden="true">↗</span></button>)}
        </div>
        <nav aria-label="Main navigation">{navigation.map((item) => <PageLink data-magnetic data-cursor={`Explore ${item.label}`} key={item.href} href={item.href} aria-current={current === item.href ? 'page' : undefined}>{item.label}</PageLink>)}</nav>
      </header>
      <main id="main-content" tabIndex={-1} key={pathname}>
        {route.page === 'me' && <MePage />}
        {route.page === 'art' && <ArtPage />}
        {route.page === 'music' && <MusicPage />}
        {route.page === 'research' && <ResearchPage />}
        {route.page === 'detail' && (work ? <ArtworkPage work={work} /> : <NotFoundPage />)}
        {route.page === 'not-found' && <NotFoundPage />}
      </main>
      <footer className="site-footer">
        <PageLink href="/" className="footer-name">Yujin Kim</PageLink>
        {portfolio.preview && <button data-cursor="About" className="preview-link" onClick={() => setInfo('preview')}>Portfolio preview <span aria-hidden="true">↗</span></button>}
        <fieldset className="theme-control"><legend className="sr-only">Color theme</legend>{(['system', 'light', 'dark'] as const).map((value) => <button data-cursor={`${value.charAt(0).toUpperCase() + value.slice(1)} theme`} key={value} aria-pressed={theme === value} onClick={() => setTheme(value)}>{value.charAt(0).toUpperCase() + value.slice(1)}</button>)}</fieldset>
      </footer>
      {info && <InfoDialog kind={info} onClose={() => setInfo(null)} />}
    </div>
  )
}
