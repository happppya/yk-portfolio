# Marble hero atmosphere (archived)

The previous Me hero background: a document-anchored WebGL layer running a two-pass
effect — a feedback pass that collected mist and cursor velocity, and a display pass
that painted theme-aware pearlescent marbling from a nested sinusoidal fBM with relief
lighting, then bent it with a liquid cursor lens.

It adapted [inspiration/heroshader.txt](../../inspiration/heroshader.txt).

It was replaced by the hero in [src/components/MeAtmosphere.tsx](../../src/components/MeAtmosphere.tsx),
which follows [inspiration/new_heroshader.txt](../../inspiration/new_heroshader.txt) instead.
The new hero keeps this one's framing ideas — document-anchored, top-anchored, scroll-faded,
quiet under the type, a cursor effect and a decaying wake — and changes the pattern, the
cursor's mark on it, and the palette.

Nothing here is built, imported, or tested. It is kept as a snapshot so the previous
hero can be compared against or restored.

## Restoring

Move these files back over their old paths:

| Archived file | Original path |
| --- | --- |
| `atmosphere-display.frag` | `src/shaders/atmosphere-display.frag` |
| `atmosphere-flow.frag` | `src/shaders/atmosphere-flow.frag` |
| `atmosphere.vert` | `src/shaders/atmosphere.vert` |
| `MeAtmosphere.tsx` | `src/components/MeAtmosphere.tsx` |

`MeAtmosphere.tsx` imports `@/lib/atmosphere` and `@/shaders/*?raw`, so it only works
from `src/`. It also expects the `--accent`/`--text`/`--surface` uniforms that
[src/index.css](../../src/index.css) still defines; it does not know about the newer
`--atmosphere-deep` and `--atmosphere-warm` tokens, which the current hero uses.
The shader policy assertions in [tests/atmosphere.test.ts](../../tests/atmosphere.test.ts)
describe the current hero, so restoring this one means restoring its own assertions too.
