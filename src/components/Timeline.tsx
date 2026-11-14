import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react'
import { ageAtDeath } from '../lib/dates'
import { lifeBarSegments, lifeYears, mayBeAliveIn, toPercent, yearAt, type Segment } from '../lib/geometry'
import type { Gender, Person } from '../lib/people'
import { ERAS, eraBands, tickYears, type EraBand, type YearRange } from '../lib/range'
import { GenderBadge } from './GenderBadge'
import { CARD_WIDTH, PersonCard } from './PersonCard'

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
/** Where the person card is, and whether a click has pinned it. */
interface CardState {
  person: Person
  place: CardPlace
  pinned: boolean
}

/** Each side is either `left` or `right`, and `top` or `bottom`, so the card's height never has to be guessed. */
type CardPlace = ({ left: number } | { right: number }) & ({ top: number } | { bottom: number })

const CARD_GAP = 14 // px between the row and the card
const POINTER_GAP = 40 // px between the pointer and the card's near side (Siyan: "a little more diagonal")
const ROOM_BELOW = 240 // px; with less room than this under the row, the card goes above it
const HIDE_DELAY = 300 // ms; time to move the pointer from the bar onto the card (to reach its link)

/**
 * Where the card goes (decided with Siyan, 2026-11-14): diagonally from the pointer, so it covers
 * neither the row being read nor the column straight below or above the pointer. The pointer can
 * still move to the next row, and the card's link is a short move away.
 * - Normally below and to the right: the card's top-left corner sits just right of the pointer, under the row.
 * - Near the bottom of the window: above and to the right (bottom-left corner on the row's top edge).
 * - Near the right edge of the window: mirrored to the left.
 * (Earlier versions followed the bar's left end, which is off screen for people born before the
 * range, and then sat straight under the pointer, where it blocked the rows below.)
 */
function cardPlace(pointerX: number, row: DOMRect): CardPlace {
  const roomRight = window.innerWidth - pointerX - POINTER_GAP >= CARD_WIDTH + 8
  const side = roomRight
    ? { left: pointerX + POINTER_GAP }
    : { right: Math.max(8, window.innerWidth - pointerX + POINTER_GAP) }
  const below = window.innerHeight - row.bottom >= ROOM_BELOW
  return below
    ? { ...side, top: row.bottom + CARD_GAP }
    : { ...side, bottom: window.innerHeight - row.top + CARD_GAP }
}

/** The row (list item) a bar belongs to. */
const rowOf = (event: MouseEvent<HTMLElement>) =>
  (event.currentTarget.closest('li') ?? event.currentTarget).getBoundingClientRect()

/** The year under the pointer, and where to draw its line (px from the left of the timeline). */
interface YearLine {
  year: number
  x: number
}

