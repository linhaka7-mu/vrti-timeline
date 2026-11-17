import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DECADE, fetchDecadeCounts, sqrtShare } from '../lib/density'
import { DOMAIN_END, DOMAIN_START, type YearRange } from '../lib/range'

const W = 1000 // viewBox width; the chart stretches to the slider's width
const H = 40 // px, also the viewBox height, so lines are never squashed

/** Same scale as the slider (RangeControl's along()), in viewBox units. */
const x = (year: number) => ((year - DOMAIN_START) / (DOMAIN_END - DOMAIN_START)) * W

/**
 * Engraved bars above the era buttons: one stack of horizontal lines per decade, as high as the number
 * of people who may have been alive then (square-root scale). Decades inside the chosen range are
 * dark, the rest faint. Horizontal lines, never diagonal: diagonal hatching means "estimated dates".
 * Loaded once for the whole knowledge graph and kept; while loading or if it fails, the space stays
 * empty and the slider works as before.
 * Hovering a column shows a one-line tip in the same style as the person card (bottle-green label,
 * paper body, grain). The tip also says the heights use a square-root scale, so the page needs no
 * separate note (Siyan, 2026-11-14). The scale goes into the legend once there is one.
 */
export function DensityChart({ range }: { range: YearRange }) {
  const { data } = useQuery({
    queryKey: ['decade-counts'],
    queryFn: ({ signal }) => fetchDecadeCounts(signal),
    staleTime: Infinity,
    retry: 1,
  })
  const max = data ? Math.max(0, ...data.map((d) => d.count)) : 0
  const [hovered, setHovered] = useState<{ start: number; count: number } | null>(null)

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="How many people may have been alive in each decade (square-root scale)"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          {/* One engraved line every 3px. */}
          <pattern id="density-lines" width="4" height="3" patternUnits="userSpaceOnUse" y={H % 3}>
            <rect y="1.8" width="4" height="1.2" fill="var(--color-olive)" />
          </pattern>
        </defs>
        {data?.map((decade) => {
          const height = sqrtShare(decade.count, max) * (H - 1)
          const end = Math.min(decade.start + DECADE, DOMAIN_END + 1)
          const inRange = decade.start <= range.to && decade.start + DECADE - 1 >= range.from
          return (
            <g key={decade.start}>
              <rect
                x={x(decade.start) + 0.6}
                y={H - height}
                width={Math.max(0, x(end) - x(decade.start) - 1.2)}
                height={height}
                fill="url(#density-lines)"
                // As a style, not an attribute, so the change can fade: the chosen decades light up in 0.2s
                // as the slider moves or an era is clicked (Siyan, 2026-11-17).
                className="transition-opacity duration-200 ease-out motion-reduce:transition-none"
                style={{ opacity: inRange ? 0.95 : 0.35 }}
              />
              {/* The whole column answers on hover, not just the lines. */}
              <rect
                x={x(decade.start)}
                y={0}
                width={x(end) - x(decade.start)}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHovered(decade)}
              />
            </g>
          )
        })}
      </svg>
      {hovered && <DecadeTip start={hovered.start} count={hovered.count} />}
    </>
  )
}

/**
 * The hover tip: one small line above the column. Centred on the decade, except near the ends,
 * where it lines up with the column's edge so it never runs off the page.
 */
function DecadeTip({ start, count }: { start: number; count: number }) {
  const centre = ((start + DECADE / 2 - DOMAIN_START) / (DOMAIN_END - DOMAIN_START)) * 100 // %
  // Tailwind's translate classes set the CSS `translate` property, so the card-in fade (which
  // animates `transform`) does not knock the tip sideways while it plays.
  const shift = centre < 15 ? 'translate-x-0' : centre > 85 ? '-translate-x-full' : '-translate-x-1/2'
  return (
    <div
      aria-hidden="true"
      className={`card-in grain-over pointer-events-none absolute bottom-full z-40 mb-1.5 flex overflow-hidden rounded border border-copper bg-[#fffdf7] text-[13px] whitespace-nowrap text-ink shadow-[0_6px_16px_rgba(46,74,51,0.2)] ${shift}`}
      style={{ left: `${centre}%` }}
    >
      <span className="bg-bottle px-2 py-1 font-display font-semibold text-white">{start}s</span>
      <span className="px-2 py-1">
        <b>{count.toLocaleString('en-IE')}</b> people may have been alive
        <span className="text-umber"> · heights on a square-root scale</span>
      </span>
    </div>
  )
}
