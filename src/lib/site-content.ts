import { choice, deck, fail, flag, group, inFile, items, lines, mapping, number, only, optionalText, pictures, readYaml, text, type Mapping, type Picture } from './content-schema.ts'

export type { Picture }

/**
 * The site's content format. Each file is validated as it loads, and a bad value
 * throws an error naming that file and the exact setting to fix, e.g.
 * `content/pages/me.yaml → featured_artwork: no work in content/media/artworks.yaml has the slug "x"`.
 *
 * Nothing here touches the browser, so the tests read the shipped files through
 * exactly the code the page does.
 */

export const SITE_FILE = 'content/site.yaml'

/** The media collections, one file each, under content/media. */
export const MEDIA_FILES = {
  artworks: 'content/media/artworks.yaml',
  recordings: 'content/media/recordings.yaml',
  papers: 'content/media/papers.yaml',
} as const

/** One file per page, under content/pages. */
export const PAGE_FILES = {
  me: 'content/pages/me.yaml',
  art: 'content/pages/art.yaml',
  music: 'content/pages/music.yaml',
  research: 'content/pages/research.yaml',
  notFound: 'content/pages/not-found.yaml',
} as const

export type PageSources = { [K in keyof typeof PAGE_FILES]: string }
export type MediaSources = { [K in keyof typeof MEDIA_FILES]: string }

export type SiteSources = {
  site: string
  media: MediaSources
  pages: PageSources
}

export const ARTWORK_SIZES = ['large', 'small', 'offset', 'wide'] as const
export const LAYOUT_SIDES = ['left', 'right'] as const
export const TEASER_ORDERS = ['music_first', 'research_first'] as const

/** The site's two looks: the geometric sans it was designed with, and a Times serif. */
export const APPEARANCE_LOOKS = ['classic', 'times'] as const

export type ArtworkSize = (typeof ARTWORK_SIZES)[number]
export type LayoutSide = (typeof LAYOUT_SIDES)[number]
export type TeaserOrder = (typeof TEASER_ORDERS)[number]
export type AppearanceLook = (typeof APPEARANCE_LOOKS)[number]

export type Artwork = {
  slug: string
  title: string
  artist: string
  year: string
  material: string
  description: string
  reference: boolean
  alt: string
  width: number
  height: number
  /** Where a close-up crop looks: `horizontal% vertical%`. */
  crop: string
  /** How much room the work takes in the collection. */
  size: ArtworkSize
  imageId?: string
  image?: string
  srcSet?: string
  closeUp?: string
  highResolution?: string
  source?: string
}

export type Recording = {
  title: string
  kind: string
  image: string
  src?: string
  caption?: string
}

export type Paper = {
  title: string
  url: string | null
  citation?: string
}

export type NavigationItem = { label: string; href: string }
export type Teaser = { title: string; summary: string }

export type Layout = {
  me: { teaserOrder: TeaserOrder; showArtTeaser: boolean; showRegisters: boolean }
  music: { featureSide: LayoutSide; showTopics: boolean }
  detail: { copySide: LayoutSide }
}

export type MeContent = {
  heading: string[]
  /** Optional: a small credit beside the heading. Leave it empty to show nothing. */
  headingAttribution?: string
  introduction: string
  portrait: { image: string; alt: string; lead: string; caption: string; width: number; height: number }
  featuredArtwork: string
  artTeaserHeading: string[]
  teasers: { music: Teaser; research: Teaser }
}

export type ArtContent = {
  heading: string
  introduction: string
}

export type MusicContent = {
  heading: string
  introduction: string
  feature: {
    heading: string
    copy: string
    /** Optional: leave it empty in the content file to hide the line. */
    note?: string
    topics: string[]
    video: { src: string; poster: string; caption?: string; demo: boolean }
  }
  /** Optional: a still that fills the collection grid's open top-left corner. */
  companion?: { image: string; alt: string }
}

export type ResearchContent = {
  heading: string
  introduction: string
  project: { images: Picture[]; heading: string; copy: string; note?: string; paper: string }
  ghp: { title: string; heading: string; copy: string; note?: string; paper: string; images: Picture[] }
  smaller: { title: string; projects: { title: string; copy: string; images: Picture[]; credit: string }[] }
}

export type Pages = {
  me: MeContent
  art: ArtContent
  music: MusicContent
  research: ResearchContent
  notFound: { heading: string; copy: string }
}

/** Everything content/site.yaml holds on its own, before the other files join in. */
export type Spine = {
  name: string
  tagline: string
  preview: { resumeUrl: string | null }
  appearance: { look: AppearanceLook }
  navigation: NavigationItem[]
  layout: Layout
  messages: { paperMissing: string; recordingMissingHeading: string; recordingMissingCopy: string }
  dialogs: {
    resume: { heading: string; paragraphs: string[] }
  }
}

