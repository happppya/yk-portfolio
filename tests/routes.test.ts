import { test } from 'node:test'
import assert from 'node:assert/strict'
import { accentKey, activePath, linkAccent, resolveRoute, shouldHandleLink, shouldNavigate } from '../src/lib/routes.ts'
import { artImage, artSrcSet } from '../src/lib/site-content.ts'
import { artworks } from './support/site.ts'

test('all three top-level destinations resolve, including trailing slashes', () => {
  for (const [path, page] of [['/', 'art'], ['/art', 'art'], ['/music', 'music'], ['/research', 'research']]) {
    assert.deepEqual(resolveRoute(path), { page })
    assert.deepEqual(resolveRoute(`${path}/`), { page })
  }
})

test('the front page is the Art collection, so / and /art resolve to the same page', () => {
  assert.deepEqual(resolveRoute('/'), resolveRoute('/art'))
  assert.deepEqual(resolveRoute('/'), { page: 'art' })
})

test('detail deep links resolve and keep Art active', () => {
  const route = resolveRoute('/art/water-lilies')
  assert.deepEqual(route, { page: 'detail', slug: 'water-lilies' })
  // Art owns the front page, so a detail view keeps that entry active.
  assert.equal(activePath(route), '/')
})

test('unknown or malformed paths resolve to the not-found page', () => {
  for (const path of ['/missing', '/art/a/b', '/art/%20', '/music/recording', '/me', '/me/extra']) {
    assert.deepEqual(resolveRoute(path), { page: 'not-found' })
  }
})

test('every destination owns an accent identity, and detail views keep the collection\'s', () => {
  for (const page of ['art', 'music', 'research'] as const) assert.equal(accentKey(page), page)
  assert.equal(accentKey('detail'), 'art')
  assert.equal(accentKey('not-found'), 'art')
  // Detail deep links resolve to the collection's identity, not a separate one.
  assert.equal(accentKey(resolveRoute('/art/water-lilies').page), 'art')
})

test('a link promises the accent of where it leads, and unknown targets promise nothing', () => {
  assert.equal(linkAccent('/'), 'art')
  assert.equal(linkAccent('/music'), 'music')
  assert.equal(linkAccent('/research/'), 'research')
  assert.equal(linkAccent('/art/water-lilies'), 'art')
  for (const href of ['https://example.com', '//example.com/art', '#details', '/art?sort=year', '/art#details', '/missing', '', null, undefined]) {
    assert.equal(linkAccent(href), undefined, String(href))
  }
})

test('plain clicks navigate but modifier and non-left clicks keep browser behavior', () => {
  const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false }
  assert.equal(shouldNavigate(click), true)
  for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey']) {
    assert.equal(shouldNavigate({ ...click, [key]: true }), false)
  }
  assert.equal(shouldNavigate({ ...click, button: 1 }), false)
})

test('internal links keep downloads, external links, anchors, and query strings native', () => {
  const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false }
  assert.equal(shouldHandleLink(click, '/art/water-lilies'), true)
  for (const href of ['https://example.com', '//example.com/art', '#details', '/art#details', '/art?sort=year', 'mailto:artist@example.com']) {
    assert.equal(shouldHandleLink(click, href), false)
  }
  assert.equal(shouldHandleLink(click, '/art', { target: '_blank' }), false)
  assert.equal(shouldHandleLink(click, '/resume.pdf', { download: '' }), false)
  assert.equal(shouldHandleLink({ ...click, defaultPrevented: true }, '/art'), false)
})

test('active navigation maps every page and excludes unknown destinations', () => {
  // Art owns the front-page entry, so both its paths light up the same link.
  assert.equal(activePath(resolveRoute('/')), '/')
  assert.equal(activePath(resolveRoute('/art')), '/')
  assert.equal(activePath(resolveRoute('/music')), '/music')
  assert.equal(activePath(resolveRoute('/research')), '/research')
  assert.equal(activePath(resolveRoute('/missing')), '')
})

test('the collection has unique safe slugs and complete image metadata', () => {
  assert.equal(new Set(artworks.map((work) => work.slug)).size, artworks.length)
  for (const work of artworks) {
    assert.match(work.slug, /^[a-z0-9-]+$/)
    assert.ok(work.width > 0 && work.height > 0)
    assert.ok(work.title && work.artist && work.year && work.material && work.description && work.alt)
    // The shipped works are local placeholders, so they carry a file path and no IIIF srcset.
    assert.match(artImage(work), /^\/media\//)
    assert.equal(artSrcSet(work), undefined)
  }
})
