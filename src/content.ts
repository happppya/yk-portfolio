import rawSite from '../content/site.yaml?raw'
import rawArtworks from '../content/media/artworks.yaml?raw'
import rawRecordings from '../content/media/recordings.yaml?raw'
import rawPapers from '../content/media/papers.yaml?raw'
import rawArt from '../content/pages/art.yaml?raw'
import rawMusic from '../content/pages/music.yaml?raw'
import rawResearch from '../content/pages/research.yaml?raw'
import rawNotFound from '../content/pages/not-found.yaml?raw'
import rawTheme from '../content/theme.yaml?raw'
import { parseSite, type SiteSources } from './lib/site-content'
import { parseTheme } from './lib/theme-content'

/**
 * The site's content, parsed from the files under [content/](../content):
 * the spine in `site.yaml`, the media collections under `media/`, one file per
 * page under `pages/`, and every colour in `theme.yaml`.
 *
 * Those files are the only place copy, media, links, and colours live: edit them
 * instead of these components. Each one is validated as it loads and reports the
 * exact file and setting when a value is missing or outside its allowed choices.
 * See [site-content.ts](lib/site-content.ts) and [theme-content.ts](lib/theme-content.ts)
 * for the formats themselves.
 */
export const siteSources: SiteSources = {
  site: rawSite,
  media: { artworks: rawArtworks, recordings: rawRecordings, papers: rawPapers },
  pages: { art: rawArt, music: rawMusic, research: rawResearch, notFound: rawNotFound },
}

export const site = parseSite(siteSources)
export const theme = parseTheme(rawTheme)

export const { artworks, recordings, navigation, layout, appearance, pages, papers, dialogs, preview, messages } = site

/** The label the navigation gives a path, so page copy never drifts from it. */
export function navigationLabel(href: string) {
  return navigation.find((item) => item.href === href)?.label ?? ''
}

export { artImage, artSrcSet } from './lib/site-content'
export type { Artwork, ArtworkSize, LayoutSide, Paper, Picture, Recording, AppearanceLook } from './lib/site-content'
export type { Theme, ThemeMode, ThemePalette } from './lib/theme-content'
