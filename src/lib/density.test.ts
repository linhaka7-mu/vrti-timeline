import { describe, expect, it } from 'vitest'
import { decadeCounts, sqrtShare, toPairs } from './density'

const lit = (value: string) => ({ type: 'literal', value })

describe('toPairs', () => {
  it('reads years and counts, and drops rows it cannot read', () => {
    const rows = [
      { birth: lit('1544'), death: lit('1602'), people: lit('3') },
      { birth: lit('x'), death: lit('1602'), people: lit('1') },
      { death: lit('1602'), people: lit('1') },
    ]
    expect(toPairs(rows)).toEqual([{ birth: 1544, death: 1602, people: 3 }])
  })
})

describe('decadeCounts', () => {
  const counts = (pairs: Parameters<typeof decadeCounts>[0]) => decadeCounts(pairs, 1500, 1749)
  const at = (list: ReturnType<typeof decadeCounts>, start: number) => list.find((d) => d.start === start)?.count

  it('counts someone in every decade from birth to death (Christopher Nugent, 1544–1602)', () => {
    const list = counts([{ birth: 1544, death: 1602, people: 1 }])
    expect(at(list, 1530)).toBe(0)
    expect(at(list, 1540)).toBe(1)
    expect(at(list, 1600)).toBe(1)
    expect(at(list, 1610)).toBe(0)
  })
  it('adds up the people who share a pair of years', () => {
    expect(at(counts([{ birth: 1600, death: 1650, people: 4 }, { birth: 1620, death: 1630, people: 2 }]), 1620)).toBe(6)
  })
  it('only counts decades inside the slider', () => {
    const list = counts([{ birth: 1450, death: 1800, people: 1 }])
    expect(list[0]).toEqual({ start: 1500, count: 1 })
    expect(list[list.length - 1]).toEqual({ start: 1740, count: 1 })
  })
  it('leaves out people whose death is recorded before their birth', () => {
    expect(counts([{ birth: 1600, death: 1550, people: 1 }]).every((d) => d.count === 0)).toBe(true)
  })
})

describe('sqrtShare', () => {
  it('uses a square-root scale', () => {
    expect(sqrtShare(25, 100)).toBe(0.5)
    expect(sqrtShare(100, 100)).toBe(1)
    expect(sqrtShare(0, 0)).toBe(0)
  })
})
