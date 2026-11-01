import { useState } from 'react'
import { ageAtDeath } from '../lib/dates'
import { lifeBarSegments, lifeYears, toPercent, type Segment } from '../lib/geometry'
import type { Gender, Person } from '../lib/people'
import { ERAS, eraBands, tickYears, type EraBand, type YearRange } from '../lib/range'
import { GenderBadge } from './GenderBadge'

const ROW_HEIGHT = 44 // px; every row is the same height, which makes the scrolling maths simple
const VIEW_HEIGHT = 600 // px; the timeline scrolls inside this box
const OVERSCAN = 8 // extra rows drawn above and below the visible ones, so fast scrolling stays smooth
const LABEL_WIDTH = 'w-32 sm:w-60' // the name column (narrower on phones)
// Empty space after the last year, on the axis and on every row, so that:
// - on a Mac, the scroll bar (which floats over the content instead of taking its own space)
//   sits in this gap rather than on top of the bars of people who died late;
// - the last year label ("1750") has room and is not cut in half.
const END_GAP = 'pr-5'

interface TimelineProps {
  people: Person[]
  range: YearRange
  /** "Mark gender" switch: pink bars for women and an F / M badge by every name. */
  markGender: boolean
  /** A new range is on its way. The people already drawn stay (no flashing), faded, with a moving strip. */
  updating?: boolean
}

/**
 * The timeline: a year axis and one row per person.
 *
 * A range can hold thousands of people (Modern, 1750–1922, is the largest), so the list is
 * "virtualised": only the rows inside the scroll box, plus a few either side, exist in the page.
 * The rest is an empty spacer of the right height, so the scroll bar still behaves normally.
 */
