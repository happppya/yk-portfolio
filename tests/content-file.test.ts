import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { CONTENT_FILE, parseSite } from '../src/lib/site-content.ts'
import { site, siteSource } from './support/site.ts'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const appContent = read('../src/content.ts')
const pagesSource = read('../src/pages.tsx')
const css = read('../src/index.css')

test('the app parses the editable content file instead of holding copy in components', () => {
  assert.equal(CONTENT_FILE, 'content/site.yaml')
  assert.match(appContent, /from '\.\.\/content\/site\.yaml\?raw'/)
  assert.match(appContent, /parseSite\(rawSite\)/)
  // Copy belongs in the content file, not in the page components.
  assert.doesNotMatch(pagesSource, /'Different ways of looking/)
  assert.doesNotMatch(pagesSource, /'Room for sound/)
})

test('the content file explains itself to a non-technical editor', () => {
  const comments = siteSource.split('\n').filter((line) => line.trimStart().startsWith('#')).length
  assert.ok(comments > 100, `expected generous guidance, found ${comments} comment lines`)
  for (const marker of ['HOW TO EDIT', 'WHAT IS NOT HERE', 'layout:', 'pages:', 'artworks:', 'recordings:', 'papers:', 'dialogs:']) {
    assert.ok(siteSource.includes(marker), `${marker} should be documented in the content file`)
  }
})

test('every curated layout choice is documented next to its allowed values and wired to the page', () => {
  for (const setting of ['teaser_order:', 'show_art_teaser:', 'show_registers:', 'close_up_side:', 'feature_side:', 'show_topics:', 'copy_side:']) {
    assert.ok(siteSource.includes(setting), `${setting} should be documented in the content file`)
  }
  assert.ok(siteSource.includes('music_first | research_first'))
  assert.ok(siteSource.includes('large | small | offset | wide'))
  assert.equal(siteSource.match(/left \| right/g)?.length, 3)
  // Each option reaches a real composition, and the mirrored one has CSS behind it.
  assert.match(pagesSource, /data-side=\{layout\.art\.closeUpSide\}/)
  assert.match(pagesSource, /data-side=\{layout\.music\.featureSide\}/)
  assert.match(pagesSource, /data-copy=\{layout\.detail\.copySide\}/)
  assert.match(pagesSource, /layout\.home\.showArtTeaser &&/)
  assert.match(pagesSource, /layout\.home\.showRegisters &&/)
  assert.match(pagesSource, /layout\.home\.teaserOrder === 'research_first'/)
  assert.match(css, /\.art-feature\[data-side='left'\] \{ grid-template-columns/)
  assert.match(css, /\.artwork-detail\[data-copy='left'\] \{ grid-template-columns/)
  assert.match(css, /\.music-feature\[data-side='right'\] \{ grid-template-columns/)
})

test('a choice outside the documented set fails with the file path and the allowed values', () => {
  const broken = siteSource.replace('close_up_side: right', 'close_up_side: centre')
  assert.throws(() => parseSite(broken),
    /content\/site\.yaml → layout\.art\.close_up_side: must be one of: left, right \(found "centre"\)/)
})

test('a misspelled setting is reported instead of being silently ignored', () => {
  const broken = siteSource.replace('show_topics: true', 'show_topic: true')
  assert.throws(() => parseSite(broken), /layout\.music: has an unknown setting "show_topic"/)
})

test('an emptied required field names the exact line to fill in', () => {
  const broken = siteSource.replace('introduction: Different ways of looking. One place to explore them.', 'introduction:')
  assert.throws(() => parseSite(broken), /pages\.home\.introduction: cannot be left empty/)
})

test('a featured work and a paper panel must point at something the file defines', () => {
  const wrongWork = siteSource.replace('featured_artwork: improvisation', 'featured_artwork: improvisation-2')
  assert.throws(() => parseSite(wrongWork), /pages\.home\.featured_artwork: no artwork has the slug "improvisation-2"/)
  const wrongPaper = siteSource.replace('paper: project', 'paper: poject')
  assert.throws(() => parseSite(wrongPaper), /pages\.research\.project\.paper: points at a paper named "poject"/)
})

test('the GHP pair stays an unequal pair of exactly two images', () => {
  const extra = siteSource.replace('images:\n        - image: https://images.unsplash.com/photo-1579154204601',
    'images:\n        - image: /media/extra.jpg\n          alt: An extra reference image.\n        - image: https://images.unsplash.com/photo-1579154204601')
  assert.throws(() => parseSite(extra), /pages\.research\.ghp\.images: needs exactly two images/)
})

test('third-party notices are gone while the museum source link and the images stay', () => {
  // Comments may still explain the fields; the visible content must not carry notices.
  const visible = siteSource.split('\n').filter((line) => !line.trimStart().startsWith('#')).join('\n')
  for (const notice of ['public-domain', 'public domain', 'stock reference', 'Preview photograph', 'demo footage', 'not a work by Yujin', 'CC0 flower']) {
    assert.equal(visible.includes(notice), false, `"${notice}" should no longer appear in the content`)
  }
  assert.equal(site.pages.art.note, undefined)
  assert.equal(site.pages.detail, undefined)
  assert.equal(site.dialogs.preview.credits, undefined)
  assert.equal(site.pages.music.creditNote, undefined)
  // The images and the museum source links they came from are untouched.
  assert.ok(site.artworks.every((work) => work.imageId && work.source?.startsWith('https://')))
  assert.match(pagesSource, /Museum source/)
  assert.match(css, /\.source-note \{/)
  assert.doesNotMatch(css, /reference-note|collection-note|preview-credits/)
  assert.doesNotMatch(pagesSource, /Public-domain reference/)
})

test('every local media path in the content file exists in public/', () => {
  const local = [...siteSource.matchAll(/^\s*(?:- )?(?:image|poster|src|url|resume_url):\s*(\/media\/[^\s]+)$/gm)].map((match) => match[1])
  // The portrait, the resume, and the two paper placeholders.
  assert.ok(local.length >= 4, `expected local media paths, found ${local.length}`)
  for (const path of local) {
    assert.ok(existsSync(new URL(`../public${path}`, import.meta.url)), `${path} should exist in public/`)
  }
})

test('shipped page copy is unchanged by the move into the content file', () => {
  assert.deepEqual(site.pages.home.heading, ['Art, music,', 'research.'])
  assert.equal(site.pages.home.introduction, 'Different ways of looking. One place to explore them.')
  assert.deepEqual(site.pages.home.artTeaserHeading, ['Look a little', 'closer.'])
  assert.equal(site.pages.home.portrait.lead, 'A portfolio in four parts.')
  assert.equal(site.pages.art.introduction, 'A collection at two distances. The whole image, then the details.')
  assert.equal(site.pages.art.closeUpHeading, 'A closer look')
  assert.equal(site.pages.music.introduction, 'Room for sound. Time to listen.')
  assert.equal(site.pages.music.feature.heading, 'In practice.')
  assert.equal(site.pages.research.introduction, 'Questions, experiments, and the work of finding out.')
  assert.equal(site.pages.research.project.paper, 'project')
  assert.equal(site.pages.research.ghp.title, 'GHP')
  assert.deepEqual(site.pages.research.smaller.projects.map((project) => project.title), ['Project notes', 'An experiment'])
  assert.equal(site.pages.notFound.heading, 'Nothing here, yet.')
  assert.equal(site.name, 'Yujin Kim')
  assert.deepEqual(site.artworks.map((work) => work.slug), ['improvisation', 'water-lilies', 'green-center', 'two-poplars'])
  assert.equal(site.pages.home.featuredArtwork, 'improvisation')
  assert.equal(site.pages.art.featuredArtwork, 'improvisation')
  assert.equal(site.messages.recordingMissingHeading, 'Recording not supplied yet.')
})
