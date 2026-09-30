import { useState, type CSSProperties } from 'react'
import { artImage, artSrcSet, artworks, portfolio, previewAssets, recordings, type Artwork, type Paper } from '@/content'
import { Image, Inspector } from '@/components/Media'
import { VideoPlayer } from '@/components/VideoPlayer'
import { PageLink } from '@/components/PageLink'

export function MePage() {
  return (
    <>
      <section className="me-hero" aria-label="Introduction">
        <div className="me-introduction enter">
          <h2 className="kinetic-heading"><span><span>Art, music,</span></span><span><span>research.</span></span></h2>
          <p>{portfolio.introduction}</p>
          <PageLink href="/art" data-magnetic data-cursor="Explore art" className="text-link">Art <span aria-hidden="true">↗</span></PageLink>
        </div>
        <figure className="portrait enter enter-delay" data-depth>
          <Image src={portfolio.portrait} alt={portfolio.portraitAlt} width={900} height={1125} fetchPriority="high" />
          <figcaption><span>A portfolio in four parts.</span><p>{portfolio.portraitCaption}</p></figcaption>
        </figure>
      </section>
      <section className="me-art reveal" aria-label="Discover the art collection">
        <div className="me-art-title"><h2>Look a little<br />closer.</h2><PageLink href="/art" data-magnetic data-cursor="Explore art" className="text-link">Art <span aria-hidden="true">↗</span></PageLink></div>
        <figure>
          <PageLink href="/art/improvisation" id="me-featured-art" data-cursor="View work" className="art-image-link" aria-label="View reference artwork: Improvisation No. 30">
            <Image className="linked-image" src={artImage(artworks[0])} srcSet={artSrcSet(artworks[0])} sizes="(max-width: 767px) 100vw, 55vw" alt={artworks[0].alt} width={artworks[0].width} height={artworks[0].height} loading="lazy" workSlug={artworks[0].slug} />
          </PageLink>
          <figcaption className="work-caption"><span>{artworks[0].title}</span><span>{artworks[0].artist}, {artworks[0].year}.{artworks[0].reference && ' Reference image.'}</span></figcaption>
        </figure>
      </section>
      <section className="other-registers reveal" aria-label="Music and research">
        <PageLink data-cursor="Listen" href="/music"><span>Music</span><span>Listening, rehearsal, performance.</span><span aria-hidden="true">↗</span></PageLink>
        <PageLink data-cursor="Discover" href="/research"><span>Research</span><span>Projects, papers, questions.</span><span aria-hidden="true">↗</span></PageLink>
      </section>
    </>
  )
}

function WorkCard({ work }: { work: Artwork }) {
  return (
    <article className={`work-card reveal ${work.layout}`}>
      <PageLink href={`/art/${work.slug}`} id={`work-${work.slug}`} data-cursor="View work" className="art-image-link" aria-describedby={`description-${work.slug}`} aria-label={`View ${work.title}`}>
        <Image className="linked-image" src={artImage(work)} srcSet={artSrcSet(work)} sizes="(max-width: 767px) 100vw, 50vw" alt={work.alt} width={work.width} height={work.height} loading="lazy" workSlug={work.slug} />
      </PageLink>
      <div className="work-caption"><h2>{work.title}</h2><span>{work.year}</span></div>
      <p className="work-credit">{work.artist}.{work.reference && ' Public-domain reference.'}</p>
      <div className="work-description" id={`description-${work.slug}`}><span>{work.material}</span><p>{work.description}</p></div>
      <details className="work-mobile-description"><summary>Details <span aria-hidden="true">+</span></summary><div><span>{work.material}</span><p>{work.description}</p></div></details>
    </article>
  )
}

