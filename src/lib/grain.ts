import { seededRandom } from './ornaments'

/*
 * Paper grain (2026-11-14): salt-and-pepper dots, the way Siyan's colour-swatch library does it.
 * Every pixel is either black or white, with a random opacity. Compared with the earlier SVG noise
 * (a soft grey haze), the dots are crisp, like film grain or old print.
 * Siyan chose the values in 设计备份/噪点对比示例 2026-11-14.html: at most about 11% opacity,
 * 28% of the dots black, and dots half a CSS pixel wide (a 320px tile shown at 160px).
 */
export const GRAIN = {
  /** Tile size in image pixels. */
  size: 320,
  /** Tile size on the page, in CSS pixels. Half of `size`, so each dot is 0.5px. */
  shownAt: 160,
  /** Highest opacity of a dot, out of 255 (28 ≈ 11%). */
  maxAlpha: 28,
  /** Share of dots that are black; the rest are white. */
  blackShare: 0.28,
  /** Fixed seed: the same grain on every load. */
  seed: 2026,
} as const

/** RGBA pixels for one tile: each pixel black or white, opacity between 0 and maxAlpha. */
export function grainPixels(size: number, maxAlpha: number, blackShare: number, seed: number): Uint8ClampedArray {
  const random = seededRandom(seed)
  const data = new Uint8ClampedArray(size * size * 4)
  for (let i = 0; i < data.length; i += 4) {
    const value = random() < blackShare ? 0 : 255
    data[i] = data[i + 1] = data[i + 2] = value
    data[i + 3] = Math.floor(random() * maxAlpha)
  }
  return data
}

/**
 * Draws the tile once and hands it to the CSS as --grain (index.css).
 * If the browser cannot draw it, --grain stays `none` and the page simply has no grain.
 */
export function installGrain(root: HTMLElement = document.documentElement): void {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = GRAIN.size
    const context = canvas.getContext('2d')
    if (!context) return
    const pixels = grainPixels(GRAIN.size, GRAIN.maxAlpha, GRAIN.blackShare, GRAIN.seed)
    context.putImageData(new ImageData(pixels, GRAIN.size, GRAIN.size), 0, 0)
    root.style.setProperty('--grain', `url(${canvas.toDataURL()})`)
  } catch {
    // No grain is fine: it is decoration only.
  }
}
