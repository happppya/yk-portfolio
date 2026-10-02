import { parse as parseYaml } from 'yaml'

/**
 * The vocabulary every content file is read with: a value is either accepted or
 * rejected with the exact file and setting to fix, so an editor never has to
 * guess which line the parser meant.
 *
 * Nothing here touches the browser, so the tests read the shipped files through
 * exactly the code the page does.
 */

export type Mapping = Record<string, unknown>

/** The path of a setting inside its file, e.g. `modes.light.atmosphere.warm`. */
function at(where: string, key: string) {
  return where ? `${where}.${key}` : key
}

/**
 * Throws a mistake. `where` is either a path inside the file the caller wrapped
 * in `inFile`, or a path that already names its file.
 */
export function fail(where: string, detail: string): never {
  throw new Error(`${where}: ${detail}`)
}

/**
 * Read the values in `run` as if they came from `file`, so a mistake inside names
 * the file the editor actually has open. Wrap a whole file once: wrapping one
 * file's parse inside another would label the error twice.
 */
export function inFile<T>(file: string, run: () => T): T {
  try {
    return run()
  } catch (error) {
    if (!(error instanceof Error)) throw error
    throw new Error(`${file} → ${error.message}`)
  }
}

/** The file did not parse as YAML at all. Call inside `inFile` so it gets a name. */
export function readYaml(source: string): unknown {
  try {
    return parseYaml(source)
  } catch (error) {
    throw new Error(`could not be read: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function describe(value: unknown) {
  if (value === undefined || value === null) return ' (nothing was written)'
  return ` (found ${JSON.stringify(value)})`
}

export function mapping(value: unknown, where: string): Mapping {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fail(where, 'needs its own block of indented settings')
  }
  return value as Mapping
}

export function group(source: Mapping, key: string, where: string): Mapping {
  return mapping(source[key], at(where, key))
}

/** Reject a misspelled setting instead of silently ignoring it. */
export function only(source: Mapping, where: string, allowed: readonly string[]) {
  const unknown = Object.keys(source).find((key) => !allowed.includes(key))
  if (unknown) fail(where, `has an unknown setting "${unknown}". Allowed here: ${allowed.join(', ')}`)
}

export function optionalText(source: Mapping, key: string, where: string): string | undefined {
  const value = source[key]
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value !== 'string') return fail(at(where, key), 'needs text')
  return value.trim() === '' ? undefined : value
}

export function text(source: Mapping, key: string, where: string): string {
  return optionalText(source, key, where) ?? fail(at(where, key), 'cannot be left empty')
}

export function number(source: Mapping, key: string, where: string): number {
  const value = source[key]
  const result = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  if (!Number.isFinite(result) || result <= 0) return fail(at(where, key), `needs a number above zero${describe(value)}`)
  return result
}

export function flag(source: Mapping, key: string, where: string): boolean {
  const value = source[key]
  if (typeof value === 'boolean') return value
  return fail(at(where, key), `needs true or false${describe(value)}`)
}

export function choice<const T extends readonly string[]>(source: Mapping, key: string, where: string, options: T): T[number] {
  const value = source[key]
  if (typeof value === 'string' && (options as readonly string[]).includes(value)) return value as T[number]
  return fail(at(where, key), `must be one of: ${options.join(', ')}${describe(value)}`)
}

/** A hex colour, optionally with an alpha pair: `#rrggbb` or `#rrggbbaa`. */
const HEX_COLOUR = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/

export function colour(source: Mapping, key: string, where: string): string {
  const value = text(source, key, where)
  if (!HEX_COLOUR.test(value.toLowerCase().trim())) {
    return fail(at(where, key), `needs a colour such as #a83b2e, in quotes${describe(value)}`)
  }
  return value.toLowerCase().trim()
}

export function lines(value: unknown, where: string): string[] {
  if (!Array.isArray(value) || value.length === 0) return fail(where, 'needs at least one line, each starting with "- "')
  return value.map((line, index) => {
    if (typeof line !== 'string' || line.trim() === '') return fail(`${where}[${index}]`, 'needs text on one line')
    return line
  })
}

export function items(value: unknown, where: string): Mapping[] {
  if (!Array.isArray(value) || value.length === 0) return fail(where, 'needs at least one item, each starting with "- "')
  return value.map((item, index) => mapping(item, `${where}[${index}]`))
}
