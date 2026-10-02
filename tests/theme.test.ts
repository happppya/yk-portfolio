import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { THEME_FILE, parseTheme } from '../src/lib/theme-content.ts'
import { applyTheme, themeProperties } from '../src/lib/apply-theme.ts'
import { theme, themeSource } from './support/site.ts'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const css = read('../src/index.css')
const app = read('../src/App.tsx')

/** The custom properties declared inside the first rule that matches. */
function declarations(pattern: RegExp) {
  const found = pattern.exec(css)
  assert.ok(found, `expected the stylesheet to match ${pattern}`)
  return Object.fromEntries([...found[1].matchAll(/(--[a-z-]+):\s*([^;]+);/g)].map(([, token, value]) => [token, value.trim()]))
}

const lightBlock = declarations(/:root \{([\s\S]*?)\n\}/)
const darkBlock = declarations(/:root\[data-theme='dark'\] \{([\s\S]*?)\n\}/)
const mediaBlock = declarations(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme='light'\]\):not\(\[data-theme='dark'\]\) \{([\s\S]*?)\n\s*\}\s*\}/)

/** Accents, ink, and the scrim are the same in both modes, so only :root declares them. */
const MODE_INDEPENDENT = ['--accent-me', '--accent-art', '--accent-music', '--accent-research',
  '--accent-ink-light', '--accent-ink-dark', '--scrim']

test('the colour of the site comes from content/theme.yaml', () => {
  assert.equal(THEME_FILE, 'content/theme.yaml')
  // The app resolves the visitor's choice and paints the theme's values over the stylesheet.
  assert.match(app, /applyTheme\(document\.documentElement, theme, mode\)/)
  assert.match(app, /document\.documentElement\.dataset\.theme = mode/)
  assert.match(app, /prefers-color-scheme: dark/)
  // "system" never reaches the document: only the resolved mode does.
  assert.doesNotMatch(app, /dataset\.theme = themeSetting/)
})

test('the stylesheet carries the same palette so the first paint is already right', () => {
  const light = themeProperties(theme, 'light')
  const dark = themeProperties(theme, 'dark')
  for (const [token, value] of Object.entries(light)) {
    assert.equal(lightBlock[token], value, `${token} should match the light theme in :root`)
    if (MODE_INDEPENDENT.includes(token)) continue
    assert.equal(darkBlock[token], dark[token], `${token} should match the dark theme`)
    assert.equal(mediaBlock[token], dark[token], `${token} should match the dark theme under prefers-color-scheme`)
  }
  // Accents, ink, and the scrim are declared once and inherit into both modes.
  for (const token of MODE_INDEPENDENT) {
    assert.equal(darkBlock[token], undefined, `${token} should not be redeclared for the dark theme`)
    assert.equal(mediaBlock[token], undefined, `${token} should not be redeclared under prefers-color-scheme`)
  }
})

test('no colour escapes the theme file', () => {
  const controlled = new Set(Object.keys(themeProperties(theme, 'light')))
  for (const [token, value] of Object.entries({ ...lightBlock, ...darkBlock, ...mediaBlock })) {
    if (!/^#[0-9a-f]{3,8}$/i.test(value)) continue
    assert.ok(controlled.has(token), `${token} is a colour the theme file cannot control`)
  }
  // The registered accents mirror the theme file, so easing between destinations stays correct.
  assert.match(css, new RegExp(`@property --accent \\{ syntax: '<color>'; inherits: true; initial-value: ${theme.accents.me}; \\}`))
  assert.match(css, new RegExp(`@property --accent-ink \\{ syntax: '<color>'; inherits: true; initial-value: ${theme.ink.light}; \\}`))
})

test('both modes define the hero colour scheme the Me page reads', () => {
  for (const mode of ['light', 'dark'] as const) {
    const properties = themeProperties(theme, mode)
    assert.equal(properties['--atmosphere-deep'], theme.modes[mode].atmosphere.deep)
    assert.equal(properties['--atmosphere-warm'], theme.modes[mode].atmosphere.warm)
    assert.match(theme.modes[mode].atmosphere.deep, /^#[0-9a-f]{6}$/)
  }
  // The wash behind the canvas and the shader both follow it.
  assert.match(css.match(/\.me-atmosphere \{([^}]+)\}/)![1], /var\(--atmosphere-warm\)/)
})

test('a colour the site cannot use names the file and the setting', () => {
  const notAColour = themeSource.replace("warm: '#eccd74'", 'warm: blue')
  assert.throws(() => parseTheme(notAColour),
    /content\/theme\.yaml → modes\.light\.atmosphere\.warm: needs a colour such as #a83b2e, in quotes \(found "blue"\)/)
  const unquoted = themeSource.replace("deep: '#a1750f'", 'deep: #a1750f')
  assert.throws(() => parseTheme(unquoted), /content\/theme\.yaml → modes\.light\.atmosphere/)
  const emptied = themeSource.replace("secondary: '#525861'", 'secondary:')
  assert.throws(() => parseTheme(emptied), /content\/theme\.yaml → modes\.light\.secondary: cannot be left empty/)
})

test('a misspelled theme setting is reported instead of being silently ignored', () => {
  const stray = themeSource.replace('surface_raised:', 'surface_rased:')
  assert.throws(() => parseTheme(stray), /content\/theme\.yaml → modes\.light: has an unknown setting "surface_rased"/)
  const missingAccent = themeSource.replace('  research:', '  reesearch:')
  assert.throws(() => parseTheme(missingAccent), /content\/theme\.yaml → accents: has an unknown setting "reesearch"/)
})

test('applying a mode writes every token the stylesheet reads', () => {
  const written: Record<string, string> = {}
  const element = { style: { setProperty: (token: string, value: string) => { written[token] = value } } } as unknown as HTMLElement
  applyTheme(element, theme, 'dark')
  assert.deepEqual(written, themeProperties(theme, 'dark'))
  assert.equal(written['--surface'], theme.modes.dark.surface)
  assert.equal(written['--scrim'], theme.scrim)
})
