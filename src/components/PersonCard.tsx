import type { CSSProperties, MouseEventHandler } from 'react'
import { cardKicker, describeAge, describeInterval, showsAge } from '../lib/describe'
import type { Person } from '../lib/people'

export const CARD_WIDTH = 320 // px

interface PersonCardProps {
  person: Person
  style: CSSProperties
  /** Pinned by a click: the card stays until Esc, a click elsewhere, or scrolling. */
  pinned: boolean
  onMouseEnter: MouseEventHandler
  onMouseLeave: MouseEventHandler
}

/**
 * The card shown when the pointer is on a person's bar (supervisor 2026-11-02: "the bars should be
 * clickable", with a way into the Knowledge Graph). Design chosen by Siyan on the sketch page
 * 设计备份/悬停卡片方案 2026-11-14.html, option G: a bottle-green header with "Person · Female",
 * the name, then one plain sentence for the dates and the age, and the link.
 * Data problems (⚠) are repeated here in full, since the date line under the name is often cut off.
 */
export function PersonCard({ person, style, pinned, onMouseEnter, onMouseLeave }: PersonCardProps) {
  return (
    <div
      role={pinned ? 'dialog' : 'tooltip'}
      aria-label={person.name}
      className="card-in grain-over fixed z-50 overflow-hidden rounded border border-copper bg-[#fffdf7] text-ink shadow-[0_10px_26px_rgba(46,74,51,0.22)]"
      style={{ width: CARD_WIDTH, ...style }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-bottle px-4 pt-3 pb-2.5">
        <div className="text-[11px] tracking-[0.14em] text-paper/75 uppercase">{cardKicker(person.gender)}</div>
        <div className="font-display text-[25px] leading-tight font-semibold text-white">{person.name}</div>
      </div>

      <p className="m-0 px-4 py-3 text-[15px] leading-relaxed">
        Born <b>{describeInterval(person.birth)}</b> and died <b>{describeInterval(person.death)}</b>
        {showsAge(person) ? `, aged ${describeAge(person.birth, person.death)}.` : '.'}
      </p>

      {person.issues.length > 0 && (
        <p className="mx-4 mt-0 mb-3 border-l-[3px] border-ink bg-ink/5 px-2 py-1.5 text-[13px]">
          <span aria-hidden="true">{'⚠︎ '}</span>
          {person.issues.join(', ')}
        </p>
      )}

      <div className="-mt-1 px-4 pb-3 text-[13px]">
        <a href={person.uri} target="_blank" rel="noreferrer" className="font-bold text-bottle">
          Open in the Knowledge Graph ↗
        </a>
      </div>
    </div>
  )
}