export function Timeline({ people, range, markGender, updating = false }: TimelineProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [card, setCard] = useState<CardState | null>(null)
  const [yearLine, setYearLine] = useState<YearLine | null>(null)
  const hideTimer = useRef<number | undefined>(undefined)
  const wrapRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<HTMLDivElement>(null)
  const ticks = tickYears(range)
  const bands = eraBands(range)
  // A card for someone who is no longer listed (new range, filter, search) is simply not shown.
  const shownCard = card && people.includes(card.person) ? card : null

  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const last = Math.min(people.length, Math.ceil((scrollTop + VIEW_HEIGHT) / ROW_HEIGHT) + OVERSCAN)
  const visible = people.slice(first, last)

  const cancelHide = () => window.clearTimeout(hideTimer.current)
  const hideSoon = () => {
    cancelHide()
    hideTimer.current = window.setTimeout(() => setCard((c) => (c?.pinned ? c : null)), HIDE_DELAY)
  }
  // The card is placed under the row the pointer is on and then stays put,
  // so the pointer can move onto it to click the link.
  const showCard = (person: Person, event: MouseEvent<HTMLElement>) => {
    cancelHide()
    const place = cardPlace(event.clientX, rowOf(event))
    setCard((c) => (c?.pinned || c?.person === person ? c : { person, place, pinned: false }))
  }
  const pinCard = (person: Person, event: MouseEvent<HTMLElement>) => {
    cancelHide()
    const place = cardPlace(event.clientX, rowOf(event))
    setCard((c) => (c?.pinned && c.person === person ? null : { person, place, pinned: true }))
  }

  // Year line (sketch page 2026-11-01, idea 3): a line follows the pointer across the timeline,
  // says which year it is on, and fades everyone who cannot have been alive in that year.
  const moveYearLine = (event: MouseEvent) => {
    const plot = plotRef.current?.getBoundingClientRect()
    const wrap = wrapRef.current?.getBoundingClientRect()
    if (!plot || !wrap) return
    const fraction = (event.clientX - plot.left) / plot.width
    if (fraction < 0 || fraction >= 1) return setYearLine(null)
    setYearLine({ year: yearAt(fraction, range), x: event.clientX - wrap.left })
  }
  const aliveCount = yearLine
    ? people.filter((p) => mayBeAliveIn(p.birth, p.death, yearLine.year)).length
    : 0

  // A pinned card closes with Esc or a click anywhere outside it and outside the bars.
  const pinned = shownCard?.pinned ?? false
  useEffect(() => {
    if (!pinned) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCard(null)
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element | null
      if (!target?.closest('[data-person-card], [data-lane]')) setCard(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [pinned])
  useEffect(() => () => window.clearTimeout(hideTimer.current), [])

  return (
    <div className="flex flex-col">
      {/* What the year line shows, in words. Hidden from screen readers: it changes with every
          mouse movement, and the same information is not otherwise needed to use the page. */}
      <p aria-hidden="true" className="m-0 mb-1.5 min-h-5 text-[14px] text-umber">
        {yearLine ? (
          <>
            <strong className="text-ink">{yearLine.year}</strong>: {aliveCount.toLocaleString('en-IE')} of{' '}
            {people.length.toLocaleString('en-IE')} people may have been alive (the others are faded)
          </>
        ) : (
          '\u00a0'
        )}
      </p>

      <div ref={wrapRef} className="relative" onMouseMove={moveYearLine} onMouseLeave={() => setYearLine(null)}>
        <Axis range={range} ticks={ticks} bands={bands} updating={updating} plotRef={plotRef} />

        <div
          className={`overflow-y-auto transition-opacity duration-200 [scrollbar-gutter:stable] ${updating ? 'opacity-55' : ''}`}
          style={{ height: Math.min(VIEW_HEIGHT, people.length * ROW_HEIGHT) }}
          onScroll={(event) => {
            setScrollTop(event.currentTarget.scrollTop)
            // The card is fixed on the screen, so it would no longer sit next to its row.
            setCard(null)
          }}
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
                faded={
                  yearLine !== null &&
                  shownCard?.person !== person &&
                  !mayBeAliveIn(person.birth, person.death, yearLine.year)
                }
                highlighted={shownCard?.person === person}
                onLaneEnter={showCard}
                onLaneLeave={hideSoon}
                onLaneClick={pinCard}
              />
            ))}
          </ul>
        </div>

        {yearLine && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 z-10 border-l-[1.5px] border-bottle"
            style={{ left: yearLine.x }}
          >
            <span className="absolute top-0 -translate-x-1/2 rounded-full bg-bottle px-2 py-px font-type text-[13px] whitespace-nowrap text-white">
              {yearLine.year}
            </span>
          </div>
        )}
      </div>

      {shownCard && (
        <div data-person-card>
          <PersonCard
            person={shownCard.person}
            pinned={shownCard.pinned}
            style={shownCard.place}
            onMouseEnter={cancelHide}
            onMouseLeave={hideSoon}
          />
        </div>
      )}
    </div>
  )
}

/**
 * The year axis: era bands and names, then the years.
 * scrollbar-gutter keeps it the same width as the rows below, which may show a scroll bar.
 */
