import { ageAtDeath, daysInMonth, type CalendarDate, type Interval } from './dates'
import type { Gender, Person } from './people'

/*
 * Plain-English wording for the person card (components/PersonCard.tsx).
 * Siyan chose a sentence ("Born some time in 1451 and died on 4 July 1499, aged 47 or 48.")
 * over a table of dates, so that people without a background in history can read it
 * (sketch page 设计备份/悬停卡片方案 2026-11-14.html, option G).
 */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** 4 July 1499 */
export function describeDay(date: CalendarDate): string {
  return `${date.day} ${MONTHS[date.month - 1]} ${date.year}`
}

const startsMonth = (d: CalendarDate) => d.day === 1
const endsMonth = (d: CalendarDate) => d.day === daysInMonth(d.year, d.month)

/**
 * When something happened, as precisely as the data allows and no more:
 * - one day: "on 4 July 1499"
 * - a whole year: "some time in 1451"
 * - one whole month: "some time in March 1573"
 * - whole months in one year: "some time between March and April 1573"
 * - whole years: "some time between 1540 and 1545"
 * - anything else: "between 3 March 1573 and 20 April 1573"
 */
export function describeInterval(interval: Interval): string {
  const { first, last, precision } = interval
  if (precision === 'day') return `on ${describeDay(first)}`
  if (precision === 'year') return `some time in ${first.year}`
  const wholeMonths = startsMonth(first) && endsMonth(last)
  if (wholeMonths && first.year === last.year) {
    if (first.month === last.month) return `some time in ${MONTHS[first.month - 1]} ${first.year}`
    return `some time between ${MONTHS[first.month - 1]} and ${MONTHS[last.month - 1]} ${first.year}`
  }
  if (wholeMonths && first.month === 1 && last.month === 12) {
    return `some time between ${first.year} and ${last.year}`
  }
  return `between ${describeDay(first)} and ${describeDay(last)}`
}

/** "47 or 48", "111", or "between 55 and 60" when the dates leave more than one year open. */
export function describeAge(birth: Interval, death: Interval): string {
  const { min, max } = ageAtDeath(birth, death)
  if (min === max) return `${min}`
  if (max - min === 1) return `${min} or ${max}`
  return `between ${min} and ${max}`
}

/** The small label above the name: "Person · Female", or just "Person" when gender is not recorded. */
export function cardKicker(gender?: Gender): string {
  if (gender === 'female') return 'Person · Female'
  if (gender === 'male') return 'Person · Male'
  return 'Person'
}

/** Whether the card should leave out the age: it means nothing when death is recorded before birth. */
export function showsAge(person: Person): boolean {
  return !person.issues.includes('death recorded before birth')
}
