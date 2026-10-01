import { test } from 'node:test'
import assert from 'node:assert/strict'
import { accentKey, activePath, linkAccent, resolveRoute, shouldHandleLink, shouldNavigate } from '../src/lib/routes.ts'
import { artworks, artImage, artSrcSet } from '../src/content.ts'

test('all four top-level destinations resolve, including trailing slashes', () => {
  for (const [path, page] of [['/', 'me'], ['/art', 'art'], ['/music', 'music'], ['/research', 'research']]) {
    assert.deepEqual(resolveRoute(path), { page })
    assert.deepEqual(resolveRoute(`${path}/`), { page })
  }
})

test('detail deep links resolve and keep Art active', () => {
  const route = resolveRoute('/art/water-lilies')
  assert.deepEqual(route, { page: 'detail', slug: 'water-lilies' })
  assert.equal(activePath(route), '/art')
})

test('unknown or malformed paths resolve to the not-found page', () => {
  for (const path of ['/missing', '/art/a/b', '/art/%20', '/music/recording']) {
    assert.deepEqual(resolveRoute(path), { page: 'not-found' })
  }
})

test('every destination owns an accent identity, and detail views keep the collection\'s', () => {
  for (const page of ['me', 'art', 'music', 'research'] as const) assert.equal(accentKey(page), page)
  assert.equal(accentKey('detail'), 'art')
  assert.equal(accentKey('not-found'), 'me')
  // Detail deep links resolve to the collection's identity, not a separate one.
  assert.equal(accentKey(resolveRoute('/art/water-lilies').page), 'art')
})

test('a link promises the accent of where it leads, and unknown targets promise nothing', () => {
  assert.equal(linkAccent('/'), 'me')
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
  for (const href of ['/', '/art', '/music', '/research']) assert.equal(activePath(resolveRoute(href)), href)
  assert.equal(activePath(resolveRoute('/missing')), '')
})

test('reference artworks have unique safe slugs and complete image metadata', () => {
  assert.equal(new Set(artworks.map((work) => work.slug)).size, artworks.length)
  for (const work of artworks) {
    assert.match(work.slug, /^[a-z0-9-]+$/)
    assert.ok(work.width > 0 && work.height > 0)
    assert.ok(work.title && work.artist && work.year && work.material && work.description && work.alt)
    assert.match(artImage(work), /^https:\/\/www\.artic\.edu\/iiif\/2\//)
    assert.match(artSrcSet(work)!, /400w, .+800w, .+1200w, .+1680w$/)
  }
})