export function Timeline({ people, range, markGender, updating = false }: TimelineProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const ticks = tickYears(range)
  const bands = eraBands(range)

  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const last = Math.min(people.length, Math.ceil((scrollTop + VIEW_HEIGHT) / ROW_HEIGHT) + OVERSCAN)
  const visible = people.slice(first, last)

  return (
    <div className="flex flex-col">
      <Axis range={range} ticks={ticks} bands={bands} updating={updating} />

      <div
        className={`overflow-y-auto transition-opacity duration-200 [scrollbar-gutter:stable] ${updating ? 'opacity-55' : ''}`}
        style={{ height: Math.min(VIEW_HEIGHT, people.length * ROW_HEIGHT) }}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <ul className="relative m-0 list-none p-0" style={{ height: people.length * ROW_HEIGHT }}>
          {visible.map((person, i) => (
            <PersonRow
              key={person.uri}
              person={person}
              range={range}
              ticks={ticks}
              top={(first + i) * ROW_HEIGHT}
              striped={(first + i) % 2 === 1}
              markGender={markGender}
              bands={bands}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * The year axis: era bands and names, then the years.
 * scrollbar-gutter keeps it the same width as the rows below, which may show a scroll bar.
 */
function Axis({ range, ticks, bands, updating }: { range: YearRange; ticks: number[]; bands: EraBand[]; updating: boolean }) {
  return (
    <div className={`relative flex overflow-hidden border-b border-copper text-[13px] text-umber [scrollbar-gutter:stable] ${END_GAP}`}>
      <div className={`${LABEL_WIDTH} shrink-0`} />
      <div className="relative h-12 flex-1">
        <EraBands bands={bands} />
        {/* Era names above the years: each picks the longest label that fits its band
            (name → short → abbreviation → nothing), like the era buttons do. The full name is in the tooltip. */}
        {bands.map((band) => (
          <EraName key={band.name} band={band} />
        ))}
        {/* Years sit on a 60% white box, so a line passing behind (an era boundary) does not cut
            through the number. Half see-through, so it works on parchment and on the straw bands alike. */}
        {ticks.map((year) => (
          <span
            key={year}
            className="absolute bottom-1 -translate-x-1/2 rounded-[3px] bg-white/60 px-1 leading-tight"
            style={{ left: `${toPercent(year, range)}%` }}
          >
            {year}
          </span>
        ))}
      </div>
      {updating && <div aria-hidden="true" className="updating-strip" />}
    </div>
  )
}

const SKELETON_ROWS = 8

/**
 * Shown on the first load, before any people have arrived: the real axis for the chosen range and
 * grey placeholder rows, so the page does not sit empty. The words "Loading people…" are in the
 * status line above (read out by screen readers); this is only a picture, hidden from them.
 * The shimmer stops for people who ask their system for reduced motion (see .skeleton in index.css).
 */
export function TimelineSkeleton({ range }: { range: YearRange }) {
  const ticks = tickYears(range)
  const bands = eraBands(range)
  return (
    <div className="flex flex-col" aria-hidden="true">
      <Axis range={range} ticks={ticks} bands={bands} updating={false} />
      {Array.from({ length: SKELETON_ROWS }, (_, i) => (
        <div
          key={i}
          className={`flex ${END_GAP} ${i % 2 === 1 ? 'bg-linen/30' : ''}`}
          style={{ height: ROW_HEIGHT }}
        >
          <div className={`${LABEL_WIDTH} flex shrink-0 flex-col justify-center gap-1.5 pr-3 pl-1`}>
            <div className="skeleton h-3 rounded-sm" style={{ width: `${55 + ((i * 13) % 35)}%` }} />
            <div className="skeleton h-2 w-2/5 rounded-sm" />
          </div>
          <div className="relative flex-1 overflow-hidden">
            <EraBands bands={bands} />
            {/* Made-up positions, stepping down to the right like a real list sorted by birth. */}
            <div
              className="skeleton absolute top-1/2 h-2.5 -translate-y-1/2"
              style={{ left: `${4 + i * 10}%`, width: `${18 + ((i * 7) % 16)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

interface PersonRowProps {
  person: Person
  range: YearRange
  ticks: number[]
  top: number
  striped: boolean
  markGender: boolean
  bands: EraBand[]
}

function PersonRow({ person, range, ticks, top, striped, markGender, bands }: PersonRowProps) {
  // People without a recorded gender get no badge and keep the plain blue bar.
  const gender = markGender ? person.gender : undefined
  const { birth, death } = person
  const segments = lifeBarSegments(birth, death, range)
  const age = ageAtDeath(birth, death)
  const ageText = age.min === age.max ? `aged ${age.min}` : `aged ${age.min}–${age.max}`
  const deathBeforeBirth = person.issues.includes('death recorded before birth')
  // Full text for the tooltip, because a long line is cut off with "…" in the narrow name column.
  const meta = [lifeYears(birth, death), deathBeforeBirth ? null : ageText, ...person.issues].filter(Boolean).join(' · ')

  return (
    <li
      className={`absolute inset-x-0 flex ${END_GAP} ${striped ? 'bg-linen/30' : ''}`}
      style={{ top, height: ROW_HEIGHT }}
    >
      <div className={`${LABEL_WIDTH} flex shrink-0 flex-col justify-center overflow-hidden pr-3 pl-1`}>
        <div className="flex min-w-0 items-center gap-1.5">
          {gender && <GenderBadge gender={gender} />}
          <a
            href={person.uri}
            target="_blank"
            rel="noreferrer"
            className="truncate text-[15px] leading-tight font-bold text-ink no-underline hover:underline"
            title={`${person.name}: open in the Knowledge Graph`}
          >
            {person.name}
          </a>
        </div>
        <span className="truncate text-[12.5px] leading-tight text-umber" title={meta}>
          {lifeYears(birth, death)}
          {!deathBeforeBirth && ` · ${ageText}`}
          {/* Data problems are written out, not coloured: record colours belong to the data marks. */}
          {person.issues.length > 0 && <em className="text-ink"> · {person.issues.join(', ')}</em>}
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <EraBands bands={bands} />
        {ticks.map((year) => (
          <div
            key={year}
            className="absolute inset-y-0 w-px bg-copper/15"
            style={{ left: `${toPercent(year, range)}%` }}
          />
        ))}
        {segments.map((segment, i) => (
          <Bar key={i} segment={segment} gender={gender} />
        ))}
      </div>
    </li>
  )
}

/**
 * Which era name fits a band of a given width. Widths are the label widths in Cormorant Garamond
 * 600 at 15px (measured 2026-11-01 with the font files) plus ~3px, compared with the band's width
 * minus its 6px left padding. Below the smallest one nothing is written; the band still shows.
 * Short names that equal the full name (Medieval, Modern, Post-1922) skip that step.
 */
const ERA_NAME_FIT: Record<string, { name: string; short: string; tiny: string }> = {
  Medieval: { name: '@min-[57px]:block', short: '', tiny: '@min-[33px]:block @min-[57px]:hidden' },
  'Early Modern': {
    name: '@min-[85px]:block',
    short: '@min-[66px]:block @min-[85px]:hidden',
    tiny: '@min-[49px]:block @min-[66px]:hidden',
  },
  Modern: { name: '@min-[51px]:block', short: '', tiny: '@min-[34px]:block @min-[51px]:hidden' },
  'Post-1922': { name: '@min-[58px]:block', short: '', tiny: '@min-[33px]:block @min-[58px]:hidden' },
}

function EraName({ band }: { band: EraBand }) {
  const era = ERAS[band.index]
  const fit = ERA_NAME_FIT[era.name]
  return (
    <span
      title={`${era.name}, ${era.label}`}
      className="@container absolute top-1 overflow-hidden pl-1.5 font-display text-[15px] leading-tight font-semibold whitespace-nowrap text-bottle/85"
      style={{ left: `${band.left}%`, width: `${band.width}%` }}
    >
      <span className={`hidden ${fit.name}`}>{era.name}</span>
      {fit.short && <span className={`hidden ${fit.short}`}>{era.short}</span>}
      <span className={`hidden ${fit.tiny}`}>{era.tiny}</span>
    </span>
  )
}

/**
 * Faint era bands behind the axis and every row: every second era (by its place in ERAS) is shaded
 * straw, and a dashed line marks where an era begins inside the range. Drawn under the grid and bars.
 */
function EraBands({ bands }: { bands: EraBand[] }) {
  return bands.map((band) => (
    <div
      key={band.name}
      aria-hidden="true"
      className={`absolute inset-y-0 ${band.index % 2 === 1 ? 'bg-straw/25' : ''} ${
        band.startsInside ? 'border-l border-dashed border-bottle/35' : ''
      }`}
      style={{ left: `${band.left}%`, width: `${band.width}%` }}
    />
  ))
}

/**
 * One piece of a lifetime bar. Light pieces get an outline so they stay visible on parchment.
 * Lightness always means certainty; with "Mark gender" on, the hue says woman (pink) or man (blue).
 */
function Bar({ segment, gender }: { segment: Segment; gender?: Gender }) {
  const woman = gender === 'female'
  const look =
    segment.kind === 'certain'
      ? woman
        ? 'bg-woman'
        : 'bg-person'
      : woman
        ? 'bg-woman-light border border-woman'
        : 'bg-person-light border border-person'
  return (
    <div
      className={`absolute top-1/2 h-2.5 -translate-y-1/2 box-border ${look}`}
      style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
    />
  )
}