export function ArtPage() {
  const featured = artworks[0]
  return (
    <>
      <div className="page-heading enter"><h1 id="page-title" tabIndex={-1}>Art</h1><p>A collection at two distances. The whole image, then the details.</p></div>
      <section className="art-feature enter enter-delay" aria-label="Featured reference artwork">
        <div className="featured-work">
          <PageLink href={`/art/${featured.slug}`} id={`work-${featured.slug}`} data-cursor="View work" className="art-image-link" aria-describedby="featured-description">
            <Image className="linked-image" src={artImage(featured)} srcSet={artSrcSet(featured)} sizes="(max-width: 767px) 100vw, 60vw" alt={featured.alt} width={featured.width} height={featured.height} fetchPriority="high" workSlug={featured.slug} />
          </PageLink>
          <div className="work-caption"><h2>{featured.title}</h2><span>{featured.year}</span></div>
          <p className="work-credit">{featured.artist}.{featured.reference && ' Public-domain reference.'}</p>
          <details className="featured-mobile-details"><summary>Details <span aria-hidden="true">+</span></summary><p>{featured.description}</p></details>
        </div>
        <aside className="inspection-pane" id="featured-description">
          <div className="inspection-crop" data-depth>
            <Image className={featured.closeUp ? '' : 'crop-image'} src={featured.closeUp ?? artImage(featured, 1680)} alt={`Detail of ${featured.title}.`} width={800} height={800} style={{ '--crop-position': featured.position } as CSSProperties} />
          </div>
          <div className="inspection-text"><h2>A closer look</h2><p>{featured.material}</p><p className="featured-hover-description">{featured.description}</p><PageLink data-magnetic data-cursor="View details" href={`/art/${featured.slug}`} className="text-link">Inspect work <span aria-hidden="true">↗</span></PageLink></div>
        </aside>
      </section>
      <div className="art-collection" aria-label="More reference artworks">
        {artworks.slice(1).map((work) => <WorkCard key={work.slug} work={work} />)}
      </div>
      {portfolio.preview && <p className="collection-note">These works are public-domain references from the Art Institute of Chicago, not artworks by Yujin Kim.</p>}
    </>
  )
}

export function ArtworkPage({ work }: { work: Artwork }) {
  const [inspecting, setInspecting] = useState(false)
  return (
    <>
      <PageLink href="/art" className="text-link back-link"><span aria-hidden="true">←</span> Back to Art</PageLink>
      <article className="artwork-detail">
        <div className="detail-image">
          <Image src={artImage(work, 1680)} srcSet={artSrcSet(work)} sizes="(max-width: 767px) 100vw, 65vw" alt={work.alt} width={work.width} height={work.height} fetchPriority="high" workSlug={work.slug} />
          <button data-magnetic data-cursor="Zoom in" className="text-link inspect-trigger" onClick={() => setInspecting(true)}>Inspect work <span aria-hidden="true">↗</span></button>
        </div>
        <div className="detail-copy enter">
          <h1 id="page-title" tabIndex={-1}>{work.title}</h1>
          <p className="detail-artist">{work.artist}</p>
          <dl><div><dt>Year</dt><dd>{work.year}</dd></div><div><dt>Material</dt><dd>{work.material}</dd></div></dl>
          <p>{work.description}</p>
          {(work.reference || work.source) && <div className="reference-note">{work.reference && <p>Public-domain reference image. This preview does not represent Yujin’s work.</p>}{work.source && <a href={work.source} target="_blank" rel="noreferrer" className="text-link">{work.reference ? 'Museum source' : 'Source'} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>}</div>}
        </div>
      </article>
      {inspecting && <Inspector work={work} onClose={() => setInspecting(false)} />}
    </>
  )
}

