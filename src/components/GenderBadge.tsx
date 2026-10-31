import type { Gender } from '../lib/people'

/**
 * The small F / M badge shown before a name when "Mark gender" is on.
 * It says in letters what the bar colour says in colour, so gender can be read without telling
 * pink from blue (red-blind viewers) and is announced by screen readers.
 * Women filled in bottle green, men outlined: the rarer group (4.5% in 1500–1749) is the easier to spot.
 */
export function GenderBadge({ gender }: { gender: Gender }) {
  const woman = gender === 'female'
  return (
    <span
      className={`box-border inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] leading-none font-bold no-underline ${
        woman ? 'bg-bottle text-white' : 'border-[1.2px] border-umber text-umber'
      }`}
    >
      <span aria-hidden="true">{woman ? 'F' : 'M'}</span>
      <span className="sr-only">{woman ? 'Woman:' : 'Man:'}</span>
    </span>
  )
}
