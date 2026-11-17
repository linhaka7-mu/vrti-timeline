import type { ReactNode } from 'react'
import type { YearRange } from '../lib/range'

interface StatusLineProps {
  range: YearRange
  /** Everyone in the range. */
  count: number | undefined
  /** How many are left after the gender filter and name search. */
  shown: number | undefined
  /** The two year boxes, in the middle of the sentence: "…alive in [1500] – [1749], sorted by…". */
  yearControls: ReactNode
  /** The two sort boxes, placed at the end of the sentence: "…sorted by [▾] [▾]". */
  sortControls: ReactNode
  unreadable: number
  loading: boolean
  error: Error | null
  onRetry: () => void
}

/**
 * One line above the timeline that says what is, and what is not, on it.
 * Principle (handbook §4.1): when people drop out of view, the interface says how many and why.
 */
export function StatusLine({
  range,
  count,
  shown,
  yearControls,
  sortControls,
  unreadable,
  loading,
  error,
  onRetry,
}: StatusLineProps) {
  if (error) {
    return (
      <p role="alert" className="m-0 text-base">
        <strong>{error.message}</strong>{' '}
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer border-0 bg-transparent p-0 text-bottle underline"
        >
          Try again
        </button>
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 text-base">
      {/* The sentence ends in the sort boxes, so the order is read as part of what is shown (layout
          sketch 设计备份/控件布局方案 2026-11-17.html, option B with the boxes kept, Siyan's choice).
          Only the words are a live region: changing a box should not be read out as the whole line. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <span aria-live="polite">
          {count === undefined ? (
            <strong className="text-umber">Loading people</strong>
          ) : (
            // Only the number shown, never "106 of 2,487": the filter buttons already carry the counts, and
            // the sentence keeps one length whatever is chosen, so the boxes after it do not jump (Siyan, 2026-11-17).
            // The number sits in a slot as wide as "0,000" (equal-width figures), centred, so 106 and
            // 2,487 take the same room. A larger number (the whole graph has about 10,600) simply widens the
            // slot: it is never cut off (Siyan, 2026-11-17).
            <strong>
              Showing{' '}
              <span className="inline-grid justify-items-center tabular-nums">
                <span aria-hidden="true" className="invisible col-start-1 row-start-1">
                  0,000
                </span>
                <span className="col-start-1 row-start-1">{(shown ?? count).toLocaleString('en-IE')}</span>
              </span>{' '}
              people
            </strong>
          )}
          {/* The years are said for screen readers here; on screen they are the boxes that follow. */}
          <span className="sr-only">
            {' '}
            alive in {range.from}–{range.to}
          </span>
          <span aria-hidden="true" className="text-umber">
            {' '}
            with birth and death dates, alive in
          </span>
        </span>
        {/* The comma sits right after the second box, with a small 4px gap (the row's wider gap looked like a space before it). */}
        <span className="flex items-center">
          {yearControls}
          <span className="ml-1 text-umber">,</span>
        </span>
        <span className="text-umber">sorted by</span>
        {sortControls}
        {loading && count !== undefined && <span className="text-umber">Updating…</span>}
      </div>
      {/* No separate "Filtered to … Show everyone" line: the filters are visible in the controls just
          above, with their counts (Siyan, 2026-11-17). */}
      <p className="m-0 text-[14px] text-umber">
        Not shown yet: people known only from archival records or estimated dates.
        {unreadable > 0 && ` ${unreadable} records were skipped because a stored date could not be read.`}
      </p>
    </div>
  )
}
