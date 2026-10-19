/** Explains every mark that can appear on the timeline. Marks not drawn yet are not listed. */
export function Legend() {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 border-t border-linen p-0 pt-3 text-sm">
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
  )
}
