import { test } from 'node:test'
import assert from 'node:assert/strict'
import { artImage, artSrcSet, artworks, navigation, portfolio, recordings, type Artwork } from '../src/content.ts'

const localWork: Artwork = {
  ...artworks[0],
  slug: 'local-work',
  artist: 'Yujin Kim',
  reference: false,
  imageId: undefined,
  image: '/media/work.webp',
}

test('local artwork images replace museum URLs at every regular resolution', () => {
  assert.equal(artImage(localWork), '/media/work.webp')
  assert.equal(artImage(localWork, 1680), '/media/work.webp')
  assert.equal(artImage(localWork, 2400), '/media/work.webp')
  assert.equal(artSrcSet(localWork), undefined)
})

test('high-resolution inspection uses its own source without changing collection images', () => {
  const work = { ...localWork, highResolution: '/media/work-original.jpg' }
  assert.equal(artImage(work, 1200), '/media/work.webp')
  assert.equal(artImage(work, 2400), '/media/work-original.jpg')
})

test('a supplied responsive source set is preserved verbatim', () => {
  const srcSet = '/media/work-small.webp 400w, /media/work-large.webp 1200w'
  assert.equal(artSrcSet({ ...localWork, srcSet }), srcSet)
})

test('missing artwork image configuration fails clearly rather than requesting undefined', () => {
  assert.throws(() => artImage({ ...localWork, image: undefined }), /needs an image or imageId/)
})

test('navigation retains exactly the four required destinations', () => {
  assert.deepEqual(navigation.map((item) => item.label), ['Me', 'Art', 'Music', 'Research'])
  assert.equal(new Set(navigation.map((item) => item.href)).size, 4)
})

test('preview content does not invent resume, papers, or performance files', () => {
  assert.equal(portfolio.preview, true)
  assert.equal(portfolio.resumeHref, null)
  assert.equal(portfolio.papers.project.href, null)
  assert.equal(portfolio.papers.ghp.href, null)
  assert.equal(portfolio.music.demo, true)
  assert.deepEqual(recordings.map((recording) => recording.title), ['Bach prelude', 'Viola', 'Concerto'])
  assert.ok(recordings.every((recording) => !recording.src))
  assert.ok(artworks.every((work) => work.reference && work.artist !== 'Yujin Kim' && work.source))
})
