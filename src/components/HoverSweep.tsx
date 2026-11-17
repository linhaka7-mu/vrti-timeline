/**
 * The hover fill shared by the clickable labels and buttons (era labels, gender buttons, "Mark gender"):
 * a straw fill sweeps across from the side the pointer came in, in 0.2s (Siyan, 2026-11-17: the first
 * motion on the page, on the era labels, and the one she liked; then used for the buttons too, so the
 * page moves in one way). Still for people who ask their system for reduced motion.
 *
 * Use: the parent gets `group relative overflow-hidden` and `onMouseEnter={markEntrySide}` (lib/hover.ts); put
 * <HoverSweep /> first inside it, and give the parent's other children `relative` so they sit above it.
 */
export function HoverSweep({ off = false, on }: { off?: boolean; on?: boolean }) {
  if (off) return null
  // `on` given: the fill follows it (the drop-down's highlighted option, moved by mouse or arrow keys)
  // instead of the pointer hovering the parent.
  const shown = on === undefined ? 'scale-x-0 group-hover:scale-x-100' : on ? 'scale-x-100' : 'scale-x-0'
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-0 origin-left bg-straw/45 transition-transform duration-200 ease-out group-data-[from=right]:origin-right motion-reduce:transition-none ${shown}`}
    />
  )
}
