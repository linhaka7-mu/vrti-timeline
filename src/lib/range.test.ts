import { describe, expect, it } from 'vitest'
import { normaliseRange, parseYearText, rangeFromSearch, rangeLength, rangeToSearch, tickYears } from './range'

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

describe('rangeFromSearch', () => {
  it('reads a shared link', () => {
    expect(rangeFromSearch('?from=1750&to=1922')).toEqual({ from: 1750, to: 1922 })
  })
  it('falls back to Early Modern when the link has no or bad years', () => {
    expect(rangeFromSearch('')).toEqual({ from: 1500, to: 1749 })
    expect(rangeFromSearch('?from=abc&to=1922')).toEqual({ from: 1500, to: 1749 })
  })
  it('keeps shared years inside the slider limits', () => {
    expect(rangeFromSearch('?from=100&to=1200')).toEqual({ from: 400, to: 1200 })
  })
})

describe('rangeToSearch', () => {
  it('round-trips with rangeFromSearch', () => {
    const range = { from: 1750, to: 1922 }
    expect(rangeToSearch(range)).toBe('?from=1750&to=1922')
    expect(rangeFromSearch(rangeToSearch(range))).toEqual(range)
  })
})

describe('parseYearText', () => {
  it('accepts whole years', () => {
    expect(parseYearText(' 1641 ')).toBe(1641)
  })
  it('pulls years outside the slider to the nearest limit', () => {
    expect(parseYearText('300')).toBe(400)
    expect(parseYearText('2100')).toBe(2025)
  })
  it('rejects anything else', () => {
    expect(parseYearText('')).toBeNull()
    expect(parseYearText('16th c.')).toBeNull()
    expect(parseYearText('1641.5')).toBeNull()
    expect(parseYearText('-50')).toBeNull()
  })
})
