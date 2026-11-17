import { useState } from 'react'
import {
  directionLabel,
  SORT_KEYS,
  SORT_LABELS,
  type GenderFilter,
  type ListView,
  type SourceFilter,
  type SortDirection,
  type SortKey,
} from '../lib/listView'
import { SOURCES } from '../lib/sources'
import { markEntrySide } from '../lib/hover'
import { HoverSweep } from './HoverSweep'
import { Select, type SelectOption } from './Select'

interface ListControlsProps {
  view: ListView
  onChange: (view: ListView) => void
  /** People in the range for each gender who match the name search and the source. */
  counts: Record<GenderFilter, number>
  /** People in the range in each source who match the name search and the gender. */
  sourceCounts: Record<SourceFilter, number>
}

const GENDER_OPTIONS: { value: GenderFilter; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'female', label: 'Women' },
  { value: 'male', label: 'Men' },
]

// White with a brown edge, like every control in this row; bottle green only marks what is switched on
// (sketch page 设计备份/控件配色方案 2026-11-17.html, option 1).
const fieldBox = 'h-9 rounded border border-umber/45 bg-white px-2 text-base text-ink focus:border-bottle'

/**
 * The row between the range controls and the timeline: name search, data source, gender filter and
 * "Mark gender". The sort boxes are in the status line below (SortControls). All of these work on
 * people already loaded, so they respond at once.
 */
