import { Fragment, useState, type CSSProperties } from 'react'
import { artImage, artSrcSet, artworks, layout, messages, navigationLabel, pages, papers, recordings, type Artwork, type Paper } from '@/content'
import { Image, Inspector } from '@/components/Media'
import { VideoPlayer } from '@/components/VideoPlayer'
import { PageLink } from '@/components/PageLink'

/** A heading that keeps the author's line breaks, one line per list item in the content file. */
function HeadingLines({ lines }: { lines: string[] }) {
  return <>{lines.map((line, index) => <Fragment key={`${index}-${line}`}>{index > 0 && <br />}{line}</Fragment>)}</>
}

function artworkBySlug(slug: string) {
  const work = artworks.find((item) => item.slug === slug)
  if (!work) throw new Error(`content/site.yaml names a featured artwork that does not exist: ${slug}`)
  return work
}

export function MePage() {
  const home = pages.home
  const featured = artworkBySlug(home.featuredArtwork)
  const artLabel = navigationLabel('/art')
  const registers = layout.home.teaserOrder === 'research_first'
    ? [{ key: 'research' as const, href: '/research', cursor: 'Discover' }, { key: 'music' as const, href: '/music', cursor: 'Listen' }]
    : [{ key: 'music' as const, href: '/music', cursor: 'Listen' }, { key: 'research' as const, href: '/research', cursor: 'Discover' }]
  return (
    <>
      <section className="me-hero" aria-label="Introduction">
        <div className="me-introduction enter">
          <h2 className="kinetic-heading">{home.heading.map((line) => <span key={line}><span>{line}</span></span>)}</h2>
          <p>{home.introduction}</p>
          <PageLink href="/art" data-magnetic data-cursor="Explore art" className="text-link">{artLabel} <span aria-hidden="true">↗</span></PageLink>
        </div>
        <figure className="portrait enter enter-delay" data-depth>
          <Image src={home.portrait.image} alt={home.portrait.alt} width={home.portrait.width} height={home.portrait.height} fetchPriority="high" />
          <figcaption><span>{home.portrait.lead}</span><p>{home.portrait.caption}</p></figcaption>
        </figure>
      </section>
      {layout.home.showArtTeaser && (
        <section className="me-art reveal" aria-label="Discover the art collection">
          <div className="me-art-title"><h2><HeadingLines lines={home.artTeaserHeading} /></h2><PageLink href="/art" data-magnetic data-cursor="Explore art" className="text-link">{artLabel} <span aria-hidden="true">↗</span></PageLink></div>
          <figure>
            <PageLink href={`/art/${featured.slug}`} id="me-featured-art" data-cursor="View work" className="art-image-link" aria-label={`View ${featured.title}`}>
              <Image className="linked-image" src={artImage(featured)} srcSet={artSrcSet(featured)} sizes="(max-width: 767px) 100vw, 55vw" alt={featured.alt} width={featured.width} height={featured.height} loading="lazy" workSlug={featured.slug} />
            </PageLink>
            <figcaption className="work-caption"><span>{featured.title}</span><span>{featured.artist}, {featured.year}.</span></figcaption>
          </figure>
        </section>
      )}
      {layout.home.showRegisters && (
        <section className="other-registers reveal" aria-label="Music and research">
          {registers.map(({ key, href, cursor }) => <PageLink key={key} data-cursor={cursor} href={href}><span>{home.teasers[key].title}</span><span>{home.teasers[key].summary}</span><span aria-hidden="true">↗</span></PageLink>)}
        </section>
      )}
    </>
  )
}

function WorkCard({ work }: { work: Artwork }) {
  return (
    <article className={`work-card reveal work-${work.size}`}>
      <PageLink href={`/art/${work.slug}`} id={`work-${work.slug}`} data-cursor="View work" className="art-image-link" aria-describedby={`description-${work.slug}`} aria-label={`View ${work.title}`}>
        <Image className="linked-image" src={artImage(work)} srcSet={artSrcSet(work)} sizes="(max-width: 767px) 100vw, 50vw" alt={work.alt} width={work.width} height={work.height} loading="lazy" workSlug={work.slug} />
      </PageLink>
      <div className="work-caption"><h2>{work.title}</h2><span>{work.year}</span></div>
      <p className="work-credit">{work.artist}.</p>
      <div className="work-description" id={`description-${work.slug}`}><span>{work.material}</span><p>{work.description}</p></div>
      <details className="work-mobile-description"><summary>Details <span aria-hidden="true">+</span></summary><div><span>{work.material}</span><p>{work.description}</p></div></details>
    </article>
  )
}

