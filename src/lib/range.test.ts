import { describe, expect, it } from 'vitest'
import { normaliseRange, rangeLength, tickYears } from './range'

describe('normaliseRange', () => {
  it('clamps to the slider domain and puts the ends in order', () => {
    expect(normaliseRange(100, 3000)).toEqual({ from: 400, to: 2025 })
    expect(normaliseRange(1749, 1500)).toEqual({ from: 1500, to: 1749 })
  })
})

describe('rangeLength', () => {
  it('counts both end years', () => {
    expect(rangeLength({ from: 1500, to: 1749 })).toBe(250)
  })
})

describe('tickYears', () => {
  it('uses 25-year steps for an era-sized range', () => {
    expect(tickYears({ from: 1500, to: 1749 })).toEqual([1500, 1525, 1550, 1575, 1600, 1625, 1650, 1675, 1700, 1725, 1750])
  })
})
