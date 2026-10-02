import { readFileSync } from 'node:fs'
import { parseSite } from '../../src/lib/site-content.ts'

/**
 * The shipped content file, parsed once. Tests read the same file the app imports,
 * so they describe the real content rather than a fixture that can drift from it.
 */
export const sitePath = new URL('../../content/site.yaml', import.meta.url)
export const siteSource = readFileSync(sitePath, 'utf8')
export const site = parseSite(siteSource)

export const { artworks, recordings, navigation, layout, pages, papers, preview, messages, dialogs } = site
