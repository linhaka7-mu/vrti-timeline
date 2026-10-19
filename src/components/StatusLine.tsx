import type { YearRange } from '../lib/range'

interface StatusLineProps {
  range: YearRange
  count: number | undefined
  unreadable: number
  loading: boolean
  error: Error | null
  onRetry: () => void
}

/**
 * One line above the timeline that says what is, and what is not, on it.
 * Principle (handbook §4.1): when people drop out of view, the interface says how many and why.
 */
export function StatusLine({ range, count, unreadable, loading, error, onRetry }: StatusLineProps) {
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
            <strong>Showing {count.toLocaleString('en-IE')} people</strong>
            <span className="text-umber">
              {' '}
              with both a birth and a death record, alive at some point in {range.from}–{range.to}.
            </span>
            {loading && <span className="text-umber"> Updating…</span>}
          </>
        )}
      </p>
      <p className="m-0 text-[14px] text-umber">
        Not shown yet: people known only from archival records or from estimated dates, and people with no
        dates at all.
        {unreadable > 0 && ` ${unreadable} records were skipped because a stored date could not be read.`}
      </p>
    </div>
  )
}
