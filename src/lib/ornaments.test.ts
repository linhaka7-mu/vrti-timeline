import { describe, expect, it } from 'vitest'
import { cornerFringePath, FRINGE_HEIGHT, FRINGE_WIDTH, seededRandom, starPath } from './ornaments'

/** Every x,y pair in a path, as numbers. */
function points(path: string): [number, number][] {
  return [...path.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])])
}

describe('seededRandom', () => {
  it('gives the same numbers for the same seed, all in [0, 1)', () => {
    const a = seededRandom(5)
    const b = seededRandom(5)
    const run = Array.from({ length: 50 }, () => a())
    expect(Array.from({ length: 50 }, () => b())).toEqual(run)
    expect(run.every((n) => n >= 0 && n < 1)).toBe(true)
  })
})

describe('cornerFringePath', () => {
  it('draws the same strokes on every call', () => {
    expect(cornerFringePath('left')).toBe(cornerFringePath('left'))
  })

  it('stays inside its box (a stroke may lean by under a pixel)', () => {
    for (const side of ['left', 'right'] as const) {
      for (const [x, y] of points(cornerFringePath(side))) {
        expect(x).toBeGreaterThanOrEqual(-2)
        expect(x).toBeLessThanOrEqual(FRINGE_WIDTH + 2)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(FRINGE_HEIGHT)
      }
    }
  })

  it('hangs longest strokes at the corner: left fringe is deeper on its left half', () => {
    const deepest = (pts: [number, number][], from: number, to: number) =>
      Math.max(...pts.filter(([x]) => x >= from && x < to).map(([, y]) => y))
    const left = points(cornerFringePath('left'))
    expect(deepest(left, 0, FRINGE_WIDTH / 2)).toBeGreaterThan(deepest(left, FRINGE_WIDTH / 2, FRINGE_WIDTH + 2))
    const right = points(cornerFringePath('right'))
    expect(deepest(right, FRINGE_WIDTH / 2, FRINGE_WIDTH + 2)).toBeGreaterThan(deepest(right, -2, FRINGE_WIDTH / 2))
  })
})

describe('starPath', () => {
  it('has two corners per point, alternating outer and inner radius', () => {
    const five = points(starPath(10, 10, 10, 5))
    expect(five).toHaveLength(10)
    expect(five[0]).toEqual([10, 0]) // first point straight up
    expect(points(starPath(10, 10, 10, 4))).toHaveLength(8)
  })
})
