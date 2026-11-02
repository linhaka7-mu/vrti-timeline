import { cornerFringePath, FRINGE_HEIGHT, FRINGE_WIDTH, starPath } from '../lib/ornaments'

// Paths are worked out once, when the module loads: they never change.
const FRINGE = { left: cornerFringePath('left'), right: cornerFringePath('right') }

/**
 * Engraved strokes hanging from a top corner of the card, just inside the dashed line.
 * On a narrow screen the box shrinks and the inner (shortest) strokes are cut off, never the corner.
 * Decoration only: hidden from screen readers and from the mouse.
 */
export function CornerFringe({ side }: { side: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute top-[14px] w-[38%] max-w-[260px] text-copper ${
        side === 'left' ? 'left-[14px]' : 'right-[14px]'
      }`}
      height={FRINGE_HEIGHT}
      viewBox={`0 0 ${FRINGE_WIDTH} ${FRINGE_HEIGHT}`}
      preserveAspectRatio={side === 'left' ? 'xMinYMin slice' : 'xMaxYMin slice'}
    >
      <path d={FRINGE[side]} fill="currentColor" />
    </svg>
  )
}

/** Section divider: a double copper rule with three small stars in the middle. */
export function StarDivider() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 text-copper">
      <span className="h-[5px] flex-1 border-y border-copper" />
      <span className="flex items-center gap-[9px]">
        {[9, 12, 9].map((size, i) => (
          <svg key={i} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <path d={starPath(size / 2, size / 2, size / 2)} fill="currentColor" />
          </svg>
        ))}
      </span>
      <span className="h-[5px] flex-1 border-y border-copper" />
    </div>
  )
}
