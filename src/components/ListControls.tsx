import { useState } from 'react'
import {
  directionLabel,
  SORT_KEYS,
  SORT_LABELS,
  type GenderFilter,
  type ListView,
  type SortDirection,
  type SortKey,
} from '../lib/listView'
import { Select } from './Select'

interface ListControlsProps {
  view: ListView
  onChange: (view: ListView) => void
  /** People in the range for each gender who match the name search. */
  counts: Record<GenderFilter, number>
}

const GENDER_OPTIONS: { value: GenderFilter; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'female', label: 'Women' },
  { value: 'male', label: 'Men' },
]

const fieldLabel = 'flex items-center gap-2 text-umber'
const fieldBox = 'h-10 rounded border-[1.5px] border-umber bg-white px-2 text-base text-ink'

/**
 * The row between the range controls and the timeline: name search, sort order, gender filter.
 * All three work on people already loaded, so they respond at once.
 */
export function ListControls({ view, onChange, counts }: ListControlsProps) {
  const set = (change: Partial<ListView>) => onChange({ ...view, ...change })

  return (
    <section aria-label="Find and order people" className="flex flex-wrap items-center gap-x-6 gap-y-3 text-base">
      <NameSearch value={view.query} onSearch={(query) => set({ query })} />

      <div className="flex items-center gap-2">
        <span id="sort-label" className="text-umber">
          Sort by
        </span>
        <Select
          labelledBy="sort-label"
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
          // Wide enough for the longest wording of any sort key, so "Show" never shifts.
          sizeFor={SORT_KEYS.flatMap((key) => [directionLabel(key, 'asc'), directionLabel(key, 'desc')])}
        />
      </div>

      {/* A group of radio buttons drawn as joined buttons: arrow keys move between them, as in any radio group. */}
      <fieldset className="m-0 flex items-center gap-2 border-0 p-0">
        <legend className="float-left mr-2 p-0 text-umber">Show</legend>
        <div className="flex overflow-hidden rounded-sm border border-straw-edge">
          {GENDER_OPTIONS.map(({ value, label }) => {
            const selected = view.gender === value
            return (
              <label
                key={value}
                className={`flex h-10 cursor-pointer items-center gap-1.5 border-r border-straw-edge px-3 last:border-r-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-record ${
                  selected ? 'bg-bottle text-paper' : 'bg-straw/60 text-ink hover:bg-straw'
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={value}
                  checked={selected}
                  onChange={() => set({ gender: value })}
                  className="sr-only"
                />
                <span className="font-bold">{label}</span>
                {/* The count always takes the room of "00,000" (the whole graph has fewer than 17,000 people),
                    so the buttons keep one width whatever the range and the search. Figures are equal-width. */}
                <span className={`grid text-sm ${selected ? 'text-paper/80' : 'text-umber'}`}>
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

      {/* "Mark gender": off by default, so the everyday view keeps one colour for people.
          The outline is drawn inside the track (an inset ring, not a border), so it takes no space. */}
      <label className="flex cursor-pointer items-center gap-2.5 text-umber">
        <input
          type="checkbox"
          role="switch"
          checked={view.markGender}
          onChange={(event) => set({ markGender: event.target.checked })}
          className="peer sr-only"
        />
        {/* The knob is a real element laid out by flexbox: 3px padding all round and centred
            vertically, so the gap is the same on every side in every browser. On = knob at the end. */}
        <span
          aria-hidden="true"
          className="flex h-6 w-11 shrink-0 items-center justify-start rounded-full bg-white p-[3px] ring-[1.5px] ring-umber ring-inset transition-colors peer-checked:justify-end peer-checked:bg-bottle peer-checked:ring-bottle peer-checked:*:bg-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-record"
        >
          <span className="h-[18px] w-[18px] shrink-0 rounded-full bg-umber" />
        </span>
        Mark gender
      </label>
    </section>
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
    <label className={fieldLabel}>
      Find a name
      <input
        type="search"
        value={text}
        placeholder="e.g. Fitzgerald"
        onChange={(event) => {
          setText(event.target.value)
          if (!(event.nativeEvent as InputEvent).isComposing) onSearch(event.target.value)
        }}
        onCompositionEnd={(event) => onSearch(event.currentTarget.value)}
        className={`${fieldBox} w-56 px-3`}
      />
    </label>
  )
}
