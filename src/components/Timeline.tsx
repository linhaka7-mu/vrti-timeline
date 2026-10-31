import { useState } from 'react'
import { ageAtDeath } from '../lib/dates'
import { lifeBarSegments, lifeYears, toPercent, type Segment } from '../lib/geometry'
import type { Gender, Person } from '../lib/people'
import { tickYears, type YearRange } from '../lib/range'
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
}

/**
 * The timeline: a year axis and one row per person.
 *
 * A range can hold thousands of people (Modern, 1750–1922, is the largest), so the list is
 * "virtualised": only the rows inside the scroll box, plus a few either side, exist in the page.
 * The rest is an empty spacer of the right height, so the scroll bar still behaves normally.
 */
export function Timeline({ people, range, markGender }: TimelineProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const ticks = tickYears(range)

  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const last = Math.min(people.length, Math.ceil((scrollTop + VIEW_HEIGHT) / ROW_HEIGHT) + OVERSCAN)
  const visible = people.slice(first, last)

  return (
    <div className="flex flex-col">
      {/* Year axis. scrollbar-gutter keeps it the same width as the rows below, which may show a scroll bar. */}
      <div className={`flex overflow-hidden border-b border-copper text-[13px] text-umber [scrollbar-gutter:stable] ${END_GAP}`}>
        <div className={`${LABEL_WIDTH} shrink-0`} />
        <div className="relative h-6 flex-1">
          {ticks.map((year) => (
            <span
              key={year}
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${toPercent(year, range)}%` }}
            >
              {year}
            </span>
          ))}
        </div>
      </div>

      <div
        className="overflow-y-auto [scrollbar-gutter:stable]"
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
            />
          ))}
        </ul>
      </div>
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
}

function PersonRow({ person, range, ticks, top, striped, markGender }: PersonRowProps) {
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