/** The media collections, each in its own file under content/media. */
export type Media = {
  artworks: Artwork[]
  recordings: Recording[]
  papers: Record<string, Paper>
}

export type Site = Spine & Media & { pages: Pages }

export function parseSite(sources: SiteSources): Site {
  const artworks = inFile(MEDIA_FILES.artworks, () => artworksFrom(mapping(readYaml(sources.media.artworks), 'the file')))
  const recordings = inFile(MEDIA_FILES.recordings, () => recordingsFrom(mapping(readYaml(sources.media.recordings), 'the file')))
  const papers = inFile(MEDIA_FILES.papers, () => papersFrom(mapping(readYaml(sources.media.papers), 'the file')))
  const pages: Pages = {
    me: inFile(PAGE_FILES.me, () => mePage(mapping(readYaml(sources.pages.me), 'the page'))),
    art: inFile(PAGE_FILES.art, () => artPage(mapping(readYaml(sources.pages.art), 'the page'))),
    music: inFile(PAGE_FILES.music, () => musicPage(mapping(readYaml(sources.pages.music), 'the page'))),
    research: inFile(PAGE_FILES.research, () => researchPage(mapping(readYaml(sources.pages.research), 'the page'))),
    notFound: inFile(PAGE_FILES.notFound, () => notFoundPage(mapping(readYaml(sources.pages.notFound), 'the page'))),
  }
  const spine = inFile(SITE_FILE, () => spineFrom(mapping(readYaml(sources.site), 'the file')))

  // Cross-references cross files now, so a mistyped slug would otherwise leave a
  // page pointing nowhere. Each error names the file that holds the reference.
  for (const [file, slug] of [[PAGE_FILES.me, pages.me.featuredArtwork]] as const) {
    if (!artworks.some((work) => work.slug === slug)) {
      fail(`${file} → featured_artwork`, `no work in ${MEDIA_FILES.artworks} has the slug "${slug}"`)
    }
  }
  for (const [path, key] of [['project.paper', pages.research.project.paper], ['ghp.paper', pages.research.ghp.paper]] as const) {
    if (!(key in papers)) {
      fail(`${PAGE_FILES.research} → ${path}`, `points at a paper named "${key}", which ${MEDIA_FILES.papers} does not define under papers`)
    }
  }

  return { ...spine, artworks, recordings, papers, pages }
}

function artworkBlocks(file: Mapping): Mapping[] {
  only(file, 'the file', ['artworks'])
  return items(file.artworks, 'artworks')
}

const ARTWORK_KEYS = ['slug', 'title', 'artist', 'year', 'material', 'description', 'reference', 'image_id', 'image', 'src_set',
  'close_up', 'high_resolution', 'source', 'alt', 'width', 'height', 'crop', 'size'] as const

function artworksFrom(file: Mapping): Artwork[] {
  const artworks: Artwork[] = artworkBlocks(file).map((item, index) => {
    const where = `artworks[${index}]`
    only(item, where, ARTWORK_KEYS)
    const slug = text(item, 'slug', where)
    if (!/^[a-z0-9-]+$/.test(slug)) fail(`${where}.slug`, 'uses only lower-case letters, numbers, and hyphens')
    return {
      slug,
      title: text(item, 'title', where),
      artist: text(item, 'artist', where),
      year: text(item, 'year', where),
      material: text(item, 'material', where),
      description: text(item, 'description', where),
      reference: flag(item, 'reference', where),
      alt: text(item, 'alt', where),
      width: number(item, 'width', where),
      height: number(item, 'height', where),
      crop: optionalText(item, 'crop', where) ?? '50% 50%',
      size: choice(item, 'size', where, ARTWORK_SIZES),
      imageId: optionalText(item, 'image_id', where),
      image: optionalText(item, 'image', where),
      srcSet: optionalText(item, 'src_set', where),
      closeUp: optionalText(item, 'close_up', where),
      highResolution: optionalText(item, 'high_resolution', where),
      source: optionalText(item, 'source', where),
    }
  })
  if (new Set(artworks.map((work) => work.slug)).size !== artworks.length) {
    fail('artworks', 'uses the same slug twice. Each work needs its own slug')
  }
  return artworks
}

function recordingsFrom(file: Mapping): Recording[] {
  only(file, 'the file', ['recordings'])
  return items(file.recordings, 'recordings').map((item, index) => {
    const where = `recordings[${index}]`
    only(item, where, ['title', 'kind', 'image', 'src', 'caption'])
    return {
      title: text(item, 'title', where),
      kind: text(item, 'kind', where),
      image: text(item, 'image', where),
      src: optionalText(item, 'src', where),
      caption: optionalText(item, 'caption', where),
    }
  })
}