export function ListControls({ view, onChange, counts, sourceCounts }: ListControlsProps) {
  const set = (change: Partial<ListView>) => onChange({ ...view, ...change })
  const n = (value: number) => value.toLocaleString('en-IE')
  // A source with nobody here is still listed, greyed out with "(0)", so readers can see it exists
  // (Siyan, 2026-11-17). The 1641 Depositions are the main case: their people have only event dates,
  // which the timeline does not draw yet. The one chosen stays choosable even at 0, so it can be read.
  const sourceOptions: SelectOption<SourceFilter>[] = [
    { value: 'all', label: `All sources (${n(sourceCounts.all)})`, short: 'All sources' },
    ...SOURCES.map((source) => {
      const count = sourceCounts[source.id]
      return {
        value: source.id,
        label: `${source.name} (${n(count)})`,
        short: source.short,
        disabled: count === 0 && view.source !== source.id,
      }
    }),
  ]

  return (
    <section aria-label="Find and order people" className="flex flex-wrap items-center gap-x-6 gap-y-3 text-base">
      <NameSearch value={view.query} onSearch={(query) => set({ query })} />

      {/* No visible "Source": "All sources" and the source names say what the box is (Siyan, 2026-11-17).
          Screen readers still hear "Source". */}
      <Select ariaLabel="Source" value={view.source} options={sourceOptions} onChange={(source: SourceFilter) => set({ source })} />

      {/* A group of radio buttons drawn as joined buttons: arrow keys move between them, as in any radio group. */}
      <fieldset className="m-0 flex items-center gap-2 border-0 p-0">
        {/* No visible "Show": the three buttons speak for themselves (Siyan, 2026-11-17). Screen readers still hear it. */}
        <legend className="sr-only">Show</legend>
        <div className="flex overflow-hidden rounded border border-umber/45">
          {GENDER_OPTIONS.map(({ value, label }) => {
            const selected = view.gender === value
            return (
              <label
                key={value}
                onMouseEnter={markEntrySide}
                className={`group relative flex h-9 cursor-pointer items-center gap-1.5 overflow-hidden border-r select-none border-umber/45 px-3 last:border-r-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-record ${
                  selected ? 'bg-bottle text-white' : 'bg-white text-ink'
                }`}
              >
                {/* Selecting switches the colour at once, with no fade: the hover fill disappears the moment the
                    button is chosen, and a fade from white to green showed a white flash in between, several
                    times when clicking back and forth (Siyan, 2026-11-17). */}
                <HoverSweep off={selected} />
                <input
                  type="radio"
                  name="gender"
                  value={value}
                  checked={selected}
                  onChange={() => set({ gender: value })}
                  className="sr-only"
                />
                <span className="relative font-bold">{label}</span>
                {/* The count always takes the room of "00,000" (the whole graph has fewer than 17,000 people),
                    so the buttons keep one width whatever the range and the search. Figures are equal-width. */}
                <span className={`relative grid text-sm ${selected ? 'text-paper/80' : 'text-umber'}`}>
                  <span aria-hidden="true" className="invisible col-start-1 row-start-1">
                    00,000
                  </span>
                  <span className="col-start-1 row-start-1">{counts[value].toLocaleString('en-IE')}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* "Mark gender": on by default (supervisor, 2026-11-02), so women stand out at a glance; click to use one colour.
          Drawn as a button like the gender buttons next to it, bottle green when on and white when off, so the
          row lines up (Siyan, 2026-11-17; it was a switch). Still a checkbox underneath, so it is read out as on / off. */}
      <label
        onMouseEnter={markEntrySide}
        className={`group relative flex h-9 cursor-pointer items-center overflow-hidden rounded border px-3 font-bold select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-record ${
          view.markGender ? 'border-bottle bg-bottle text-white' : 'border-umber/45 bg-white text-ink'
        }`}
      >
        <HoverSweep off={view.markGender} />
        <input
          type="checkbox"
          checked={view.markGender}
          onChange={(event) => set({ markGender: event.target.checked })}
          className="sr-only"
        />
        <span className="relative">Mark gender</span>
      </label>
    </section>
  )
}

/**
 * The two sort boxes: key, then direction. They end the status sentence ("…sorted by [▾] [▾]").
 * The visible words "sorted by" in that sentence name the first box; the second has its own name.
 */
export function SortControls({ view, onChange }: { view: ListView; onChange: (view: ListView) => void }) {
  const set = (change: Partial<ListView>) => onChange({ ...view, ...change })
  return (
    <span className="flex items-center gap-2">
      <Select
        ariaLabel="Sort by"
        value={view.sort}
        options={SORT_KEYS.map((key) => ({ value: key, label: SORT_LABELS[key] }))}
        onChange={(sort: SortKey) => set({ sort })}
      />
      {/* The direction is named for the key ("A to Z", "oldest first"), never just "ascending". */}
      <Select
        ariaLabel="Order"
        value={view.direction}
        options={(['asc', 'desc'] as const).map((direction) => ({
          value: direction,
          label: directionLabel(view.sort, direction),
        }))}
        onChange={(direction: SortDirection) => set({ direction })}
        // Wide enough for the longest wording of any sort key, so nothing after it shifts.
        sizeFor={SORT_KEYS.flatMap((key) => [directionLabel(key, 'asc'), directionLabel(key, 'desc')])}
      />
    </span>
  )
}

/**
 * Name search. Filters as you type, because the timeline hides rows that are scrolled out of view
 * and the browser's own Find (Cmd+F) cannot reach them (handbook §13.7).
 *
 * With a Chinese or Japanese input method, the box holds unfinished letters while a word is being
 * composed; the search waits for the finished word instead of filtering on those letters.
 */
function NameSearch({ value, onSearch }: { value: string; onSearch: (query: string) => void }) {
  const [text, setText] = useState(value)
  // When the search is changed from outside (for example the "Clear search" link), show that.
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setText(value)
  }

  return (
    // No label beside the box: the hint inside says what it is, and the magnifying glass keeps it
    // recognisable as a search box once the hint is gone (Siyan, 2026-11-17). Screen readers hear "Find a name".
    <label className="relative flex items-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute left-3 h-4 w-4 text-umber"
      >
        <circle cx="6.75" cy="6.75" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10.3 10.3 14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        aria-label="Find a name"
        value={text}
        placeholder="Find a name, e.g. Fitzgerald"
        onChange={(event) => {
          setText(event.target.value)
          if (!(event.nativeEvent as InputEvent).isComposing) onSearch(event.target.value)
        }}
        onCompositionEnd={(event) => onSearch(event.currentTarget.value)}
        className={`${fieldBox} w-64 pr-3 pl-9`}
      />
    </label>
  )
}
