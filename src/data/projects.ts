export type ArtworkMedium = 'shader' | 'three' | 'image' | 'video' | 'writing'

export type Artwork = {
  slug: string
  title: string
  year: number
  medium: ArtworkMedium
  /** Short line for grid cards. */
  blurb: string
  /** Longer prose for the detail view. */
  description?: string
  /** Path under /public, or an imported asset url for canvas-based works. */
  cover?: string
  tags: string[]
  featured?: boolean
}

export const artworks: Artwork[] = [
  {
    slug: 'nocturne-field',
    title: 'Nocturne Field',
    year: 2026,
    medium: 'shader',
    blurb: 'A flow field that breathes with the pointer.',
    tags: ['glsl', 'realtime'],
    featured: true,
  },
  {
    slug: 'study-01',
    title: 'Study 01',
    year: 2025,
    medium: 'image',
    blurb: 'Placeholder slot — drop in the first real piece.',
    tags: ['placeholder'],
  },
]

export const featuredArtworks = artworks.filter((artwork) => artwork.featured)
