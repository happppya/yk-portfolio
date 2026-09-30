import { ArtworkGrid } from '@/components/ArtworkGrid'
import { FlowCanvas } from '@/components/canvas/FlowCanvas'

// Hoisted out of render so the value is stable and the render stays pure.
const currentYear = new Date().getFullYear()

export default function App() {
  return (
    <div className="min-h-dvh bg-ink-950">
      <header className="relative h-dvh w-full overflow-hidden">
        {/* R3F's own wrapper is position:relative, so isolate the canvas in a
            dedicated absolutely-positioned layer rather than fighting its inline styles. */}
        <div className="absolute inset-0">
          <FlowCanvas className="h-full w-full" />
        </div>

        {/* Content sits above the canvas. */}
        <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-10">
          <nav className="flex items-center justify-between text-sm">
            <span className="font-display tracking-tight text-ink-50">Atelier</span>
            <ul className="flex gap-6 text-ink-200/80">
              <li>
                <a className="transition-colors hover:text-accent-400" href="#work">
                  Work
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-accent-400" href="#about">
                  About
                </a>
              </li>
            </ul>
          </nav>

          <div className="max-w-3xl pb-16">
            <h1 className="text-balance font-display text-5xl leading-[0.95] text-ink-50 md:text-7xl">
              Generative work at the edge of code and image.
            </h1>
            <p className="mt-6 max-w-xl text-ink-200/80">
              Real-time shaders, 3D studies, and everything in between. This page is a
              WebGL canvas — move the pointer.
            </p>
          </div>
        </div>
      </header>

      <main id="work" className="bg-ink-950">
        <ArtworkGrid />
      </main>

      <footer className="border-t border-ink-800 px-6 py-10 text-sm text-ink-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} Atelier</p>
          <p>Built with React, Tailwind, Three.js and GLSL.</p>
        </div>
      </footer>
    </div>
  )
}
