import { useEffect, useMemo, useState } from 'react'
import { Legend } from './components/Legend'
import { ListControls } from './components/ListControls'
import { CornerFringe, StarDivider } from './components/Ornaments'
import { RangeControl } from './components/RangeControl'
import { StatusLine } from './components/StatusLine'
import { Timeline, TimelineSkeleton } from './components/Timeline'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { usePeopleAlive } from './hooks/usePeopleAlive'
import {
  applyListView,
  countByGender,
  DEFAULT_VIEW,
  describeOrder,
  listViewFromSearch,
  matchesName,
  viewToSearch,
  type ListView,
} from './lib/listView'
import { rangeFromSearch } from './lib/range'

/** Page shell: the framed "archive card" from the style tile, with the controls and the timeline inside. */
function App() {
  // What the controls show: changes on every slider movement. Starts from the address, so shared links work.
  const [range, setRange] = useState(() => rangeFromSearch(window.location.search))
  // What is actually asked of the endpoint: the same range, once it has stopped changing for 300 ms.
  const settledRange = useDebouncedValue(range, 300)
  const { data, error, isFetching, refetch } = usePeopleAlive(settledRange)
  // A range is being loaded: the slider has moved and not settled yet, or the endpoint has not answered.
  const loading = isFetching || range !== settledRange
  // Sort, gender filter and name search. These work on the people already loaded, with no new query.
  const [view, setView] = useState<ListView>(() => listViewFromSearch(window.location.search))

  const everyone = data?.people
  // The counts on the Everyone / Women / Men buttons follow the name search, so they always say
  // how many people each button would show.
  const counts = useMemo(
    () => countByGender((everyone ?? []).filter((person) => matchesName(person, view.query))),
    [everyone, view.query],
  )
  const shown = useMemo(() => (everyone ? applyListView(everyone, view) : undefined), [everyone, view])
  const filters = [
    view.gender === 'female' ? 'women only' : view.gender === 'male' ? 'men only' : null,
    view.query.trim() ? `names matching “${view.query.trim()}”` : null,
  ].filter((text): text is string => text !== null)

  // Keep the address in step with the view, so it can be bookmarked or sent to a colleague.
  // replaceState: dragging the slider should not fill the Back button's history.
  useEffect(() => {
    window.history.replaceState(null, '', viewToSearch(settledRange, view))
  }, [settledRange, view])

  // No background colour on the outer box: the green and its grain come from <html> (index.css).
  return (
    <div className="min-h-screen p-4 sm:p-7">
      {/* The top padding is deeper than the bottom, to leave room for the corner fringes. */}
      <div className="paper relative mx-auto flex max-w-[1384px] flex-col gap-7 rounded-md border-2 border-copper px-5 pt-12 pb-8 outline outline-1 -outline-offset-[12px] outline-dashed outline-copper sm:px-13 sm:pt-[60px] sm:pb-11">
        <CornerFringe side="left" />
        <CornerFringe side="right" />
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-copper pb-4">
          <div className="flex flex-col gap-1">
            <p className="m-0 font-type text-[13px] uppercase tracking-[0.14em] text-umber">
              Virtual Record Treasury of Ireland · Knowledge Graph
            </p>
            <h1 className="m-0 text-4xl leading-tight font-bold text-bottle sm:text-[46px]">
              People in Time
            </h1>
          </div>
          <div className="flex items-center gap-4 text-[15px]">
            <span className="rounded-sm border border-umber px-2 py-0.5 font-type text-xs uppercase tracking-[0.08em] text-umber">
              Prototype
            </span>
            <a href="https://kg.virtualtreasury.ie/" className="font-medium whitespace-nowrap">
              Open the Knowledge Graph ↗
            </a>
          </div>
        </header>

        <main className="flex flex-col gap-6">
          <RangeControl range={range} onChange={setRange} />
          <StarDivider />
          <div className="flex flex-col gap-4">
            <ListControls view={view} onChange={setView} counts={counts} />
            <StatusLine
              range={data?.range ?? settledRange}
              count={everyone?.length}
              shown={shown?.length}
              filters={filters}
              order={describeOrder(view)}
              onClearFilters={() => setView({ ...view, gender: DEFAULT_VIEW.gender, query: DEFAULT_VIEW.query })}
              unreadable={data?.unreadable ?? 0}
              loading={loading}
              error={error}
              onRetry={() => void refetch()}
            />
            {/* The key comes before the timeline, so readers know what the marks mean before they start reading. */}
            <Legend markGender={view.markGender} />
            {/* First load: placeholder rows instead of an empty page. */}
            {!data && !error && <TimelineSkeleton range={settledRange} />}
            {data && shown && shown.length > 0 && (
              // A new order or filter starts the list from the top again (the key makes a fresh timeline).
              <Timeline
                key={`${view.sort}|${view.direction}|${view.gender}|${view.query}`}
                people={shown}
                range={data.range}
                markGender={view.markGender}
                updating={loading}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
