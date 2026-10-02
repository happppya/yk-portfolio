import { parse as parseYaml } from 'yaml'

/**
 * The site's content format: [content/site.yaml](../../content/site.yaml) is the
 * single source of truth, and this module turns it into typed records.
 *
 * Nothing here is imported by the browser's content path except through
 * [src/content.ts](../content.ts), so the parser can be tested directly in Node.
 *
 * Editing rules for a non-technical author: every field we read is validated, and
 * a bad value throws an error that names the exact YAML path and the allowed
 * choices, e.g. `content/site.yaml → layout.art.close_up_side: must be one of: left, right`.
 */

export const CONTENT_FILE = 'content/site.yaml'

export const ARTWORK_SIZES = ['large', 'small', 'offset', 'wide'] as const
export const LAYOUT_SIDES = ['left', 'right'] as const
export const TEASER_ORDERS = ['music_first', 'research_first'] as const

export type ArtworkSize = (typeof ARTWORK_SIZES)[number]
export type LayoutSide = (typeof LAYOUT_SIDES)[number]
export type TeaserOrder = (typeof TEASER_ORDERS)[number]

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
  home: { teaserOrder: TeaserOrder; showArtTeaser: boolean; showRegisters: boolean }
  art: { closeUpSide: LayoutSide }
  music: { featureSide: LayoutSide; showTopics: boolean }
  detail: { copySide: LayoutSide }
}

export type HomeContent = {
  heading: string[]
  introduction: string
  portrait: { image: string; alt: string; lead: string; caption: string; width: number; height: number }
  featuredArtwork: string
  artTeaserHeading: string[]
  teasers: { music: Teaser; research: Teaser }
}

export type ArtContent = {
  heading: string
  introduction: string
  featuredArtwork: string
  closeUpHeading: string
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
}

export type ResearchContent = {
  heading: string
  introduction: string
  project: { image: string; alt: string; heading: string; copy: string; note?: string; paper: string }
  ghp: { title: string; heading: string; copy: string; note?: string; paper: string; images: { image: string; alt: string }[] }
  smaller: { title: string; projects: { title: string; copy: string; image: string; alt: string; credit: string }[] }
}

export type Site = {
  name: string
  tagline: string
  preview: { enabled: boolean; resumeUrl: string | null }
  navigation: NavigationItem[]
  layout: Layout
  pages: {
    home: HomeContent
    art: ArtContent
    music: MusicContent
    research: ResearchContent
    notFound: { heading: string; copy: string }
  }
  messages: { paperMissing: string; recordingMissingHeading: string; recordingMissingCopy: string }
  artworks: Artwork[]
  recordings: Recording[]
  papers: Record<string, Paper>
  dialogs: {
    resume: { heading: string; paragraphs: string[] }
    preview: { heading: string; paragraphs: string[] }
  }
}

type Mapping = Record<string, unknown>

function fail(where: string, detail: string): never {
  throw new Error(`${CONTENT_FILE} → ${where}: ${detail}`)
}

function describe(value: unknown) {
  if (value === undefined || value === null) return ' (nothing was written)'
  return ` (found ${JSON.stringify(value)})`
}

function mapping(value: unknown, where: string): Mapping {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fail(where, 'needs its own block of indented settings')
  }
  return value as Mapping
}

function group(source: Mapping, key: string, where: string): Mapping {
  return mapping(source[key], `${where}.${key}`)
}

/** Reject a misspelled setting instead of silently ignoring it. */
function only(source: Mapping, where: string, allowed: readonly string[]) {
  const unknown = Object.keys(source).find((key) => !allowed.includes(key))
  if (unknown) fail(where, `has an unknown setting "${unknown}". Allowed here: ${allowed.join(', ')}`)
}

function optionalText(source: Mapping, key: string, where: string): string | undefined {
  const value = source[key]
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value !== 'string') return fail(`${where}.${key}`, 'needs text')
  return value.trim() === '' ? undefined : value
}

function text(source: Mapping, key: string, where: string): string {
  return optionalText(source, key, where) ?? fail(`${where}.${key}`, 'cannot be left empty')
}

function number(source: Mapping, key: string, where: string): number {
  const value = source[key]
  const result = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  if (!Number.isFinite(result) || result <= 0) return fail(`${where}.${key}`, `needs a number above zero${describe(value)}`)
  return result
}

