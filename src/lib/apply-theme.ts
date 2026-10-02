import type { Theme, ThemeMode } from './theme-content.ts'

/**
 * Turns [content/theme.yaml](../../content/theme.yaml) into the custom properties
 * the stylesheet reads. Kept apart from the DOM so the mapping itself can be
 * checked in Node: every token the stylesheet declares a colour for has to come
 * from here, or it is a colour nobody can edit.
 */

export function themeProperties(theme: Theme, mode: ThemeMode): Record<string, string> {
  const palette = theme.modes[mode]
  return {
    '--surface': palette.surface,
    '--surface-raised': palette.surfaceRaised,
    '--text': palette.text,
    '--secondary': palette.secondary,
    '--line': palette.line,
    '--focus': palette.focus,
    '--atmosphere-deep': palette.atmosphere.deep,
    '--atmosphere-warm': palette.atmosphere.warm,
    '--ambient-cool': palette.ambient.cool,
    '--ambient-warm': palette.ambient.warm,
    '--accent-me': theme.accents.me,
    '--accent-art': theme.accents.art,
    '--accent-music': theme.accents.music,
    '--accent-research': theme.accents.research,
    '--accent-ink-light': theme.ink.light,
    '--accent-ink-dark': theme.ink.dark,
    '--scrim': theme.scrim,
  }
}

/** Write one mode's palette onto an element, over the stylesheet's fallback. */
export function applyTheme(element: HTMLElement, theme: Theme, mode: ThemeMode) {
  for (const [token, value] of Object.entries(themeProperties(theme, mode))) {
    element.style.setProperty(token, value)
  }
}
