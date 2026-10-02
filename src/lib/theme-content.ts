import { colour, group, inFile, mapping, only, readYaml, type Mapping } from './content-schema.ts'

/**
 * The site's colour format: [content/theme.yaml](../../content/theme.yaml) is the
 * single source of truth for every colour the site uses, light and dark, and
 * [apply-theme.ts](apply-theme.ts) turns it into the stylesheet's custom
 * properties.
 *
 * The stylesheet carries the same values so the first paint is already right,
 * and [tests/theme.test.ts](../../tests/theme.test.ts) fails if the two drift.
 */

export const THEME_FILE = 'content/theme.yaml'

export type ThemeMode = 'light' | 'dark'

export type ThemePalette = {
  surface: string
  surfaceRaised: string
  text: string
  secondary: string
  line: string
  focus: string
  /** The Me hero's two stops: the denser fold, then the veil over it. */
  atmosphere: { deep: string; warm: string }
}

export type Theme = {
  accents: { me: string; art: string; music: string; research: string }
  /** Ink that sits on an accent: light for the dark accents, dark for the light one. */
  ink: { light: string; dark: string }
  /** What sits behind a dialog, over the page beneath it. */
  scrim: string
  modes: Record<ThemeMode, ThemePalette>
}

export function parseTheme(source: string): Theme {
  return inFile(THEME_FILE, () => theme(mapping(readYaml(source), 'the file')))
}

function palette(mode: Mapping, where: string): ThemePalette {
  only(mode, where, ['surface', 'surface_raised', 'text', 'secondary', 'line', 'focus', 'atmosphere'])
  const atmosphere = group(mode, 'atmosphere', where)
  const atmosphereWhere = `${where}.atmosphere`
  only(atmosphere, atmosphereWhere, ['deep', 'warm'])
  return {
    surface: colour(mode, 'surface', where),
    surfaceRaised: colour(mode, 'surface_raised', where),
    text: colour(mode, 'text', where),
    secondary: colour(mode, 'secondary', where),
    line: colour(mode, 'line', where),
    focus: colour(mode, 'focus', where),
    atmosphere: { deep: colour(atmosphere, 'deep', atmosphereWhere), warm: colour(atmosphere, 'warm', atmosphereWhere) },
  }
}

function theme(root: Mapping): Theme {
  only(root, 'the file', ['accents', 'ink', 'scrim', 'modes'])
  const accents = group(root, 'accents', '')
  only(accents, 'accents', ['me', 'art', 'music', 'research'])
  const ink = group(root, 'ink', '')
  only(ink, 'ink', ['light', 'dark'])
  const modes = group(root, 'modes', '')
  only(modes, 'modes', ['light', 'dark'])
  return {
    accents: {
      me: colour(accents, 'me', 'accents'),
      art: colour(accents, 'art', 'accents'),
      music: colour(accents, 'music', 'accents'),
      research: colour(accents, 'research', 'accents'),
    },
    ink: { light: colour(ink, 'light', 'ink'), dark: colour(ink, 'dark', 'ink') },
    scrim: colour(root, 'scrim', ''),
    modes: { light: palette(group(modes, 'light', 'modes'), 'modes.light'), dark: palette(group(modes, 'dark', 'modes'), 'modes.dark') },
  }
}
