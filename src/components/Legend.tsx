import { GenderBadge } from './GenderBadge'

/**
 * Explains every mark that can appear on the timeline. Marks not drawn yet are not listed.
 * Sits above the timeline, so the marks are explained before people start reading the bars.
 * Line 1: certainty (always). Line 2: gender (only while "Mark gender" is on).
 * The light (uncertain) swatches are taller than the dark ones, as on the timeline.
 */
export function Legend({ markGender }: { markGender: boolean }) {
  return (
    <div aria-label="Key" role="group" className="flex flex-col gap-2 text-sm">
      <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-9 bg-person" />
          Certainly alive
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="flex items-center">
            <span className="box-border h-3.5 w-3.5 border border-person bg-person-light" />
            <span className="h-2.5 w-5 bg-person" />
          </span>
          Birth or death known only roughly: somewhere in the light part
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="rounded-[3px] bg-white/60 px-1 font-type text-[12.5px] text-umber/45">
            1475
          </span>
          Pale years: 50 years either side of your range, so whole lives show
        </li>
      </ul>
      {markGender && (
        <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
          <li className="flex items-center gap-2">
            <GenderBadge gender="female" />
            <span aria-hidden="true" className="flex items-center">
              <span className="box-border h-3.5 w-3.5 border border-woman bg-woman-light" />
              <span className="h-2.5 w-5 bg-woman" />
            </span>
            Woman
          </li>
          <li className="flex items-center gap-2">
            <GenderBadge gender="male" />
            <span aria-hidden="true" className="flex items-center">
              <span className="box-border h-3.5 w-3.5 border border-person bg-person-light" />
              <span className="h-2.5 w-5 bg-person" />
            </span>
            Man
          </li>
        </ul>
      )}
    </div>
  )
}
