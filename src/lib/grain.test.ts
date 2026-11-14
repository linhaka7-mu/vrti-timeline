import { describe, expect, it } from 'vitest'
import { GRAIN, grainPixels } from './grain'

describe('grainPixels', () => {
  const pixels = grainPixels(GRAIN.size, GRAIN.maxAlpha, GRAIN.blackShare, GRAIN.seed)

  it('has four values (RGBA) for every pixel of the tile', () => {
    expect(pixels.length).toBe(GRAIN.size * GRAIN.size * 4)
  })

  it('makes every dot pure black or pure white, never more opaque than maxAlpha', () => {
    for (let i = 0; i < pixels.length; i += 4) {
      expect([0, 255]).toContain(pixels[i])
      expect(pixels[i + 1]).toBe(pixels[i])
      expect(pixels[i + 2]).toBe(pixels[i])
      expect(pixels[i + 3]).toBeLessThan(GRAIN.maxAlpha)
    }
  })

  it('makes about 28% of the dots black', () => {
    let black = 0
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] === 0) black++
    expect(black / (GRAIN.size * GRAIN.size)).toBeCloseTo(GRAIN.blackShare, 1)
  })

  it('draws the same grain every time (fixed seed)', () => {
    expect(grainPixels(8, 28, 0.28, 2026)).toEqual(grainPixels(8, 28, 0.28, 2026))
  })
})
