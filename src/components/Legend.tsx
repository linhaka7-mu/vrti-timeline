import { GenderBadge } from './GenderBadge'

/**
 * Explains every mark that can appear on the timeline. Marks not drawn yet are not listed.
 * Sits above the timeline, so the marks are explained before people start reading the bars.
 *
 * Small and in umber, one run of items that wraps when it has to, so it reads like a footnote and
 * does not compete with the status sentence (sketch page 设计备份/图例位置方案 2026-11-17.html,
 * option 1, Siyan's choice). The gender items appear only while "Mark gender" is on.
 * The "Not shown yet" caveat that used to end this line was dropped (Siyan, 2026-11-17): the source
 * menu still shows the 1641 Depositions with (0).
 * The light (uncertain) swatches are taller than the dark ones, as on the timeline.
 */
export function Legend({ markGender }: { markGender: boolean }) {
  const item = 'flex items-center gap-1.5 whitespace-nowrap'
  return (
    <ul aria-label="Key" className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-1.5 p-0 text-[13px] text-umber">
      <li className={item}>
        <span aria-hidden="true" className="h-2 w-7 bg-person" />
        Certainly alive
      </li>
      <li className={item}>
        <span aria-hidden="true" className="flex items-center">
          <span className="box-border h-[11px] w-[11px] border border-person bg-person-light" />
          <span className="h-2 w-4 bg-person" />
        </span>
        Birth or death known only roughly: somewhere in the light part
      </li>
      <li className={item}>
        <span aria-hidden="true" className="rounded-[3px] bg-white/60 px-1 font-type text-[12px] text-umber/45">
          1475
        </span>
        Pale years: 50 years either side of your range, so whole lives show
      </li>
      {/* The gender items open and close like a drawer when "Mark gender" is switched: the width grows
          from nothing while they fade in, and back (Siyan, 2026-11-17: appearing all at once was abrupt).
          The 0fr → 1fr grid column is what lets a width animate to its natural size. */}
      <li
        aria-hidden={!markGender}
        className={`grid transition-[grid-template-columns,opacity] duration-200 ease-out motion-reduce:transition-none ${
          markGender ? 'grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0'
        }`}
      >
        <span className="flex min-w-0 items-center gap-5 overflow-hidden">
          <span className={item}>
            <GenderBadge gender="female" />
            <span aria-hidden="true" className="flex items-center">
              <span className="box-border h-[11px] w-[11px] border border-woman bg-woman-light" />
              <span className="h-2 w-4 bg-woman" />
            </span>
            Woman
          </span>
          <span className={item}>
            <GenderBadge gender="male" />
            <span aria-hidden="true" className="flex items-center">
              <span className="box-border h-[11px] w-[11px] border border-person bg-person-light" />
              <span className="h-2 w-4 bg-person" />
            </span>
            Man
          </span>
        </span>
      </li>
    </ul>
  )
}
