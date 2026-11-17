import { useState } from 'react'
import { DOMAIN_END, DOMAIN_START, ERAS, parseYearText, type YearRange } from '../lib/range'
import { DensityChart } from './DensityChart'
import { markEntrySide } from '../lib/hover'
import { HoverSweep } from './HoverSweep'

interface RangeControlProps {
  range: YearRange
  onChange: (range: YearRange) => void
}

/**
 * The eras are a row of thin labels under the density chart, name over years ("Early Modern" /
 * "1500–1749"), the chosen one in bold bottle green (sketch page 设计备份/整体层次方案 2026-11-17.html,
 * idea 1, Siyan, 2026-11-17; they used to be tall straw buttons). Two short lines rather than one long
 * one, because Post-1922 is only ~6% of the width (~70px on a full screen): one line could not hold
 * "Post-1922 1923–". Each label still shows as much as fits its own width (container queries):
 * name + years → short name → abbreviation. Thresholds: estimated text widths in Alegreya Sans
 * (13px bold name) plus the 8px left padding, rounded up. Tailwind only sees class names written in full.
 */
const ERA_LABEL_FIT: Record<string, { full: string; short: string; tiny: string }> = {
  Medieval: { full: '@min-[64px]:flex', short: '', tiny: '@min-[64px]:hidden' },
  'Early Modern': { full: '@min-[92px]:flex', short: '@min-[70px]:flex @min-[92px]:hidden', tiny: '@min-[70px]:hidden' },
  Modern: { full: '@min-[64px]:flex', short: '', tiny: '@min-[64px]:hidden' },
  'Post-1922': { full: '@min-[66px]:flex', short: '', tiny: '@min-[66px]:hidden' },
}

/** Position of a year along the slider, 0–100 %. */
function along(year: number): number {
  return ((year - DOMAIN_START) / (DOMAIN_END - DOMAIN_START)) * 100
}

/**
 * Choosing a time range (handbook §4.7): three handles on ONE range, not three separate searches.
 * Dragging the slider changes the year boxes; typing a year moves the slider; clicking an era moves both.
 * Order: density chart, era buttons, then the slider. The year boxes are in the status sentence below
 * ("…alive in [1500] – [1749], sorted by…", see YearBoxes): there they also replace the years the
 * sentence used to repeat, and the row they had to themselves is gone (Siyan, 2026-11-17).
 */
export function RangeControl({ range, onChange }: RangeControlProps) {
  const setFrom = (from: number) => onChange({ from: Math.min(from, range.to), to: range.to })
  const setTo = (to: number) => onChange({ from: range.from, to: Math.max(to, range.from) })

  return (
    <section aria-label="Choose a time range" className="flex flex-col gap-1 pt-4">
      {/* pt-4 above: room for the density chart's hover tip, which opens above the chart and otherwise
          sat on the header's rule (Siyan, 2026-11-17). */}
      {/* 0 · How many people each decade holds, on the same scale as the eras and the slider,
          so people can see where the data is before they choose (sketch page 2026-11-14, option D).
          It sits above the era labels, which divide it into eras (Siyan, 2026-11-14 and 11-17). */}
      <div className="relative mx-[7px] h-10">
        <DensityChart range={range} />
      </div>
      {/* The slider sits right under the chart, on the line that divides the chart from the era labels,
          so each handle is under the columns it bounds (sketch page 设计备份/滑块方案 2026-11-17.html,
          option A, Siyan, 2026-11-17). The "400 · 2025" line under it is gone: the era labels say 400,
          and the right end is the present. Two native range inputs share one track, so keyboards and
          screen readers work as usual. */}
      <div className="relative h-[18px]">
        {/* The thumbs are 14px wide and their centres travel 7px in from each end, hence inset-x-[7px]. */}
        <div className="absolute inset-x-[7px] top-0 h-[18px]">
          <div className="absolute inset-x-0 top-[8.5px] h-px bg-straw-edge" />
          <div
            className="absolute top-[7px] h-1 rounded-sm bg-bottle"
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
      {/* 1 · The eras, as thin labels right under the chart they divide. Drawn to scale: Medieval really is
          1,100 years wide. Clicking one chooses the whole era. */}
      <div className="relative mx-[7px] h-10">
        {ERAS.map((era) => {
          const selected = range.from === era.from && range.to === era.to
          const fit = ERA_LABEL_FIT[era.name]
          const fullName = `${era.name}, ${era.from} to ${era.to}` // for hover and screen readers, whatever fits on screen
          const weight = selected ? 'font-bold' : ''
          return (
            <button
              key={era.name}
              type="button"
              aria-pressed={selected}
              aria-label={fullName}
              title={fullName}
              onClick={() => onChange({ from: era.from, to: era.to })}
              onMouseEnter={markEntrySide}
              className={`group @container absolute top-0 flex h-10 cursor-pointer items-center overflow-hidden bg-transparent pl-2 text-left whitespace-nowrap select-none ${
                era.from > DOMAIN_START ? 'border-l border-straw-edge' : ''
              } ${selected ? 'text-bottle' : 'text-umber hover:text-bottle'}`}
              style={{ left: `${along(era.from)}%`, width: `${along(era.to + 1) - along(era.from)}%` }}
            >
              {/* Hover: a straw fill sweeps across the whole label from the side the pointer entered, so the
                  eras read as things to click (sketch page 设计备份/时代标签可点提示 2026-11-17.html, option 2,
                  in straw rather than green-grey, with the sweep Siyan asked for). Still for reduced motion. */}
              <HoverSweep />
              <span aria-hidden="true" className={`relative hidden flex-col leading-tight ${fit.full}`}>
                <span className={`text-[13px] ${weight}`}>{era.name}</span>
                <span className={`text-[11.5px] ${selected ? 'text-bottle/75' : 'text-umber/75'}`}>{era.label}</span>
              </span>
              {fit.short && (
                <span aria-hidden="true" className={`relative hidden text-[13px] ${weight} ${fit.short}`}>
                  {era.short}
                </span>
              )}
              <span aria-hidden="true" className={`relative text-xs ${weight} ${fit.tiny}`}>
                {era.tiny}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

/**
 * The two year boxes, "[1500] – [1749]", placed in the status sentence. Exact years are needed, not just
 * a convenience: on a ~1,100px slider one pixel is more than a year.
 */
export function YearBoxes({ range, onChange }: RangeControlProps) {
  const setFrom = (from: number) => onChange({ from: Math.min(from, range.to), to: range.to })
  const setTo = (to: number) => onChange({ from: range.from, to: Math.max(to, range.from) })
  return (
    <span className="flex items-center gap-2">
      <YearInput key={`from-${range.from}`} label="From year" value={range.from} onCommit={setFrom} />
      <span className="text-umber">–</span>
      <YearInput key={`to-${range.to}`} label="To year" value={range.to} onCommit={setTo} />
    </span>
  )
}

interface YearInputProps {
  /** Read out by screen readers; the sentence around the boxes says the rest. */
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
    <input
        aria-label={label}
        inputMode="numeric"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          // With a Chinese or Japanese input method, Enter first confirms the typed letters.
          // That Enter must not apply the year yet, or the letters land in the box afterwards.
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) commit()
        }}
        className="h-9 w-20 rounded border border-umber/45 bg-white px-3 font-type text-base text-ink focus:border-bottle"
      />
  )
}