function papersFrom(file: Mapping): Record<string, Paper> {
  only(file, 'the file', ['papers'])
  const block = group(file, 'papers', '')
  const papers: Record<string, Paper> = {}
  for (const [key, value] of Object.entries(block)) {
    const where = `papers.${key}`
    const entry = mapping(value, where)
    only(entry, where, ['title', 'citation', 'url'])
    papers[key] = { title: text(entry, 'title', where), citation: optionalText(entry, 'citation', where), url: optionalText(entry, 'url', where) ?? null }
  }
  return papers
}

function mePage(page: Mapping): MeContent {
  only(page, 'the page', ['heading', 'heading_attribution', 'introduction', 'portrait', 'featured_artwork', 'art_teaser', 'teasers'])
  const portrait = group(page, 'portrait', '')
  const artTeaser = group(page, 'art_teaser', '')
  const teasers = group(page, 'teasers', '')
  const teaser = (key: 'music' | 'research'): Teaser => {
    const block = group(teasers, key, 'teasers')
    return { title: text(block, 'title', `teasers.${key}`), summary: text(block, 'summary', `teasers.${key}`) }
  }
  return {
    heading: lines(page.heading, 'heading'),
    headingAttribution: optionalText(page, 'heading_attribution', ''),
    introduction: text(page, 'introduction', ''),
    portrait: {
      image: text(portrait, 'image', 'portrait'),
      alt: text(portrait, 'alt', 'portrait'),
      lead: text(portrait, 'lead', 'portrait'),
      caption: text(portrait, 'caption', 'portrait'),
      width: number(portrait, 'width', 'portrait'),
      height: number(portrait, 'height', 'portrait'),
    },
    featuredArtwork: text(page, 'featured_artwork', ''),
    artTeaserHeading: lines(artTeaser.heading, 'art_teaser.heading'),
    teasers: { music: teaser('music'), research: teaser('research') },
  }
}

function artPage(page: Mapping): ArtContent {
  only(page, 'the page', ['heading', 'introduction'])
  return {
    heading: text(page, 'heading', ''),
    introduction: text(page, 'introduction', ''),
  }
}

function musicPage(page: Mapping): MusicContent {
  only(page, 'the page', ['heading', 'introduction', 'feature', 'companion'])
  const feature = group(page, 'feature', '')
  const video = group(feature, 'video', 'feature')
  const companionBlock = page.companion === undefined ? undefined : group(page, 'companion', '')
  if (companionBlock) only(companionBlock, 'companion', ['image', 'alt'])
  const companionImage = companionBlock ? optionalText(companionBlock, 'image', 'companion') : undefined
  const companion = companionBlock && companionImage ? { image: companionImage, alt: text(companionBlock, 'alt', 'companion') } : undefined
  return {
    heading: text(page, 'heading', ''),
    introduction: text(page, 'introduction', ''),
    companion,
    feature: {
      heading: text(feature, 'heading', 'feature'),
      copy: text(feature, 'copy', 'feature'),
      note: optionalText(feature, 'note', 'feature'),
      topics: lines(feature.topics, 'feature.topics'),
      video: {
        src: text(video, 'src', 'feature.video'),
        poster: text(video, 'poster', 'feature.video'),
        caption: optionalText(video, 'caption', 'feature.video'),
        demo: flag(video, 'demo', 'feature.video'),
      },
    },
  }
}

function researchPage(page: Mapping): ResearchContent {
  only(page, 'the page', ['heading', 'introduction', 'project', 'ghp', 'smaller'])
  const project = group(page, 'project', '')
  only(project, 'project', ['image', 'alt', 'images', 'heading', 'copy', 'note', 'paper'])
  const ghp = group(page, 'ghp', '')
  only(ghp, 'ghp', ['title', 'heading', 'copy', 'note', 'images', 'paper'])
  const smaller = group(page, 'smaller', '')
  const research: ResearchContent = {
    heading: text(page, 'heading', ''),
    introduction: text(page, 'introduction', ''),
    project: {
      images: pictures(project, 'project'),
      heading: text(project, 'heading', 'project'),
      copy: text(project, 'copy', 'project'),
      note: optionalText(project, 'note', 'project'),
      paper: text(project, 'paper', 'project'),
    },
    ghp: {
      title: text(ghp, 'title', 'ghp'),
      heading: text(ghp, 'heading', 'ghp'),
      copy: text(ghp, 'copy', 'ghp'),
      note: optionalText(ghp, 'note', 'ghp'),
      paper: text(ghp, 'paper', 'ghp'),
      images: deck(ghp.images, 'ghp.images'),
    },
    smaller: {
      title: text(smaller, 'title', 'smaller'),
      projects: items(smaller.projects, 'smaller.projects').map((entry, index) => {
        const where = `smaller.projects[${index}]`
        only(entry, where, ['title', 'copy', 'image', 'alt', 'images', 'credit'])
        return {
          title: text(entry, 'title', where),
          copy: text(entry, 'copy', where),
          images: pictures(entry, where),
          credit: text(entry, 'credit', where),
        }
      }),
    },
  }
  // The GHP pair is an unequal two-image composition: wider first, taller second.
  if (research.ghp.images.length !== 2) {
    fail('ghp.images', 'needs exactly two images: the wider one first, then the taller one')
  }
  return research
}