export function ArtPage() {
  const featured = artworkBySlug(pages.art.featuredArtwork)
  const collection = artworks.filter((work) => work.slug !== featured.slug)
  return (
    <>
      <div className="page-heading enter"><h1 id="page-title" tabIndex={-1}>{pages.art.heading}</h1><p>{pages.art.introduction}</p></div>
      <section className="art-feature enter enter-delay" data-side={layout.art.closeUpSide} aria-label="Featured artwork">
        <div className="featured-work">
          <PageLink href={`/art/${featured.slug}`} id={`work-${featured.slug}`} data-cursor="View work" className="art-image-link" aria-describedby="featured-description">
            <Image className="linked-image" src={artImage(featured)} srcSet={artSrcSet(featured)} sizes="(max-width: 767px) 100vw, 60vw" alt={featured.alt} width={featured.width} height={featured.height} fetchPriority="high" workSlug={featured.slug} />
          </PageLink>
          <div className="work-caption"><h2>{featured.title}</h2><span>{featured.year}</span></div>
          <p className="work-credit">{featured.artist}.</p>
          <details className="featured-mobile-details"><summary>Details <span aria-hidden="true">+</span></summary><p>{featured.description}</p></details>
        </div>
        <aside className="inspection-pane" id="featured-description">
          <div className="inspection-crop" data-depth>
            <Image className={featured.closeUp ? '' : 'crop-image'} src={featured.closeUp ?? artImage(featured, 1680)} alt={`Detail of ${featured.title}.`} width={800} height={800} style={{ '--crop-position': featured.crop } as CSSProperties} />
          </div>
          <div className="inspection-text"><h2>{pages.art.closeUpHeading}</h2><p>{featured.material}</p><p className="featured-hover-description">{featured.description}</p><PageLink data-magnetic data-cursor="View details" href={`/art/${featured.slug}`} className="text-link">Inspect work <span aria-hidden="true">↗</span></PageLink></div>
        </aside>
      </section>
      <div className="art-collection" aria-label="More artworks">
        {collection.map((work) => <WorkCard key={work.slug} work={work} />)}
      </div>
    </>
  )
}

export function ArtworkPage({ work }: { work: Artwork }) {
  const [inspecting, setInspecting] = useState(false)
  return (
    <>
      <div className="detail-actions enter">
        <PageLink href="/art" data-magnetic data-cursor="Back to Art" className="button button-quiet back-link"><span aria-hidden="true">←</span> Back to Art</PageLink>
      </div>
      <article className="artwork-detail" data-copy={layout.detail.copySide}>
        <div className="detail-image">
          {/* The work itself is the inspect control. Nothing is drawn over the image, so the
              cursor hint and the focus ring carry the affordance. */}
          <div className="detail-image-frame" style={{ '--image-ratio-v': work.width / work.height } as CSSProperties}>
            <Image src={artImage(work, 1680)} srcSet={artSrcSet(work)} sizes="(max-width: 767px) 100vw, 65vw" alt={work.alt} width={work.width} height={work.height} fetchPriority="high" workSlug={work.slug} />
            <button type="button" data-cursor="Inspect" className="detail-inspect" aria-label={`Inspect work: ${work.title}`} onClick={() => setInspecting(true)} />
          </div>
        </div>
        <div className="detail-copy enter">
          <h1 id="page-title" tabIndex={-1}>{work.title}</h1>
          <p className="detail-artist">{work.artist}</p>
          <dl><div><dt>Year</dt><dd>{work.year}</dd></div><div><dt>Material</dt><dd>{work.material}</dd></div></dl>
          <p>{work.description}</p>
          {work.source && <div className="source-note"><a href={work.source} target="_blank" rel="noreferrer" className="text-link">{work.reference ? 'Museum source' : 'Source'} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a></div>}
        </div>
      </article>
      {inspecting && <Inspector work={work} onClose={() => setInspecting(false)} />}
    </>
  )
}

