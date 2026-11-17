/**
 * The hover fill shared by the clickable labels and buttons (era labels, gender buttons, "Mark gender"):
 * a straw fill sweeps across from the side the pointer came in, in 0.2s (Siyan, 2026-11-17: the first
 * motion on the page, on the era labels, and the one she liked; then used for the buttons too, so the
 * page moves in one way). Still for people who ask their system for reduced motion.
 *
 * Use: the parent gets `group relative overflow-hidden` and `onMouseEnter={markEntrySide}` (lib/hover.ts); put
 * <HoverSweep /> first inside it, and give the parent's other children `relative` so they sit above it.
 */
export function HoverSweep({ off = false }: { off?: boolean }) {
  if (off) return null
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 origin-left scale-x-0 bg-straw/45 transition-transform duration-200 ease-out group-hover:scale-x-100 group-data-[from=right]:origin-right motion-reduce:transition-none"
    />
  )
}