function flag(source: Mapping, key: string, where: string): boolean {
  const value = source[key]
  if (typeof value === 'boolean') return value
  return fail(`${where}.${key}`, `needs true or false${describe(value)}`)
}

function choice<const T extends readonly string[]>(source: Mapping, key: string, where: string, options: T): T[number] {
  const value = source[key]
  if (typeof value === 'string' && (options as readonly string[]).includes(value)) return value as T[number]
  return fail(`${where}.${key}`, `must be one of: ${options.join(', ')}${describe(value)}`)
}

function lines(value: unknown, where: string): string[] {
  if (!Array.isArray(value) || value.length === 0) return fail(where, 'needs at least one line, each starting with "- "')
  return value.map((line, index) => {
    if (typeof line !== 'string' || line.trim() === '') return fail(`${where}[${index}]`, 'needs text on one line')
    return line
  })
}

function items(value: unknown, where: string): Mapping[] {
  if (!Array.isArray(value) || value.length === 0) return fail(where, 'needs at least one item, each starting with "- "')
  return value.map((item, index) => mapping(item, `${where}[${index}]`))
}

const ARTWORK_KEYS = ['slug', 'title', 'artist', 'year', 'material', 'description', 'reference', 'image_id', 'image', 'src_set',
  'close_up', 'high_resolution', 'source', 'alt', 'width', 'height', 'crop', 'size'] as const

