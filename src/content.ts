import rawSite from '../content/site.yaml?raw'
import { parseSite } from './lib/site-content'

/**
 * The site's content, parsed from [content/site.yaml](../../content/site.yaml).
 *
 * That file is the only place copy, media, links, and layout choices live: edit it
 * instead of these components. `parseSite` validates every field and reports the
 * exact YAML path when a value is missing or outside its allowed choices.
 * See [site-content.ts](lib/site-content.ts) for the format itself.
 */
export const site = parseSite(rawSite)

export const { artworks, recordings, navigation, layout, pages, papers, dialogs, preview, messages } = site

/** The label the navigation gives a path, so page copy never drifts from it. */
export function navigationLabel(href: string) {
  return navigation.find((item) => item.href === href)?.label ?? ''
}

export { artImage, artSrcSet } from './lib/site-content'
export type { Artwork, ArtworkSize, LayoutSide, Paper, Recording, TeaserOrder } from './lib/site-content'