function Axis({
  range,
  ticks,
  bands,
  updating,
  plotRef,
}: {
  range: YearRange
  ticks: number[]
  bands: EraBand[]
  updating: boolean
  /** The year area of the axis, measured by the year line to turn the pointer's position into a year. */
  plotRef?: RefObject<HTMLDivElement | null>
}) {
  return (
    <div className={`relative flex overflow-hidden border-b border-copper text-[13px] text-umber [scrollbar-gutter:stable] ${END_GAP}`}>
      <div className={`${LABEL_WIDTH} shrink-0`} />
      <div ref={plotRef} className="relative h-12 flex-1">
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
            className="absolute bottom-1 -translate-x-1/2 rounded-[3px] bg-white/60 px-1 font-type leading-tight"
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
  /** The year line is on a year this person cannot have been alive in. */
  faded: boolean
  /** This person's card is open. */
  highlighted: boolean
  onLaneEnter: (person: Person, event: MouseEvent<HTMLElement>) => void
  onLaneLeave: () => void
  onLaneClick: (person: Person, event: MouseEvent<HTMLElement>) => void
}

function PersonRow({
  person,
  range,
  ticks,
  top,
  striped,
  markGender,
  bands,
  faded,
  highlighted,
  onLaneEnter,
  onLaneLeave,
  onLaneClick,
}: PersonRowProps) {
  // People without a recorded gender get no badge and keep the plain blue bar.
  const gender = markGender ? person.gender : undefined
  const { birth, death } = person
  const segments = lifeBarSegments(birth, death, range)
  // From the leftmost piece to the end of the rightmost one (pieces can be out of order when
  // death is recorded before birth).
  const hitLeft = Math.min(...segments.map((s) => s.left))
  const hitRight = Math.max(...segments.map((s) => s.left + s.width))
  const hit = segments.length > 0 ? { left: hitLeft, width: hitRight - hitLeft } : null
  const age = ageAtDeath(birth, death)
  // Spaced en dash ("aged 47 – 48"), Siyan's choice on the card sketch page, 2026-11-14.
  const ageText = age.min === age.max ? `aged ${age.min}` : `aged ${age.min} – ${age.max}`
  const deathBeforeBirth = person.issues.includes('death recorded before birth')
  // Full text for the tooltip, because a long line is cut off with "…" in the narrow name column.
  const meta = [lifeYears(birth, death), deathBeforeBirth ? null : ageText, ...person.issues].filter(Boolean).join(' · ')

  return (
    <li
      className={`absolute inset-x-0 flex ${END_GAP} ${highlighted ? 'bg-bottle-tint' : striped ? 'bg-linen/30' : ''}`}
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
        <span className="truncate font-type text-[12.5px] leading-tight text-umber" title={meta}>
          {/* A warning sign at the start of the line, so it is never cut off by the "…" at the end.
              It is decorative for screen readers: the problem itself is read out from the text below.
              U+FE0E asks for the plain text sign, not the coloured emoji. */}
          {person.issues.length > 0 && (
            <span aria-hidden="true" className="text-ink not-italic">
              {'\u26A0\uFE0E '}
            </span>
          )}
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
          <Bar key={i} segment={segment} gender={gender} faded={faded} emphasised={highlighted} />
        ))}
        {/* The hover area: the bar's own length (at least 12px wide, so very short bars can be hit),
            24px high. Hovering shows the person card, clicking pins it. Keyboard and screen-reader users
            reach the same Knowledge Graph page through the name link, and the dates are in the line above. */}
        {hit && (
          <div
            data-lane
            aria-hidden="true"
            className="absolute top-1/2 h-6 min-w-3 -translate-y-1/2 cursor-pointer"
            style={{ left: `${hit.left}%`, width: `${hit.width}%` }}
            onMouseEnter={(event) => onLaneEnter(person, event)}
            onMouseLeave={onLaneLeave}
            onClick={(event) => onLaneClick(person, event)}
          />
        )}
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
 * Light pieces are also taller (14px against the bar's 10px), so they stick out above and below.
 * Supervisor 2026-11-02: one year is only ~3.6px wide at 1500–1749, so a light end was easy to miss.
 * Their width still shows the real uncertain span (handbook §4); only the height changed (sketch
 * page 2026-11-02, option G, chosen by Siyan).
 */
function Bar({
  segment,
  gender,
  faded,
  emphasised,
}: {
  segment: Segment
  gender?: Gender
  faded: boolean
  /** This person's card is open: the whole bar grows a little (10/14px → 12/17px), keeping the
   *  light ends taller than the dark part, so the card is clearly tied to this bar (Siyan, 2026-11-14). */
  emphasised: boolean
}) {
  const woman = gender === 'female'
  const look =
    segment.kind === 'certain'
      ? woman
        ? 'bg-woman'
        : 'bg-person'
      : woman
        ? 'bg-woman-light border border-woman'
        : 'bg-person-light border border-person'
  const height =
    segment.kind === 'certain' ? (emphasised ? 'h-3' : 'h-2.5') : emphasised ? 'h-[17px]' : 'h-3.5'
  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 box-border transition-[height,opacity] duration-150 motion-reduce:transition-none ${height} ${look} ${faded ? 'opacity-30' : ''}`}
      style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
    />
  )
}
