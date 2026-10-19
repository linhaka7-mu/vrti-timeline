import { useState } from 'react'
import { DOMAIN_END, DOMAIN_START, ERAS, parseYearText, rangeLength, type YearRange } from '../lib/range'

interface RangeControlProps {
  range: YearRange
  onChange: (range: YearRange) => void
}

/** Position of a year along the slider, 0–100 %. */
function along(year: number): number {
  return ((year - DOMAIN_START) / (DOMAIN_END - DOMAIN_START)) * 100
}

/**
 * Choosing a time range (handbook §4.7): three handles on ONE range, not three separate searches.
 * Dragging the slider changes the year boxes; typing a year moves the slider; clicking an era moves both.
 * That is why they sit together as one control.
 */
export function RangeControl({ range, onChange }: RangeControlProps) {
  const setFrom = (from: number) => onChange({ from: Math.min(from, range.to), to: range.to })
  const setTo = (to: number) => onChange({ from: range.from, to: Math.max(to, range.from) })

  return (
    <section aria-label="Choose a time range" className="flex flex-col gap-2">
      {/* 1 · The slider. Two native range inputs share one track, so keyboards and screen readers work as usual. */}
      <div className="relative h-6">
        {/* The thumbs are 14px wide and their centres travel 7px in from each end, hence mx-[7px]. */}
        <div className="absolute inset-x-[7px] top-0 h-6">
          <div className="absolute inset-x-0 top-[9px] h-1.5 rounded-full bg-linen" />
          <div
            className="absolute top-[7px] h-2.5 rounded-sm bg-bottle"
            style={{ left: `${along(range.from)}%`, width: `${along(range.to) - along(range.from)}%` }}
          />
        </div>
        <input
          type="range"
          aria-label="Start year"
          min={DOMAIN_START}
          max={DOMAIN_END}
          value={range.from}
          onChange={(event) => setFrom(Number(event.target.value))}
          className="dual-range absolute inset-0"
          // When both handles reach the right-hand end, the start handle must be on top or it could never move back.
          style={{ zIndex: range.from > DOMAIN_END - 100 ? 3 : 2 }}
        />
        <input
          type="range"
          aria-label="End year"
          min={DOMAIN_START}
          max={DOMAIN_END}
          value={range.to}
          onChange={(event) => setTo(Number(event.target.value))}
          className="dual-range absolute inset-0"
        />
      </div>

      {/* 2 · The eras, drawn to scale under the slider: Medieval really is 1,100 years wide. */}
      <div className="relative mx-[7px] h-12">
        {ERAS.map((era) => {
          const selected = range.from === era.from && range.to === era.to
          return (
            <button
              key={era.name}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange({ from: era.from, to: era.to })}
              className={`absolute top-0 flex h-12 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-sm border px-1 ${
                selected ? 'border-bottle bg-bottle text-paper' : 'border-straw-edge bg-straw text-ink hover:bg-straw-edge'
              }`}
              style={{
                left: `calc(${along(era.from)}% + 2px)`,
                width: `calc(${along(era.to + 1) - along(era.from)}% - 4px)`,
              }}
            >
              <span className="text-[11px] font-bold whitespace-nowrap sm:text-sm">{era.name}</span>
              <span className="hidden text-xs whitespace-nowrap sm:block">{era.label}</span>
            </button>
          )
        })}
      </div>
      <div className="mx-[7px] flex justify-between text-[13px] text-umber" aria-hidden="true">
        <span>{DOMAIN_START}</span>
        <span>{DOMAIN_END}</span>
      </div>

      {/* 3 · Exact years. Needed, not just a convenience: on a ~1,100px slider one pixel is more than a year. */}
      <div className="mt-1 flex flex-wrap items-center gap-3 text-base">
        <YearInput key={`from-${range.from}`} label="From" value={range.from} onCommit={setFrom} />
        <YearInput key={`to-${range.to}`} label="to" value={range.to} onCommit={setTo} />
        <span className="text-sm text-umber">{rangeLength(range).toLocaleString('en-IE')} years</span>
      </div>
    </section>
  )
}

interface YearInputProps {
  label: string
  value: number
  onCommit: (year: number) => void
}

/**
 * A year box. It only applies what was typed on Enter or when leaving the box, so typing "1" on the
 * way to "1641" does not send the timeline to the year 400. The parent remounts it (key) whenever
 * the year changes from elsewhere, which refreshes the text.
 */
function YearInput({ label, value, onCommit }: YearInputProps) {
  const [text, setText] = useState(String(value))
  const commit = () => {
    const year = parseYearText(text)
    if (year === null) {
      setText(String(value)) // not a year: go back to what it was
      return
    }
    setText(String(year)) // may have been pulled into the slider's limits
    if (year !== value) onCommit(year)
  }
  return (
    <label className="flex items-center gap-3 text-umber">
      {label}
      <input
        inputMode="numeric"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          // With a Chinese or Japanese input method, Enter first confirms the typed letters.
          // That Enter must not apply the year yet, or the letters land in the box afterwards.
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) commit()
        }}
        className="h-11 w-24 rounded border-[1.5px] border-umber bg-white px-3 text-[17px] text-ink"
      />
    </label>
  )
}
