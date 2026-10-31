import { GenderBadge } from './GenderBadge'

/**
 * Explains every mark that can appear on the timeline. Marks not drawn yet are not listed.
 * Sits above the timeline, so the marks are explained before people start reading the bars.
 * Line 1: certainty (always). Line 2: gender (only while "Mark gender" is on).
 */
export function Legend({ markGender }: { markGender: boolean }) {
  return (
    <div aria-label="Key" role="group" className="flex flex-col gap-2 text-sm">
      <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-9 bg-person" />
          Alive (dates known)
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="flex">
            <span className="box-border h-2.5 w-3.5 border border-person bg-person-light" />
            <span className="h-2.5 w-5 bg-person" />
          </span>
          Birth or death known only to the year (or a span): it happened somewhere in the light part
        </li>
      </ul>
      {markGender && (
        <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
          <li className="flex items-center gap-2">
            <GenderBadge gender="female" />
            <span aria-hidden="true" className="flex">
              <span className="box-border h-2.5 w-3.5 border border-woman bg-woman-light" />
              <span className="h-2.5 w-5 bg-woman" />
            </span>
            Woman: pink, same dark / light rule
          </li>
          <li className="flex items-center gap-2">
            <GenderBadge gender="male" />
            <span aria-hidden="true" className="flex">
              <span className="box-border h-2.5 w-3.5 border border-person bg-person-light" />
              <span className="h-2.5 w-5 bg-person" />
            </span>
            Man: blue
          </li>
        </ul>
      )}
    </div>
  )
}