export function MusicPage() {
  const [openRecording, setOpenRecording] = useState<string | null>(null)
  return (
    <>
      <div className="page-heading enter"><h1 id="page-title" tabIndex={-1}>Music</h1><p>Room for sound. Time to listen.</p></div>
      <section className="music-feature enter enter-delay" aria-label="Featured recording and experiences">
        <VideoPlayer autoplay label="Featured demo video" />
        <div className="music-experience"><h2>In practice.</h2><p>Rehearsal, repertoire, and performance belong here.</p><p className="preview-copy">Yujin’s experiences and a featured recording have not been supplied yet. This player uses clearly identified demo footage.</p><div className="music-topics"><span>Solo</span><span>Ensemble</span><span>Performance</span></div></div>
      </section>
      <section className="recording-collection" aria-label="Repertoire and recordings">
        {recordings.map((recording, index) => <article key={recording.title} className={`recording reveal recording-${index}`}>
          <Image src={recording.image} alt={`Stock music photograph for the ${recording.title} recording slot.`} width={1200} height={800} loading="lazy" />
          <div className="recording-caption"><h2>{recording.title}</h2><button data-magnetic data-cursor={openRecording === recording.title ? 'Close' : 'Play recording'} className="text-link" aria-label={`${openRecording === recording.title ? 'Close' : 'Open'} ${recording.title} recording`} aria-controls={`recording-${index}`} aria-expanded={openRecording === recording.title} onClick={() => setOpenRecording((current) => current === recording.title ? null : recording.title)}>{openRecording === recording.title ? 'Close' : 'Recording'} <span aria-hidden="true">{openRecording === recording.title ? '−' : '+'}</span></button></div>
          <p className="work-credit">{recording.kind}.{portfolio.preview && ' Preview photograph.'}</p>
          <div id={`recording-${index}`} hidden={openRecording !== recording.title}>{openRecording === recording.title && (recording.src ? <VideoPlayer src={recording.src} poster={recording.image} label={recording.title} caption={recording.caption ?? ''} demo={false} /> : <div className="recording-empty" role="status"><p>Recording not supplied yet.</p><p>This space is ready for Yujin’s video, a poster, and performance notes.</p></div>)}</div>
        </article>)}
      </section>
    </>
  )
}

function PaperWidget({ paper }: { paper: Paper }) {
  return <div className="paper-widget" data-light><span className="paper-label">Research paper</span><h3>{paper.title}</h3><p>{paper.citation ?? 'The paper and publication details have not been supplied.'}</p>{paper.href ? <a data-magnetic data-cursor="Read paper" className="text-link paper-open" href={paper.href} target="_blank" rel="noreferrer">Open paper <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a> : <span className="paper-unavailable">Document pending</span>}</div>
}

export function ResearchPage() {
  return (
    <>
      <div className="page-heading enter"><h1 id="page-title" tabIndex={-1}>Research</h1><p>Questions, experiments, and the work of finding out.</p></div>
      <section className="research-project enter enter-delay" aria-labelledby="research-project-title">
        <Image src={previewAssets.research} alt="Stock laboratory photograph used as a research project reference." width={1600} height={1000} fetchPriority="high" />
        <div className="research-project-copy"><h2 id="research-project-title">An inquiry in progress.</h2><p>A space for Yujin’s projects, their questions, and what the work revealed.</p><p className="preview-copy">Project images, descriptions, and research findings are awaiting approved content. The laboratory image is a stock reference.</p></div>
        <PaperWidget paper={portfolio.papers.project} />
      </section>
      <section className="ghp-section reveal" aria-labelledby="ghp-title">
        <h2 id="ghp-title">GHP</h2>
        <div className="ghp-images"><Image src={previewAssets.microscope} alt="Stock image of a microscope in a laboratory." width={1100} height={1000} loading="lazy" /><Image src={previewAssets.notebook} alt="Stock photograph of notes on an open desk." width={900} height={1100} loading="lazy" /></div>
        <div className="ghp-copy"><div><h3>Observations into ideas.</h3><p>GHP images, experiences, and the paper written there will appear here.</p><p className="preview-copy">Reference photography is shown until Yujin’s material is provided.</p></div><PaperWidget paper={portfolio.papers.ghp} /></div>
      </section>
      <section className="smaller-projects reveal" aria-labelledby="smaller-projects-title"><h2 id="smaller-projects-title">Smaller projects</h2><div className="small-project-grid"><article><Image src={previewAssets.notebook} alt="Reference photograph of a notebook for a smaller project." width={1000} height={750} loading="lazy" /><h3>Project notes</h3><p>A place for a project’s question, process, and outcome.</p><span className="work-credit">Preview slot. Project not supplied.</span></article><article><Image src={previewAssets.microscope} alt="Reference laboratory photograph for a smaller experiment." width={1000} height={750} loading="lazy" /><h3>An experiment</h3><p>Images and a short account of the work will live here.</p><span className="work-credit">Preview slot. Project not supplied.</span></article></div></section>
    </>
  )
}

export function NotFoundPage() {
  return <section className="not-found"><h1 id="page-title" tabIndex={-1}>Nothing here, yet.</h1><p>This page could not be found. The collection is a good place to start.</p><PageLink href="/art" className="button">Art <span aria-hidden="true">↗</span></PageLink></section>
}
