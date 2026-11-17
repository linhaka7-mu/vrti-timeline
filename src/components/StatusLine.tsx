import type { ReactNode } from 'react'
import type { YearRange } from '../lib/range'

interface StatusLineProps {
  range: YearRange
  /** Everyone in the range. */
  count: number | undefined
  /** How many are left after the gender filter and name search. */
  shown: number | undefined
  /** Whether any filter (gender, source, name search) is on: then the count reads "Showing 104 of 2,330". */
  filtered: boolean
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
  filtered,
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
            <strong>
              {filtered && shown !== undefined
                ? `Showing ${shown.toLocaleString('en-IE')} of ${count.toLocaleString('en-IE')} people`
                : `Showing ${count.toLocaleString('en-IE')} people`}
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
          above, and "Showing 104 of 2,330" already says that some are hidden (Siyan, 2026-11-17). */}
      <p className="m-0 text-[14px] text-umber">
        Not shown yet: people known only from archival records or estimated dates.
        {unreadable > 0 && ` ${unreadable} records were skipped because a stored date could not be read.`}
      </p>
    </div>
  )
}
