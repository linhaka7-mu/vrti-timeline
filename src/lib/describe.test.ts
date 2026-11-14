import { describe, expect, it } from 'vitest'
import { toInterval, type Interval } from './dates'
import { cardKicker, describeAge, describeDay, describeInterval } from './describe'

const span = (begin: string, end: string): Interval => toInterval(begin, end)!

describe('describeInterval', () => {
  it('says "on" for one known day', () => {
    expect(describeInterval(span('1499-07-04', '1499-07-04'))).toBe('on 4 July 1499')
  })
  it('says "some time in" a year when only the year is known (Joan Preston)', () => {
    expect(describeInterval(span('1451-01-01', '1451-12-31'))).toBe('some time in 1451')
  })
  it('names the month when the whole month is known', () => {
    expect(describeInterval(span('1576-06-01', '1576-06-30'))).toBe('some time in June 1576')
  })
  it('names both months for a two-month window (Freedom of Dublin records)', () => {
    expect(describeInterval(span('1573-03-01', '1573-04-30'))).toBe('some time between March and April 1573')
  })
  it('names both years for a span of whole years', () => {
    expect(describeInterval(span('1540-01-01', '1545-12-31'))).toBe('some time between 1540 and 1545')
  })
  it('falls back to both days for anything else', () => {
    expect(describeInterval(span('1573-03-03', '1573-04-20'))).toBe('between 3 March 1573 and 20 April 1573')
  })
  it('handles the end of February in a leap year as a whole month', () => {
    expect(describeInterval(span('1600-02-01', '1600-02-29'))).toBe('some time in February 1600')
  })
})

describe('describeAge', () => {
  it('gives one number when both dates are exact (Katharine Plunket)', () => {
    expect(describeAge(span('1820-11-22', '1820-11-22'), span('1932-10-14', '1932-10-14'))).toBe('111')
  })
  it('says "or" when one year is open (Joan Preston)', () => {
    expect(describeAge(span('1451-01-01', '1451-12-31'), span('1499-07-04', '1499-07-04'))).toBe('47 or 48')
  })
  it('says "between" when more than one year is open', () => {
    expect(describeAge(span('1540-01-01', '1545-12-31'), span('1600-06-01', '1600-06-01'))).toBe('between 54 and 60')
  })
})

describe('describeDay and cardKicker', () => {
  it('writes a day the British way', () => {
    expect(describeDay({ year: 400, month: 12, day: 31 })).toBe('31 December 400')
  })
  it('puts gender in the label only when it is recorded', () => {
    expect(cardKicker('female')).toBe('Person · Female')
    expect(cardKicker('male')).toBe('Person · Male')
    expect(cardKicker(undefined)).toBe('Person')
  })
})
