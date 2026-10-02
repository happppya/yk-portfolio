import { readFileSync } from 'node:fs'
import { parseSite, type SiteSources } from '../../src/lib/site-content.ts'
import { parseTheme } from '../../src/lib/theme-content.ts'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

/**
 * The shipped content files, read once. Tests read the same files the app
 * imports, so they describe the real content rather than a fixture that can
 * drift from it.
 */
export const siteSources: SiteSources = {
  site: read('../../content/site.yaml'),
  artworks: read('../../content/artworks.yaml'),
  pages: {
    home: read('../../content/pages/home.yaml'),
    art: read('../../content/pages/art.yaml'),
    music: read('../../content/pages/music.yaml'),
    research: read('../../content/pages/research.yaml'),
    notFound: read('../../content/pages/not-found.yaml'),
  },
}

export const themeSource = read('../../content/theme.yaml')

export const site = parseSite(siteSources)
export const theme = parseTheme(themeSource)

export const { artworks, recordings, navigation, layout, pages, papers, preview, messages, dialogs } = site

/** A file a test can hand a broken copy of to the parser. */
export type ContentFile = keyof SiteSources['pages'] | 'site' | 'artworks'

/** Every shipped content file, keyed by the name a test refers to it by. */
export const contentFiles: Record<ContentFile | 'theme', string> = {
  ...siteSources.pages,
  site: siteSources.site,
  artworks: siteSources.artworks,
  theme: themeSource,
}

/** The shipped sources with one file swapped for an edited copy. */
export function withFile(file: ContentFile, source: string): SiteSources {
  const pages = { ...siteSources.pages }
  if (file === 'home' || file === 'art' || file === 'music' || file === 'research' || file === 'notFound') pages[file] = source
  return {
    site: file === 'site' ? source : siteSources.site,
    artworks: file === 'artworks' ? source : siteSources.artworks,
    pages,
  }
}
