/**
 * The year range the user can choose, and the four eras the Knowledge Graph explorer uses.
 */

/** Slider limits. The data starts in 0050, but almost nothing is recorded before 400 (handbook §3.13). */
export const DOMAIN_START = 400
export const DOMAIN_END = 2025

export const DEFAULT_RANGE: YearRange = { from: 1500, to: 1749 }

export interface YearRange {
  from: number
  to: number
}

export interface Era {
  name: string
  label: string
  from: number
  to: number
}

/** Same buckets as kg.virtualtreasury.ie (handbook §2, §4.7). */
export const ERAS: Era[] = [
  { name: 'Medieval', label: '400–1499', from: 400, to: 1499 },
  { name: 'Early Modern', label: '1500–1749', from: 1500, to: 1749 },
  { name: 'Modern', label: '1750–1922', from: 1750, to: 1922 },
  { name: 'Post-1922', label: '1923–', from: 1923, to: DOMAIN_END },
]

export function clampYear(year: number): number {
  return Math.min(DOMAIN_END, Math.max(DOMAIN_START, Math.round(year)))
}

/** Keeps both ends inside the domain and in order. */
export function normaliseRange(from: number, to: number): YearRange {
  const a = clampYear(from)
  const b = clampYear(to)
  return a <= b ? { from: a, to: b } : { from: b, to: a }
}

/** Number of years covered, counting both ends: 1500–1749 → 250. */
export function rangeLength({ from, to }: YearRange): number {
  return to - from + 1
}

/** Axis labels: finer steps for short ranges, coarser for long ones. */
export function tickYears({ from, to }: YearRange): number[] {
  const length = to + 1 - from
  const step = length <= 60 ? 5 : length <= 150 ? 10 : length <= 320 ? 25 : length <= 800 ? 100 : 250
  const ticks: number[] = []
  for (let year = Math.ceil(from / step) * step; year <= to + 1; year += step) ticks.push(year)
  return ticks
}

/**
 * Reads ?from=…&to=… from the page address, so a view can be shared as a link
 * (handbook §4.4: "what she takes away"). Anything missing or invalid falls back to the default.
 */
export function rangeFromSearch(search: string): YearRange {
  const params = new URLSearchParams(search)
  const from = Number(params.get('from'))
  const to = Number(params.get('to'))
  if (!params.has('from') || !params.has('to') || !Number.isInteger(from) || !Number.isInteger(to)) {
    return DEFAULT_RANGE
  }
  return normaliseRange(from, to)
}
