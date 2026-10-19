/**
 * Date handling for VRTI time-spans.
 *
 * Dates arrive from the endpoint as xsd:date strings such as "1544-01-01" or "0400-12-31".
 * We never turn them into JavaScript Date objects. A Date is parsed as UTC midnight and then
 * shown in the viewer's local time zone, which is exactly how the old timeline ended up
 * showing "0399-12-31 11:34:39 PM" for a year-400 birth (handbook §3.0). Instead we work
 * with plain numbers: a date becomes a fractional year, e.g. 1544-07-02 ≈ 1544.5.
 */

export interface CalendarDate {
  year: number
  month: number // 1–12
  day: number // 1–31
}

/** How precise a recorded interval is (handbook §3.3). */
export type Precision =
  | 'day' // begin and end are the same day
  | 'year' // exactly 1 Jan – 31 Dec of one year: only the year is known
  | 'span' // anything else: part of a year, or several years

export interface Interval {
  /** Fractional year where the interval starts (inclusive). */
  start: number
  /** Fractional year where the interval ends (exclusive: the end of its last day). */
  end: number
  precision: Precision
  /** First and last possible day, as calendar dates. */
  first: CalendarDate
  last: CalendarDate
  /** The stored values, kept so tooltips can show exactly what the data says. */
  raw: { begin: string; end: string }
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/

/**
 * Reads "YYYY-MM-DD" (anything after the day, such as a time or "Z", is ignored).
 * Returns null for values that are not real dates, such as the one stored as
 * "17/01/1683"^^xsd:date in the Prob11 events graph (handbook §3.11).
 */
export function parseDate(value: string): CalendarDate | null {
  const match = DATE_PATTERN.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12) return null
  if (day < 1 || day > daysInMonth(year, month)) return null
  return { year, month, day }
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
}

function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}

/** 1 January → 1, 31 December → 365 (or 366). */
export function dayOfYear({ year, month, day }: CalendarDate): number {
  let total = day
  for (let m = 1; m < month; m++) total += daysInMonth(year, m)
  return total
}

/** The moment a day begins, as a fractional year. 1544-01-01 → 1544. */
export function startOfDay(date: CalendarDate): number {
  return date.year + (dayOfYear(date) - 1) / daysInYear(date.year)
}

/** The moment a day ends, as a fractional year. 1544-12-31 → 1545. */
export function endOfDay(date: CalendarDate): number {
  return date.year + dayOfYear(date) / daysInYear(date.year)
}

export function classifyPrecision(begin: CalendarDate, end: CalendarDate): Precision {
  const sameDay = begin.year === end.year && begin.month === end.month && begin.day === end.day
  if (sameDay) return 'day'
  const wholeYear =
    begin.year === end.year &&
    begin.month === 1 &&
    begin.day === 1 &&
    end.month === 12 &&
    end.day === 31
  if (wholeYear) return 'year'
  return 'span'
}

/** Builds an Interval from the two stored strings, or null if either cannot be read. */
export function toInterval(beginValue: string, endValue: string): Interval | null {
  const begin = parseDate(beginValue)
  const end = parseDate(endValue)
  if (!begin || !end) return null
  return {
    start: startOfDay(begin),
    end: endOfDay(end),
    precision: classifyPrecision(begin, end),
    first: begin,
    last: end,
    raw: { begin: beginValue, end: endValue },
  }
}

/** Completed years between two calendar dates (an ordinary birthday count). */
export function completedYears(from: CalendarDate, to: CalendarDate): number {
  const beforeBirthday = to.month < from.month || (to.month === from.month && to.day < from.day)
  return to.year - from.year - (beforeBirthday ? 1 : 0)
}

/**
 * Age at death as a range (handbook §4.3):
 * youngest = earliest possible death − latest possible birth,
 * oldest   = latest possible death − earliest possible birth.
 * Christopher Nugent (born some time in 1544, died some time in 1602) → 57–58.
 */
export function ageAtDeath(birth: Interval, death: Interval): { min: number; max: number } {
  return {
    min: completedYears(birth.last, death.first),
    max: completedYears(birth.first, death.last),
  }
}

/** Zero-padded year for SPARQL date literals: 400 → "0400". */
export function padYear(year: number): string {
  return String(year).padStart(4, '0')
}
