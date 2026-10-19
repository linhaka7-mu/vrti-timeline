import type { Interval } from './dates'
import type { YearRange } from './range'

/**
 * Where things go on a timeline row, as percentages of the row width.
 * Kept free of React so it can be unit-tested.
 */

/** The visible stretch of time: from the first moment of `from` to the end of `to`. */
export function toPercent(year: number, { from, to }: YearRange): number {
  return ((year - from) / (to + 1 - from)) * 100
}

export type SegmentKind =
  | 'certain' // the person was certainly alive: drawn dark
  | 'uncertain' // birth or death fell somewhere in here: drawn light (handbook §4.1)

export interface Segment {
  kind: SegmentKind
  /** Left edge, % of the row width. May be negative or over 100: the row clips it. */
  left: number
  /** Width, % of the row width. */
  width: number
}

/**
 * A lifetime bar is up to three segments:
 * light (birth window) · dark (certainly alive) · light (death window).
 * A birth or death known to the day has no window, so it adds no light segment.
 * If the data puts the death before the birth there is no dark segment; the row says so in words.
 */
export function lifeBarSegments(birth: Interval, death: Interval, range: YearRange): Segment[] {
  const segments: Segment[] = []
  const add = (kind: SegmentKind, start: number, end: number) => {
    if (end <= start) return
    const left = toPercent(start, range)
    segments.push({ kind, left, width: toPercent(end, range) - left })
  }
  if (birth.precision !== 'day') add('uncertain', birth.start, birth.end)
  add('certain', birth.end, death.start)
  if (death.precision !== 'day') add('uncertain', death.start, death.end)
  return segments
}

/** "1544–1602": first possible birth year to last possible death year. */
export function lifeYears(birth: Interval, death: Interval): string {
  return `${Math.floor(birth.start)}–${Math.ceil(death.end) - 1}`
}
