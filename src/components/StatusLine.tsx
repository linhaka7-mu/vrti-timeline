import type { YearRange } from '../lib/range'

interface StatusLineProps {
  range: YearRange
  /** Everyone in the range. */
  count: number | undefined
  /** How many are left after the gender filter and name search. */
  shown: number | undefined
  /** What the filters are doing, in words ("women only", "names matching “fitz”"). Empty when none is on. */
  filters: string[]
  /** "Sorted by year of birth, earliest first" */
  order: string
  onClearFilters: () => void
  unreadable: number
  loading: boolean
  error: Error | null
  onRetry: () => void
}

/**
 * One line above the timeline that says what is, and what is not, on it.
 * Principle (handbook §4.1): when people drop out of view, the interface says how many and why.
 */
export function StatusLine({ range, count, shown, filters, order, onClearFilters, unreadable, loading, error, onRetry }: StatusLineProps) {
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
    <div aria-live="polite" className="flex flex-col gap-1 text-base">
      <p className="m-0">
        {count === undefined ? (
          <span className="text-umber">Loading people…</span>
        ) : (
          <>
            <strong>
              {filters.length > 0 && shown !== undefined
                ? `Showing ${shown.toLocaleString('en-IE')} of ${count.toLocaleString('en-IE')} people`
                : `Showing ${count.toLocaleString('en-IE')} people`}
            </strong>
            <span className="text-umber">
              {' '}
              with both a birth and a death record, alive at some point in {range.from}–{range.to}.
            </span>
            {loading && <span className="text-umber"> Updating…</span>}
          </>
        )}
      </p>
      {count !== undefined && (
        <p className="m-0 text-[15px]">
          {filters.length > 0 && (
            <>
              Filtered to {filters.join(', ')}.{' '}
              <button
                type="button"
                onClick={onClearFilters}
                className="cursor-pointer border-0 bg-transparent p-0 text-base text-bottle underline"
              >
                Show everyone
              </button>
              <span className="text-umber"> · </span>
            </>
          )}
          <span className="text-umber">{order}.</span>
        </p>
      )}
      <p className="m-0 text-[14px] text-umber">
        Not shown yet: people known only from archival records or from estimated dates, and people with no
        dates at all.
        {unreadable > 0 && ` ${unreadable} records were skipped because a stored date could not be read.`}
      </p>
    </div>
  )
}
