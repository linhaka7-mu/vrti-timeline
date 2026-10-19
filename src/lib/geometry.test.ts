import { describe, expect, it } from 'vitest'
import { toInterval } from './dates'
import { lifeBarSegments, lifeYears, toPercent } from './geometry'

const span = (a: string, b: string) => toInterval(a, b)!
const EARLY_MODERN = { from: 1500, to: 1749 }

describe('toPercent', () => {
  it('maps the start of the range to 0% and the end of its last year to 100%', () => {
    expect(toPercent(1500, EARLY_MODERN)).toBe(0)
    expect(toPercent(1750, EARLY_MODERN)).toBe(100)
    expect(toPercent(1625, EARLY_MODERN)).toBe(50)
  })
})

describe('lifeBarSegments', () => {
  it('draws year-only ends as light segments one year wide (Christopher Nugent)', () => {
    const segs = lifeBarSegments(span('1544-01-01', '1544-12-31'), span('1602-01-01', '1602-12-31'), EARLY_MODERN)
    expect(segs.map((s) => s.kind)).toEqual(['uncertain', 'certain', 'uncertain'])
    expect(segs[0].width).toBeCloseTo(100 / 250) // one year out of 250
    expect(segs[0].left + segs[0].width).toBeCloseTo(segs[1].left) // no gap between segments
  })

  it('draws exact dates as one dark segment (Esther Van Homrigh)', () => {
    const segs = lifeBarSegments(span('1688-02-14', '1688-02-14'), span('1723-06-02', '1723-06-02'), EARLY_MODERN)
    expect(segs.map((s) => s.kind)).toEqual(['certain'])
  })

  it('mixes the two when only the birth year is known (Henry Jones)', () => {
    const segs = lifeBarSegments(span('1605-01-01', '1605-12-31'), span('1682-01-05', '1682-01-05'), EARLY_MODERN)
    expect(segs.map((s) => s.kind)).toEqual(['uncertain', 'certain'])
  })

  it('leaves out the dark segment when the death is recorded before the birth', () => {
    const segs = lifeBarSegments(span('1480-01-01', '1480-12-31'), span('1362-07-31', '1362-07-31'), EARLY_MODERN)
    expect(segs.map((s) => s.kind)).toEqual(['uncertain'])
  })
})

describe('lifeYears', () => {
  it('shows the first possible birth year and the last possible death year', () => {
    expect(lifeYears(span('1544-01-01', '1544-12-31'), span('1602-01-01', '1602-12-31'))).toBe('1544–1602')
    expect(lifeYears(span('1688-02-14', '1688-02-14'), span('1723-06-02', '1723-06-02'))).toBe('1688–1723')
  })
})
