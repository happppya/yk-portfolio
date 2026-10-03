import assert from 'node:assert/strict'
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
  media: {
    artworks: read('../../content/media/artworks.yaml'),
    recordings: read('../../content/media/recordings.yaml'),
    papers: read('../../content/media/papers.yaml'),
  },
  pages: {
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
export type ContentFile = keyof SiteSources['pages'] | 'site' | keyof SiteSources['media']

/** Every shipped content file, keyed by the name a test refers to it by. */
export const contentFiles: Record<ContentFile | 'theme', string> = {
  ...siteSources.pages,
  ...siteSources.media,
  site: siteSources.site,
  theme: themeSource,
}

/**
 * Replace the first line matching `pattern`. Tests edit the shipped files, and an editor
 * may reword them at any time, so the pattern is what the test depends on rather than a
 * sentence that happens to be in the file today. A pattern that no longer matches is
 * reported here instead of silently turning the test into a no-op.
 */
export function editLine(source: string, pattern: RegExp, replacement: string) {
  assert.match(source, pattern, `the shipped file should still contain ${pattern}`)
  return source.replace(pattern, replacement)
}

/** The shipped sources with one file swapped for an edited copy. */
export function withFile(file: ContentFile, source: string): SiteSources {
  const pages = { ...siteSources.pages }
  const media = { ...siteSources.media }
  if (file === 'art' || file === 'music' || file === 'research' || file === 'notFound') pages[file] = source
  if (file === 'artworks' || file === 'recordings' || file === 'papers') media[file] = source
  return {
    site: file === 'site' ? source : siteSources.site,
    media,
    pages,
  }
}
