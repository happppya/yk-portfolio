import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { ARTWORKS_FILE, PAGE_FILES, SITE_FILE, parseSite } from '../src/lib/site-content.ts'
import { THEME_FILE } from '../src/lib/theme-content.ts'
import { contentFiles, editLine, site, siteSources, withFile } from './support/site.ts'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const appContent = read('../src/content.ts')
const pagesSource = read('../src/pages.tsx')
const css = read('../src/index.css')
const allFiles = Object.values(contentFiles).join('\n')

test('the app reads every content file instead of holding copy in components', () => {
  assert.equal(SITE_FILE, 'content/site.yaml')
  assert.equal(ARTWORKS_FILE, 'content/artworks.yaml')
  assert.equal(THEME_FILE, 'content/theme.yaml')
  assert.equal(PAGE_FILES.home, 'content/pages/home.yaml')
  assert.equal(PAGE_FILES.notFound, 'content/pages/not-found.yaml')
  for (const path of ['site.yaml', 'artworks.yaml', 'theme.yaml', 'pages/home.yaml', 'pages/art.yaml', 'pages/music.yaml', 'pages/research.yaml', 'pages/not-found.yaml']) {
    assert.match(appContent, new RegExp(`\\.\\./content/${path.replace(/\./g, '\\.')}\\?raw`), `${path} should be imported as text`)
  }
  assert.match(appContent, /parseSite\(siteSources\)/)
  assert.match(appContent, /parseTheme\(rawTheme\)/)
  // Copy belongs in the content files, not in the page components.
  assert.doesNotMatch(pagesSource, /'Different ways of looking/)
  assert.doesNotMatch(pagesSource, /'Room for sound/)
})

test('the split leaves the copy in one file per page and the collection in its own file', () => {
  for (const [name, declaring] of [['home', 'heading:'], ['art', 'close_up:'], ['music', 'feature:'], ['research', 'ghp:'], ['notFound', 'copy:']] as const) {
    assert.ok(contentFiles[name].includes(declaring), `content/pages/${name} should hold its own page`)
  }
  // The spine keeps the shared settings and no page copy or works of its own.
  assert.match(siteSources.site, /^layout:/m)
  assert.match(siteSources.site, /^recordings:/m)
  assert.match(siteSources.site, /^papers:/m)
  assert.match(siteSources.site, /^dialogs:/m)
  assert.doesNotMatch(siteSources.site, /^pages:/m)
  assert.doesNotMatch(siteSources.site, /^artworks:/m)
  // A setting that moved out is reported instead of being ignored.
  const stale = withFile('site', `${siteSources.site}\npages:\n  home: {}\n`)
  assert.throws(() => parseSite(stale), /content\/site\.yaml → the file: has an unknown setting "pages"/)
})

test('every content file explains itself to a non-technical editor', () => {
  const comments = (source: string) => source.split('\n').filter((line) => line.trimStart().startsWith('#')).length
  for (const [file, source] of Object.entries(contentFiles)) {
    assert.ok(comments(source) > 0, `${file} should carry a note explaining what it is for`)
  }
  assert.ok(comments(allFiles) > 80, `expected generous guidance across the files, found ${comments(allFiles)} comment lines`)
  for (const marker of ['HOW TO EDIT', 'WHAT IS NOT HERE', 'layout:', 'artworks:', 'recordings:', 'papers:', 'dialogs:', 'accents:', 'modes:', 'atmosphere:']) {
    assert.ok(allFiles.includes(marker), `${marker} should be documented somewhere`)
  }
  // The spine says where everything else went.
  for (const pointer of ['content/theme.yaml', 'content/artworks.yaml', 'content/pages/']) {
    assert.ok(siteSources.site.includes(pointer), `site.yaml should point at ${pointer}`)
  }
})

test('every curated layout choice is documented next to its allowed values and wired to the page', () => {
  for (const setting of ['teaser_order:', 'show_art_teaser:', 'show_registers:', 'close_up_side:', 'feature_side:', 'show_topics:', 'copy_side:']) {
    assert.ok(siteSources.site.includes(setting), `${setting} should be documented in site.yaml`)
  }
  assert.ok(siteSources.site.includes('music_first | research_first'))
  assert.ok(siteSources.artworks.includes('large | small | offset | wide'))
  assert.equal(siteSources.site.match(/left \| right/g)?.length, 3)
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

test('a choice outside the documented set fails with the file, the setting, and the allowed values', () => {
  const broken = withFile('site', editLine(siteSources.site, /close_up_side: \w+/, 'close_up_side: centre'))
  assert.throws(() => parseSite(broken),
    /content\/site\.yaml → layout\.art\.close_up_side: must be one of: left, right \(found "centre"\)/)
})

test('a misspelled setting is reported instead of being silently ignored', () => {
  const broken = withFile('site', editLine(siteSources.site, /show_topics: (?:true|false)/, 'show_topic: true'))
  assert.throws(() => parseSite(broken), /content\/site\.yaml → layout\.music: has an unknown setting "show_topic"/)
  const strayKey = withFile('home', editLine(siteSources.pages.home, /^introduction:/m, 'introducton:'))
  assert.throws(() => parseSite(strayKey), /content\/pages\/home\.yaml → the page: has an unknown setting "introducton"/)
})

test('an emptied required field names the file and setting to fill in', () => {
  const broken = withFile('home', editLine(siteSources.pages.home, /^introduction: .*/m, 'introduction:'))
  assert.throws(() => parseSite(broken), /content\/pages\/home\.yaml → introduction: cannot be left empty/)
})

test('the hero heading credit is optional and can be emptied from the file', () => {
  assert.equal(typeof site.pages.home.headingAttribution, 'string')
  // It sits beside the heading in a row and disappears when the field is empty.
  assert.match(pagesSource, /\{home\.headingAttribution && <p className="heading-attribution">\{home\.headingAttribution\}<\/p>\}/)
  assert.match(css, /\.heading-attribution \{ color: var\(--secondary\);/)
  const empty = withFile('home', editLine(siteSources.pages.home, /^heading_attribution: .*/m, 'heading_attribution:'))
  assert.equal(parseSite(empty).pages.home.headingAttribution, undefined)
})

test('the music companion still fills the collection\'s open corner', () => {
  assert.ok(site.pages.music.companion?.image)
  assert.ok(site.pages.music.companion?.alt)
  // Pinned into the grid's top-left and stretched to the row, so it never reflows the
  // recording slots that carry the offset.
  assert.match(pagesSource, /music\.companion && <figure className="collection-companion reveal">/)
  assert.match(css, /\.collection-companion \{ grid-column: 1 \/ 6; grid-row: 1; align-self: stretch; \}/)
  // Emptying the image drops the still and leaves the recordings alone.
  const hidden = withFile('music', editLine(siteSources.pages.music, /^  image: https.*$/m, '  image:'))
  assert.equal(parseSite(hidden).pages.music.companion, undefined)
  // A misspelled setting inside the block names the file and the setting.
  const broken = withFile('music', editLine(siteSources.pages.music, /^  alt: .*$/m, '  caption: piano'))
  assert.throws(() => parseSite(broken), /content\/pages\/music\.yaml → companion: has an unknown setting "caption"/)
})

test('a featured work and a paper panel must point at something another file defines', () => {
  const wrongWork = withFile('home', editLine(siteSources.pages.home, /^featured_artwork: \S+/m, 'featured_artwork: not-a-work'))
  assert.throws(() => parseSite(wrongWork),
    /content\/pages\/home\.yaml → featured_artwork: no work in content\/artworks\.yaml has the slug "not-a-work"/)
  const wrongPaper = withFile('research', editLine(siteSources.pages.research, /^\s+paper: \S+/m, '  paper: poject'))
  assert.throws(() => parseSite(wrongPaper),
    /content\/pages\/research\.yaml → project\.paper: points at a paper named "poject"/)
  // Two works sharing a slug, whatever the works are called today.
  const slugs = [...siteSources.artworks.matchAll(/^\s+(?:- )?slug: (\S+)$/gm)].map((match) => match[1])
  assert.ok(slugs.length >= 2, `expected at least two works, found ${slugs.length}`)
  const duplicate = withFile('artworks', siteSources.artworks.replace(`slug: ${slugs[1]}`, `slug: ${slugs[0]}`))
  assert.throws(() => parseSite(duplicate), /content\/artworks\.yaml → artworks: uses the same slug twice/)
})

test('the GHP pair stays an unequal pair of exactly two images', () => {
  // Deck blocks share the `images:` key, so edit from the ghp section on to be sure the
  // extra image lands in the pair and not in the project's deck above it.
  const start = siteSources.pages.research.indexOf('\nghp:')
  assert.ok(start > -1, 'research.yaml should still contain a ghp section')
  const ghp = editLine(siteSources.pages.research.slice(start), /^(  images:)$/m,
    '$1\n    - image: /media/portrait.jpg\n      alt: An extra reference image.')
  const extra = withFile('research', siteSources.pages.research.slice(0, start) + ghp)
  assert.throws(() => parseSite(extra), /content\/pages\/research\.yaml → ghp\.images: needs exactly two images/)
})

test('third-party notices are gone while the museum source link and the images stay', () => {
  // Comments may still explain the fields; the visible content must not carry notices.
  const visible = allFiles.split('\n').filter((line) => !line.trimStart().startsWith('#')).join('\n')
  for (const notice of ['public-domain', 'public domain', 'stock reference', 'Preview photograph', 'demo footage', 'not a work by Yujin', 'CC0 flower']) {
    assert.equal(visible.includes(notice), false, `"${notice}" should no longer appear in the content`)
  }
  assert.equal(site.pages.art.note, undefined)
  assert.equal(site.pages.detail, undefined)
  assert.equal(site.pages.music.creditNote, undefined)
  // The images and the museum source links they came from are untouched.
  assert.ok(site.artworks.filter((work) => work.reference).every((work) => work.imageId && work.source?.startsWith('https://')))
  assert.match(pagesSource, /Museum source/)
  assert.match(css, /\.source-note \{/)
  assert.doesNotMatch(css, /reference-note|collection-note|preview-credits/)
  assert.doesNotMatch(pagesSource, /Public-domain reference/)
})

test('every local media path in the content files exists in public/', () => {
  const local = [...allFiles.matchAll(/^\s*(?:- )?(?:image|poster|src|url|resume_url):\s*(\/media\/[^\s]+)$/gm)].map((match) => match[1])
  // The portrait, the resume, and the two paper placeholders.
  assert.ok(local.length >= 4, `expected local media paths, found ${local.length}`)
  for (const path of local) {
    assert.ok(existsSync(new URL(`../public${path}`, import.meta.url)), `${path} should exist in public/`)
  }
})

// The copy itself is the editor's to change, so this asserts the shape of the shipped
// content rather than the placeholder wording that happened to be in it.
test('every page still parses to real content, and the fixed wording survives', () => {
  const headings = {
    home: site.pages.home.heading.join(' '),
    art: site.pages.art.heading,
    music: site.pages.music.heading,
    research: site.pages.research.heading,
    notFound: site.pages.notFound.heading,
  }
  for (const [name, heading] of Object.entries(headings)) assert.ok(heading.trim().length > 0, `${name} should have a heading`)
  for (const [name, page] of [['art', site.pages.art], ['music', site.pages.music], ['research', site.pages.research]] as const) {
    assert.ok(page.introduction.trim().length > 0, `${name} should have an introduction`)
  }
  assert.ok(site.pages.home.introduction.trim().length > 0)
  assert.ok(site.pages.home.artTeaserHeading.length > 0)
  assert.ok(site.pages.home.portrait.width > 0 && site.pages.home.portrait.height > 0)
  assert.ok(site.name.trim().length > 0)
  for (const message of Object.values(site.messages)) assert.ok(message.trim().length > 0)
  // The brief fixes the GHP title, and the pair stays two images.
  assert.equal(site.pages.research.ghp.title, 'GHP')
  assert.equal(site.pages.research.ghp.images.length, 2)
  // A page's featured work and its paper panel resolve to real entries.
  assert.ok(site.artworks.some((work) => work.slug === site.pages.home.featuredArtwork))
  assert.ok(site.artworks.some((work) => work.slug === site.pages.art.featuredArtwork))
  assert.ok(site.pages.research.project.paper in site.papers)
  assert.ok(site.pages.research.ghp.paper in site.papers)
})
