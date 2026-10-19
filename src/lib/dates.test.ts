import { describe, expect, it } from 'vitest'
import { ageAtDeath, classifyPrecision, endOfDay, padYear, parseDate, startOfDay, toInterval } from './dates'

describe('parseDate', () => {
  it('reads ordinary and early dates', () => {
    expect(parseDate('1544-01-01')).toEqual({ year: 1544, month: 1, day: 1 })
    expect(parseDate('0400-12-31')).toEqual({ year: 400, month: 12, day: 31 })
  })

  it('ignores a time or zone after the day', () => {
    expect(parseDate('1688-02-14Z')).toEqual({ year: 1688, month: 2, day: 14 })
  })

  it('rejects the invalid lexical form found in the Prob11 events graph', () => {
    expect(parseDate('17/01/1683')).toBeNull()
  })

  it('rejects impossible days', () => {
    expect(parseDate('1700-02-29')).toBeNull() // 1700 is not a leap year
    expect(parseDate('1600-02-29')).not.toBeNull() // 1600 is
  })
})

describe('fractional years', () => {
  it('maps a whole year onto [year, year + 1)', () => {
    const jan1 = parseDate('1544-01-01')!
    const dec31 = parseDate('1544-12-31')!
    expect(startOfDay(jan1)).toBe(1544)
    expect(endOfDay(dec31)).toBe(1545)
  })

  it('never shifts the year, unlike the old timeline (0400 must not become 0399)', () => {
    expect(Math.floor(startOfDay(parseDate('0400-01-01')!))).toBe(400)
  })
})

describe('classifyPrecision', () => {
  const d = (s: string) => parseDate(s)!
  it('recognises the three shapes in the data', () => {
    expect(classifyPrecision(d('1820-11-22'), d('1820-11-22'))).toBe('day')
    expect(classifyPrecision(d('1544-01-01'), d('1544-12-31'))).toBe('year')
    expect(classifyPrecision(d('1688-03-01'), d('1688-04-30'))).toBe('span')
    expect(classifyPrecision(d('1568-01-01'), d('1578-12-31'))).toBe('span')
  })
})

describe('ageAtDeath', () => {
  const span = (a: string, b: string) => toInterval(a, b)!

  it('gives a single age when both dates are exact (Katharine Plunket)', () => {
    expect(ageAtDeath(span('1820-11-22', '1820-11-22'), span('1932-10-14', '1932-10-14'))).toEqual({ min: 111, max: 111 })
  })

  it('counts a death on the birthday as a full year', () => {
    expect(ageAtDeath(span('1900-05-01', '1900-05-01'), span('1950-05-01', '1950-05-01'))).toEqual({ min: 50, max: 50 })
  })

  it('gives a range when only years are known (Christopher Nugent)', () => {
    expect(ageAtDeath(span('1544-01-01', '1544-12-31'), span('1602-01-01', '1602-12-31'))).toEqual({ min: 57, max: 58 })
  })

  it('makes the implausible visible without any visual trick (Ercnait)', () => {
    expect(ageAtDeath(span('0400-01-01', '0400-12-31'), span('0600-01-01', '0600-12-31'))).toEqual({ min: 199, max: 200 })
  })
})

describe('padYear', () => {
  it('pads to four digits for xsd:date literals', () => {
    expect(padYear(400)).toBe('0400')
    expect(padYear(1749)).toBe('1749')
  })
})
