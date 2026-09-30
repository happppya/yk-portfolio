import { featuredArtworks, type Artwork } from '@/data/projects'
import { cn } from '@/lib/cn'

type ArtworkCardProps = {
  artwork: Artwork
  className?: string
}

function ArtworkCard({ artwork, className }: ArtworkCardProps) {
  return (
    <article
      className={cn(
        'group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-2xl',
        'border border-ink-800 bg-ink-900 p-5 transition-colors duration-500',
        'ease-out-expo hover:border-ink-700',
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-900/60 to-transparent" />

      <div className="relative">
        <p className="text-xs tracking-widest text-ink-400 uppercase">
          {artwork.medium} · {artwork.year}
        </p>
        <h3 className="mt-2 font-display text-2xl text-ink-50">{artwork.title}</h3>
        <p className="mt-2 text-sm text-ink-400">{artwork.blurb}</p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {artwork.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-ink-700 px-2.5 py-0.5 text-xs text-ink-400"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export function ArtworkGrid() {
  if (featuredArtworks.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="mb-10 flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-ink-50">Selected work</h2>
        <span className="text-sm text-ink-400">{featuredArtworks.length} pieces</span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featuredArtworks.map((artwork) => (
          <ArtworkCard key={artwork.slug} artwork={artwork} />
        ))}
      </div>
    </section>
  )
}