export function MusicPage() {
  const music = pages.music
  const video = music.feature.video
  const [openRecording, setOpenRecording] = useState<string | null>(null)
  return (
    <>
      <div className="page-heading enter"><h1 id="page-title" tabIndex={-1}>{music.heading}</h1><p>{music.introduction}</p></div>
      <section className="music-feature enter enter-delay" data-side={layout.music.featureSide} aria-label="Featured recording and experiences">
        <VideoPlayer autoplay label="Featured demo video" src={video.src} poster={video.poster} caption={video.caption} demo={video.demo} />
        <div className="music-experience"><h2>{music.feature.heading}</h2><p>{music.feature.copy}</p>{music.feature.note && <p className="preview-copy">{music.feature.note}</p>}{layout.music.showTopics && <div className="music-topics">{music.feature.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>}</div>
      </section>
      <section className="recording-collection" aria-label="Repertoire and recordings">
        {recordings.map((recording, index) => <article key={recording.title} className={`recording reveal recording-${index}`}>
          <Image src={recording.image} alt={`Stock music photograph for the ${recording.title} recording slot.`} width={1200} height={800} loading="lazy" />
          <div className="recording-caption"><h2>{recording.title}</h2><button data-magnetic data-cursor={openRecording === recording.title ? 'Close' : 'Play recording'} className="text-link" aria-label={`${openRecording === recording.title ? 'Close' : 'Open'} ${recording.title} recording`} aria-controls={`recording-${index}`} aria-expanded={openRecording === recording.title} onClick={() => setOpenRecording((current) => current === recording.title ? null : recording.title)}>{openRecording === recording.title ? 'Close' : 'Recording'} <span aria-hidden="true">{openRecording === recording.title ? '−' : '+'}</span></button></div>
          <p className="work-credit">{recording.kind}.</p>
          <div id={`recording-${index}`} hidden={openRecording !== recording.title}>{openRecording === recording.title && (recording.src ? <VideoPlayer src={recording.src} poster={recording.image} label={recording.title} caption={recording.caption ?? ''} demo={false} /> : <div className="recording-empty" role="status"><p>{messages.recordingMissingHeading}</p><p>{messages.recordingMissingCopy}</p></div>)}</div>
        </article>)}
      </section>
    </>
  )
}

function PaperWidget({ paper }: { paper: Paper }) {
  return <div className="paper-widget" data-light><span className="paper-label">Research paper</span><h3>{paper.title}</h3><p>{paper.citation ?? messages.paperMissing}</p>{paper.url ? <a data-magnetic data-cursor="Read paper" className="text-link paper-open" href={paper.url} target="_blank" rel="noreferrer">Open paper <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a> : <span className="paper-unavailable">Document pending</span>}</div>
}

export function ResearchPage() {
  const research = pages.research
  return (
    <>
      <div className="page-heading enter"><h1 id="page-title" tabIndex={-1}>{research.heading}</h1><p>{research.introduction}</p></div>
      <section className="research-project enter enter-delay" aria-labelledby="research-project-title">
        <Image src={research.project.image} alt={research.project.alt} width={1600} height={1000} fetchPriority="high" />
        <div className="research-project-copy"><h2 id="research-project-title">{research.project.heading}</h2><p>{research.project.copy}</p>{research.project.note && <p className="preview-copy">{research.project.note}</p>}</div>
        <PaperWidget paper={papers[research.project.paper]} />
      </section>
      <section className="ghp-section reveal" aria-labelledby="ghp-title">
        <h2 id="ghp-title">{research.ghp.title}</h2>
        <div className="ghp-images">{research.ghp.images.map((image, index) => <Image key={image.image} src={image.image} alt={image.alt} width={index === 0 ? 1100 : 900} height={index === 0 ? 1000 : 1100} loading="lazy" />)}</div>
        <div className="ghp-copy"><div><h3>{research.ghp.heading}</h3><p>{research.ghp.copy}</p>{research.ghp.note && <p className="preview-copy">{research.ghp.note}</p>}</div><PaperWidget paper={papers[research.ghp.paper]} /></div>
      </section>
      <section className="smaller-projects reveal" aria-labelledby="smaller-projects-title"><h2 id="smaller-projects-title">{research.smaller.title}</h2><div className="small-project-grid">{research.smaller.projects.map((project) => <article key={project.title}><Image src={project.image} alt={project.alt} width={1000} height={750} loading="lazy" /><h3>{project.title}</h3><p>{project.copy}</p><span className="work-credit">{project.credit}</span></article>)}</div></section>
    </>
  )
}

export function NotFoundPage() {
  return <section className="not-found"><h1 id="page-title" tabIndex={-1}>{pages.notFound.heading}</h1><p>{pages.notFound.copy}</p><PageLink href="/art" className="button">{navigationLabel('/art')} <span aria-hidden="true">↗</span></PageLink></section>
}
