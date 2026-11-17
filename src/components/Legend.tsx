import { GenderBadge } from './GenderBadge'

/**
 * Explains every mark that can appear on the timeline. Marks not drawn yet are not listed.
 * Sits above the timeline, so the marks are explained before people start reading the bars.
 *
 * Small and in umber, one run of items that wraps when it has to, so it reads like a footnote and
 * does not compete with the status sentence (sketch page 设计备份/图例位置方案 2026-11-17.html,
 * option 1, Siyan's choice). The gender items appear only while "Mark gender" is on.
 * It ends with what is not drawn yet, so the key and its one caveat are one footnote under the
 * status sentence (sketch page 设计备份/整体层次方案 2026-11-17.html, idea 3, Siyan, 2026-11-17).
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
      {markGender && (
        <>
          <li className={item}>
            <GenderBadge gender="female" />
            <span aria-hidden="true" className="flex items-center">
              <span className="box-border h-[11px] w-[11px] border border-woman bg-woman-light" />
              <span className="h-2 w-4 bg-woman" />
            </span>
            Woman
          </li>
          <li className={item}>
            <GenderBadge gender="male" />
            <span aria-hidden="true" className="flex items-center">
              <span className="box-border h-[11px] w-[11px] border border-person bg-person-light" />
              <span className="h-2 w-4 bg-person" />
            </span>
            Man
          </li>
        </>
      )}
      <li className="whitespace-nowrap">
        <span aria-hidden="true" className="mr-5 text-umber/50">
          ·
        </span>
        Not shown yet: people known only from archival records or estimated dates
      </li>
    </ul>
  )
}
