/*
 * Engraved ornaments for the page frame (components/Ornaments.tsx).
 * The strokes look hand-drawn, but a fixed seed makes them identical on every load and in every browser.
 * Ornaments live only on the frame: never on the timeline, the key or the era bands, where diagonal
 * hatching already means "estimated activity" (decided 2026-11-02).
 */

/** Small seeded random number generator (linear congruential). Returns numbers in [0, 1). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

const fixed = (n: number) => n.toFixed(2)

/** One engraved stroke hanging from (x, y): `width` wide at the top, curving to a point `length` below. */
export function taperedStroke(x: number, y: number, length: number, width: number, lean: number): string {
  const half = width / 2
  const tipX = x + lean
  const midY = y + length * 0.6
  return (
    `M${fixed(x - half)},${fixed(y)} L${fixed(x + half)},${fixed(y)} ` +
    `Q${fixed(x + width * 0.35 + lean / 2)},${fixed(midY)} ${fixed(tipX)},${fixed(y + length)} ` +
    `Q${fixed(x - width * 0.35 + lean / 2)},${fixed(midY)} ${fixed(x - half)},${fixed(y)} Z`
  )
}

export const FRINGE_WIDTH = 260
export const FRINGE_HEIGHT = 34

/**
 * Strokes hanging from the top of a corner: longest at the corner, shorter toward the middle.
 * `side` says which corner, so the right one is a mirror image (with its own seed, so not an exact copy).
 * Returns one SVG path for a FRINGE_WIDTH × FRINGE_HEIGHT box.
 */
export function cornerFringePath(side: 'left' | 'right', seed = side === 'left' ? 11 : 23): string {
  const random = seededRandom(seed)
  const parts: string[] = []
  for (let x = 6; x < FRINGE_WIDTH; x += 4.2 + random() * 2.2) {
    const nearCorner = 1 - x / FRINGE_WIDTH // 1 at the corner, 0 at the inner end
    const length = Math.min(
      FRINGE_HEIGHT,
      FRINGE_HEIGHT * (0.15 + 0.85 * nearCorner ** 2) * (0.6 + random() * 0.4) + (random() < 0.12 ? 8 : 0),
    )
    const width = 1.1 + random() * 0.9
    const lean = (random() - 0.5) * 1.2
    if (length < 4) continue
    parts.push(taperedStroke(side === 'left' ? x : FRINGE_WIDTH - x, 0, length, width, lean))
  }
  return parts.join(' ')
}

/** A star centred on (cx, cy) with outer radius r: five points, or four for a sparkle. */
export function starPath(cx: number, cy: number, r: number, points: 4 | 5 = 5): string {
  const inner = points === 4 ? r * 0.22 : r * 0.42
  const corners: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / points
    const radius = i % 2 === 0 ? r : inner
    corners.push(`${fixed(cx + radius * Math.cos(angle))},${fixed(cy + radius * Math.sin(angle))}`)
  }
  return `M${corners.join(' L')} Z`
}
