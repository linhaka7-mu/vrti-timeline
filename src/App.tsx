import { useEffect, useState } from 'react'
import { Legend } from './components/Legend'
import { RangeControl } from './components/RangeControl'
import { StatusLine } from './components/StatusLine'
import { Timeline } from './components/Timeline'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { usePeopleAlive } from './hooks/usePeopleAlive'
import { rangeFromSearch, rangeToSearch } from './lib/range'

/** Page shell: the framed "archive card" from the style tile, with the controls and the timeline inside. */
function App() {
  // What the controls show: changes on every slider movement. Starts from the address, so shared links work.
  const [range, setRange] = useState(() => rangeFromSearch(window.location.search))
  // What is actually asked of the endpoint: the same range, once it has stopped changing for 300 ms.
  const settledRange = useDebouncedValue(range, 300)
  const { data, error, isFetching, refetch } = usePeopleAlive(settledRange)

  // Keep the address in step with the view, so it can be bookmarked or sent to a colleague.
  // replaceState: dragging the slider should not fill the Back button's history.
  useEffect(() => {
    window.history.replaceState(null, '', rangeToSearch(settledRange))
  }, [settledRange])

  return (
    <div className="min-h-screen bg-bottle p-4 sm:p-7">
      <div className="mx-auto flex max-w-[1384px] flex-col gap-7 rounded-md border-2 border-copper bg-paper px-5 py-8 outline outline-1 -outline-offset-[12px] outline-dashed outline-copper sm:px-13 sm:py-11">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-copper pb-4">
          <div className="flex flex-col gap-1">
            <p className="m-0 text-[13px] uppercase tracking-[0.14em] text-umber">
              Virtual Record Treasury of Ireland · Knowledge Graph
            </p>
            <h1 className="m-0 font-display text-4xl leading-tight font-semibold text-bottle sm:text-[46px]">
              People in Time
            </h1>
          </div>
          <div className="flex items-center gap-4 text-[15px]">
            <span className="rounded-sm border border-umber px-2 py-0.5 text-xs uppercase tracking-[0.08em] text-umber">
              Prototype
            </span>
            <a href="https://kg.virtualtreasury.ie/" className="font-medium whitespace-nowrap">
              Open the Knowledge Graph ↗
            </a>
          </div>
        </header>

        <main className="flex flex-col gap-6">
          <RangeControl range={range} onChange={setRange} />
          <div className="flex flex-col gap-4 border-t border-copper pt-5">
            <StatusLine
              range={data?.range ?? settledRange}
              count={data?.people.length}
              unreadable={data?.unreadable ?? 0}
              loading={isFetching || range !== settledRange}
              error={error}
              onRetry={() => void refetch()}
            />
            {data && data.people.length > 0 && <Timeline people={data.people} range={data.range} />}
          </div>
          <Legend />
        </main>
      </div>
    </div>
  )
}

export default App