export function parseSite(source: string): Site {
  let document: unknown
  try {
    document = parseYaml(source)
  } catch (error) {
    throw new Error(`${CONTENT_FILE} could not be read: ${error instanceof Error ? error.message : String(error)}`)
  }
  const root = mapping(document, 'the file')

  const identity = mapping(root.site, 'site')
  only(identity, 'site', ['name', 'tagline'])
  const previewBlock = mapping(root.preview, 'preview')
  only(previewBlock, 'preview', ['enabled', 'resume_url'])

  const navigation = items(root.navigation, 'navigation').map((item, index) => {
    const where = `navigation[${index}]`
    only(item, where, ['label', 'href'])
    return { label: text(item, 'label', where), href: text(item, 'href', where) }
  })

  const layoutBlock = mapping(root.layout, 'layout')
  only(layoutBlock, 'layout', ['home', 'art', 'music', 'detail'])
  const homeLayout = group(layoutBlock, 'home', 'layout')
  only(homeLayout, 'layout.home', ['teaser_order', 'show_art_teaser', 'show_registers'])
  const artLayout = group(layoutBlock, 'art', 'layout')
  only(artLayout, 'layout.art', ['close_up_side'])
  const musicLayout = group(layoutBlock, 'music', 'layout')
  only(musicLayout, 'layout.music', ['feature_side', 'show_topics'])
  const detailLayout = group(layoutBlock, 'detail', 'layout')
  only(detailLayout, 'layout.detail', ['copy_side'])
  const layout: Layout = {
    home: {
      teaserOrder: choice(homeLayout, 'teaser_order', 'layout.home', TEASER_ORDERS),
      showArtTeaser: flag(homeLayout, 'show_art_teaser', 'layout.home'),
      showRegisters: flag(homeLayout, 'show_registers', 'layout.home'),
    },
    art: { closeUpSide: choice(artLayout, 'close_up_side', 'layout.art', LAYOUT_SIDES) },
    music: {
      featureSide: choice(musicLayout, 'feature_side', 'layout.music', LAYOUT_SIDES),
      showTopics: flag(musicLayout, 'show_topics', 'layout.music'),
    },
    detail: { copySide: choice(detailLayout, 'copy_side', 'layout.detail', LAYOUT_SIDES) },
  }

  const artworks: Artwork[] = items(root.artworks, 'artworks').map((item, index) => {
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

  const pagesBlock = mapping(root.pages, 'pages')
  only(pagesBlock, 'pages', ['home', 'art', 'music', 'research', 'not_found'])

  const homePage = mapping(pagesBlock.home, 'pages.home')
  only(homePage, 'pages.home', ['heading', 'introduction', 'portrait', 'featured_artwork', 'art_teaser', 'teasers'])
  const portrait = group(homePage, 'portrait', 'pages.home')
  const artTeaser = group(homePage, 'art_teaser', 'pages.home')
  const homeTeasers = group(homePage, 'teasers', 'pages.home')
  const teaser = (key: 'music' | 'research'): Teaser => {
    const block = group(homeTeasers, key, 'pages.home.teasers')
    return { title: text(block, 'title', `pages.home.teasers.${key}`), summary: text(block, 'summary', `pages.home.teasers.${key}`) }
  }
  const home: HomeContent = {
    heading: lines(homePage.heading, 'pages.home.heading'),
    introduction: text(homePage, 'introduction', 'pages.home'),
    portrait: {
      image: text(portrait, 'image', 'pages.home.portrait'),
      alt: text(portrait, 'alt', 'pages.home.portrait'),
      lead: text(portrait, 'lead', 'pages.home.portrait'),
      caption: text(portrait, 'caption', 'pages.home.portrait'),
      width: number(portrait, 'width', 'pages.home.portrait'),
      height: number(portrait, 'height', 'pages.home.portrait'),
    },
    featuredArtwork: text(homePage, 'featured_artwork', 'pages.home'),
    artTeaserHeading: lines(artTeaser.heading, 'pages.home.art_teaser.heading'),
    teasers: { music: teaser('music'), research: teaser('research') },
  }

  const artPage = mapping(pagesBlock.art, 'pages.art')
  only(artPage, 'pages.art', ['heading', 'introduction', 'featured_artwork', 'close_up'])
  const art: ArtContent = {
    heading: text(artPage, 'heading', 'pages.art'),
    introduction: text(artPage, 'introduction', 'pages.art'),
    featuredArtwork: text(artPage, 'featured_artwork', 'pages.art'),
    closeUpHeading: text(group(artPage, 'close_up', 'pages.art'), 'heading', 'pages.art.close_up'),
  }

  const musicPage = mapping(pagesBlock.music, 'pages.music')
  only(musicPage, 'pages.music', ['heading', 'introduction', 'feature'])
  const musicFeature = group(musicPage, 'feature', 'pages.music')
  const video = group(musicFeature, 'video', 'pages.music.feature')
  const music: MusicContent = {
    heading: text(musicPage, 'heading', 'pages.music'),
    introduction: text(musicPage, 'introduction', 'pages.music'),
    feature: {
      heading: text(musicFeature, 'heading', 'pages.music.feature'),
      copy: text(musicFeature, 'copy', 'pages.music.feature'),
      note: optionalText(musicFeature, 'note', 'pages.music.feature'),
      topics: lines(musicFeature.topics, 'pages.music.feature.topics'),
      video: {
        src: text(video, 'src', 'pages.music.feature.video'),
        poster: text(video, 'poster', 'pages.music.feature.video'),
        caption: optionalText(video, 'caption', 'pages.music.feature.video'),
        demo: flag(video, 'demo', 'pages.music.feature.video'),
      },
    },
  }

  const researchPage = mapping(pagesBlock.research, 'pages.research')
  only(researchPage, 'pages.research', ['heading', 'introduction', 'project', 'ghp', 'smaller'])
  const project = group(researchPage, 'project', 'pages.research')
  const ghp = group(researchPage, 'ghp', 'pages.research')
  const smaller = group(researchPage, 'smaller', 'pages.research')
  const research: ResearchContent = {
    heading: text(researchPage, 'heading', 'pages.research'),
    introduction: text(researchPage, 'introduction', 'pages.research'),
    project: {
      image: text(project, 'image', 'pages.research.project'),
      alt: text(project, 'alt', 'pages.research.project'),
      heading: text(project, 'heading', 'pages.research.project'),
      copy: text(project, 'copy', 'pages.research.project'),
      note: optionalText(project, 'note', 'pages.research.project'),
      paper: text(project, 'paper', 'pages.research.project'),
    },
    ghp: {
      title: text(ghp, 'title', 'pages.research.ghp'),
      heading: text(ghp, 'heading', 'pages.research.ghp'),
      copy: text(ghp, 'copy', 'pages.research.ghp'),
      note: optionalText(ghp, 'note', 'pages.research.ghp'),
      paper: text(ghp, 'paper', 'pages.research.ghp'),
      images: items(ghp.images, 'pages.research.ghp.images').map((image, index) => {
        const where = `pages.research.ghp.images[${index}]`
        only(image, where, ['image', 'alt'])
        return { image: text(image, 'image', where), alt: text(image, 'alt', where) }
      }),
    },
    smaller: {
      title: text(smaller, 'title', 'pages.research.smaller'),
      projects: items(smaller.projects, 'pages.research.smaller.projects').map((entry, index) => {
        const where = `pages.research.smaller.projects[${index}]`
        only(entry, where, ['title', 'copy', 'image', 'alt', 'credit'])
        return {
          title: text(entry, 'title', where),
          copy: text(entry, 'copy', where),
          image: text(entry, 'image', where),
          alt: text(entry, 'alt', where),
          credit: text(entry, 'credit', where),
        }
      }),
    },
  }

  // The GHP pair is an unequal two-image composition: wider first, taller second.
  if (research.ghp.images.length !== 2) {
    fail('pages.research.ghp.images', 'needs exactly two images: the wider one first, then the taller one')
  }

  const notFound = mapping(pagesBlock.not_found, 'pages.not_found')
  only(notFound, 'pages.not_found', ['heading', 'copy'])

  const messagesBlock = mapping(root.messages, 'messages')
  only(messagesBlock, 'messages', ['paper_missing', 'recording_missing_heading', 'recording_missing_copy'])

  const recordings: Recording[] = items(root.recordings, 'recordings').map((item, index) => {
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

  const papersBlock = mapping(root.papers, 'papers')
  const papers: Record<string, Paper> = {}
  for (const [key, value] of Object.entries(papersBlock)) {
    const where = `papers.${key}`
    const block = mapping(value, where)
    only(block, where, ['title', 'citation', 'url'])
    papers[key] = { title: text(block, 'title', where), citation: optionalText(block, 'citation', where), url: optionalText(block, 'url', where) ?? null }
  }

  const dialogsBlock = mapping(root.dialogs, 'dialogs')
  only(dialogsBlock, 'dialogs', ['resume', 'preview'])
  const resumeDialog = group(dialogsBlock, 'resume', 'dialogs')
  only(resumeDialog, 'dialogs.resume', ['heading', 'paragraphs'])
  const previewDialog = group(dialogsBlock, 'preview', 'dialogs')
  only(previewDialog, 'dialogs.preview', ['heading', 'paragraphs'])

  const site: Site = {
    name: text(identity, 'name', 'site'),
    tagline: text(identity, 'tagline', 'site'),
    preview: { enabled: flag(previewBlock, 'enabled', 'preview'), resumeUrl: optionalText(previewBlock, 'resume_url', 'preview') ?? null },
    navigation,
    layout,
    pages: {
      home,
      art,
      music,
      research,
      notFound: { heading: text(notFound, 'heading', 'pages.not_found'), copy: text(notFound, 'copy', 'pages.not_found') },
    },
    messages: {
      paperMissing: text(messagesBlock, 'paper_missing', 'messages'),
      recordingMissingHeading: text(messagesBlock, 'recording_missing_heading', 'messages'),
      recordingMissingCopy: text(messagesBlock, 'recording_missing_copy', 'messages'),
    },
    artworks,
    recordings,
    papers,
    dialogs: {
      resume: { heading: text(resumeDialog, 'heading', 'dialogs.resume'), paragraphs: lines(resumeDialog.paragraphs, 'dialogs.resume.paragraphs') },
      preview: {
        heading: text(previewDialog, 'heading', 'dialogs.preview'),
        paragraphs: lines(previewDialog.paragraphs, 'dialogs.preview.paragraphs'),
      },
    },
  }

  // Cross-references: a mistyped slug would otherwise leave a page pointing nowhere.
  if (!artworks.some((work) => work.slug === site.pages.home.featuredArtwork)) {
    fail('pages.home.featured_artwork', `no artwork has the slug "${site.pages.home.featuredArtwork}"`)
  }
  if (!artworks.some((work) => work.slug === site.pages.art.featuredArtwork)) {
    fail('pages.art.featured_artwork', `no artwork has the slug "${site.pages.art.featuredArtwork}"`)
  }
  for (const [paperKey, where] of [[research.project.paper, 'pages.research.project.paper'], [research.ghp.paper, 'pages.research.ghp.paper']] as const) {
    if (!(paperKey in papers)) fail(where, `points at a paper named "${paperKey}", which is not defined under papers`)
  }

  return site
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
