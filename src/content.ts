export type Artwork = {
  slug: string
  title: string
  artist: string
  year: string
  material: string
  description: string
  imageId?: string
  image?: string
  srcSet?: string
  closeUp?: string
  highResolution?: string
  source?: string
  reference: boolean
  alt: string
  width: number
  height: number
  position: string
  layout: string
}

// Public-domain reference images, never represented as Yujin's work.
// Replace these records with approved portfolio material before publishing.
export const artworks: Artwork[] = [
  {
    slug: 'improvisation',
    title: 'Improvisation No. 30 (Cannons)',
    artist: 'Vasily Kandinsky',
    year: '1913',
    material: 'Oil on canvas',
    description: 'Loose fields of color intersect with black lines and fragments of recognizable forms. This public-domain reference lets you try the collection and its close-up view.',
    reference: true,
    imageId: 'b5bc6b66-9e6e-fe57-dcec-fc49e820e904',
    source: 'https://www.artic.edu/artworks/8991/improvisation-no-30-cannons',
    alt: 'Colorful abstract painting with sweeping black lines and overlapping yellow, blue, and pink forms.',
    width: 10199,
    height: 10244,
    position: '68% 64%',
    layout: 'work-large',
  },
  {
    slug: 'water-lilies',
    title: 'Water Lilies',
    artist: 'Claude Monet',
    year: '1906',
    material: 'Oil on canvas',
    description: 'Pink and white water lilies float across a pond built from short, layered brushstrokes. A public-domain reference image, not a work by Yujin Kim.',
    reference: true,
    imageId: '3c27b499-af56-f0d5-93b5-a7f2f1ad5813',
    source: 'https://www.artic.edu/artworks/16568/water-lilies',
    alt: 'A blue-green pond with pink and white water lilies and reflections on the water.',
    width: 8808,
    height: 8460,
    position: '60% 72%',
    layout: 'work-small',
  },
  {
    slug: 'green-center',
    title: 'Painting with Green Center',
    artist: 'Vasily Kandinsky',
    year: '1913',
    material: 'Oil on canvas',
    description: 'Colored forms converge around a green center, with dark strokes crossing the composition. This public-domain painting is included as a layout reference.',
    reference: true,
    imageId: 'c68f33ec-feb1-5277-334b-b71ac15ae394',
    source: 'https://www.artic.edu/artworks/8987/painting-with-green-center',
    alt: 'Abstract painting of intersecting colored forms around a green center.',
    width: 2417,
    height: 2250,
    position: '45% 48%',
    layout: 'work-offset',
  },
  {
    slug: 'two-poplars',
    title: 'Landscape with Two Poplars',
    artist: 'Vasily Kandinsky',
    year: '1912',
    material: 'Oil on canvas',
    description: 'Trees and mountains become broad, saturated shapes in this landscape. The full painting and detail crop demonstrate two ways of looking at one image.',
    reference: true,
    imageId: '9694ca0c-c4c4-e48d-566f-4d248990cff4',
    source: 'https://www.artic.edu/artworks/8980/landscape-with-two-poplars',
    alt: 'A vivid landscape with two trees, green hills, and blue mountains.',
    width: 8496,
    height: 6694,
    position: '30% 55%',
    layout: 'work-wide',
  },
]

export function artImage(work: Artwork, size = 1000) {
  if (size >= 2000 && work.highResolution) return work.highResolution
  if (work.image) return work.image
  if (!work.imageId) throw new Error(`Artwork "${work.slug}" needs an image or imageId.`)
  return `https://www.artic.edu/iiif/2/${work.imageId}/full/${size},/0/default.jpg`
}

export function artSrcSet(work: Artwork) {
  if (work.srcSet) return work.srcSet
  if (work.image) return undefined
  return [400, 800, 1200, 1680].map((size) => `${artImage(work, size)} ${size}w`).join(', ')
}

export const previewAssets = {
  portrait: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
  music: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1600&q=85',
  strings: 'https://images.unsplash.com/photo-1460036521480-ff49c08c2781?auto=format&fit=crop&w=1000&q=85',
  piano: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=85',
  research: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1600&q=85',
  microscope: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=85',
  notebook: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=85',
  demoVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
}

export type Recording = {
  title: string
  kind: string
  image: string
  src?: string
  caption?: string
}

export const recordings: Recording[] = [
  { title: 'Bach prelude', kind: 'Repertoire', image: previewAssets.piano },
  { title: 'Viola', kind: 'Instrument', image: previewAssets.strings },
  { title: 'Concerto', kind: 'Performance', image: previewAssets.music },
]

export type Paper = {
  title: string
  href: string | null
  citation?: string
}

// Add files to public/media and use paths such as /media/resume.pdf.
// Keep preview true until all reference media and provisional copy are replaced.
export const portfolio = {
  preview: true,
  resumeHref: null as string | null,
  introduction: 'Different ways of looking. One place to explore them.',
  portrait: previewAssets.portrait,
  portraitAlt: 'Reference portrait photograph, not Yujin Kim.',
  portraitCaption: 'Reference portrait. Yujin’s photograph and introduction will appear here.',
  music: {
    src: previewAssets.demoVideo,
    poster: previewAssets.music,
    caption: 'CC0 flower footage from MDN. Replace with Yujin’s recording.',
    demo: true,
  },
  papers: {
    project: { title: 'Project paper', href: null },
    ghp: { title: 'GHP paper', href: null },
  } satisfies Record<string, Paper>,
}


export const navigation = [
  { label: 'Me', href: '/' },
  { label: 'Art', href: '/art' },
  { label: 'Music', href: '/music' },
  { label: 'Research', href: '/research' },
] as const