function notFoundPage(page: Mapping): { heading: string; copy: string } {
  only(page, 'the page', ['heading', 'copy'])
  return { heading: text(page, 'heading', ''), copy: text(page, 'copy', '') }
}

function spineFrom(root: Mapping): Spine {
  only(root, 'the file', ['site', 'preview', 'appearance', 'navigation', 'layout', 'messages', 'dialogs'])

  const identity = group(root, 'site', '')
  only(identity, 'site', ['name', 'tagline'])
  const preview = group(root, 'preview', '')
  only(preview, 'preview', ['resume_url'])
  const appearance = group(root, 'appearance', '')
  only(appearance, 'appearance', ['look'])

  const navigation = items(root.navigation, 'navigation').map((item, index) => {
    const where = `navigation[${index}]`
    only(item, where, ['label', 'href'])
    return { label: text(item, 'label', where), href: text(item, 'href', where) }
  })

  const layoutBlock = group(root, 'layout', '')
  only(layoutBlock, 'layout', ['me', 'music', 'detail'])
  const meLayout = group(layoutBlock, 'me', 'layout')
  only(meLayout, 'layout.me', ['teaser_order', 'show_art_teaser', 'show_registers'])
  const musicLayout = group(layoutBlock, 'music', 'layout')
  only(musicLayout, 'layout.music', ['feature_side', 'show_topics'])
  const detailLayout = group(layoutBlock, 'detail', 'layout')
  only(detailLayout, 'layout.detail', ['copy_side'])
  const layout: Layout = {
    me: {
      teaserOrder: choice(meLayout, 'teaser_order', 'layout.me', TEASER_ORDERS),
      showArtTeaser: flag(meLayout, 'show_art_teaser', 'layout.me'),
      showRegisters: flag(meLayout, 'show_registers', 'layout.me'),
    },
    music: {
      featureSide: choice(musicLayout, 'feature_side', 'layout.music', LAYOUT_SIDES),
      showTopics: flag(musicLayout, 'show_topics', 'layout.music'),
    },
    detail: { copySide: choice(detailLayout, 'copy_side', 'layout.detail', LAYOUT_SIDES) },
  }

  const messagesBlock = group(root, 'messages', '')
  only(messagesBlock, 'messages', ['paper_missing', 'recording_missing_heading', 'recording_missing_copy'])

  const dialogsBlock = group(root, 'dialogs', '')
  only(dialogsBlock, 'dialogs', ['resume'])
  const resumeDialog = group(dialogsBlock, 'resume', 'dialogs')
  only(resumeDialog, 'dialogs.resume', ['heading', 'paragraphs'])

  return {
    name: text(identity, 'name', 'site'),
    tagline: text(identity, 'tagline', 'site'),
    preview: { resumeUrl: optionalText(preview, 'resume_url', 'preview') ?? null },
    appearance: { look: choice(appearance, 'look', 'appearance', APPEARANCE_LOOKS) },
    navigation,
    layout,
    messages: {
      paperMissing: text(messagesBlock, 'paper_missing', 'messages'),
      recordingMissingHeading: text(messagesBlock, 'recording_missing_heading', 'messages'),
      recordingMissingCopy: text(messagesBlock, 'recording_missing_copy', 'messages'),
    },
    dialogs: {
      resume: { heading: text(resumeDialog, 'heading', 'dialogs.resume'), paragraphs: lines(resumeDialog.paragraphs, 'dialogs.resume.paragraphs') },
    },
  }
}

export function artImage(work: Artwork, size = 1000) {
  if (size >= 2000 && work.highResolution) return work.highResolution
  if (work.image) return work.image
  if (!work.imageId) throw new Error(`Artwork "${work.slug}" needs an image or imageId.`)
  return `https://www.artic.edu/iiif/2/${work.imageId}/full/${size},/0/default.jpg`
}

export function artSrcSet(work: Artwork) {
  if (work.srcSet) return work.srcSet
  if (work.image) return undefined
  return [400, 800, 1200, 1680].map((size) => `${artImage(work, size)} ${size}w`).join(', ')
}
