import type { Gender } from '../lib/people'

/**
 * The small F / M badge shown before a name when "Mark gender" is on.
 * It says in letters what the bar colour says in colour, so gender can be read without telling
 * pink from blue (red-blind viewers) and is announced by screen readers.
 * Women filled in bottle green, men outlined: the rarer group (4.5% in 1500–1749) is the easier to spot.
 * Square, like the buttons and boxes. 15px, a little under the height of the name's capitals plus
 * descenders: at 18px it looked a size bigger than the name beside it (Siyan, 2026-11-17).
 */
export function GenderBadge({ gender, fadeIn = false }: { gender: Gender; fadeIn?: boolean }) {
  const woman = gender === 'female'
  return (
    <span
      className={`${fadeIn ? 'badge-in' : ''} box-border inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[3px] text-[10px] leading-none font-bold no-underline ${
        woman ? 'bg-bottle text-white' : 'border-[1.2px] border-umber text-umber'
      }`}
    >
      {/* Centred on the capital letter itself: text-box trims the font's space above the capitals and below
          the baseline, so the box is exactly the letter's height and flexbox centres it (Siyan, 2026-11-17;
          a fixed 1px nudge stopped fitting once the badge was smaller). Browsers without text-box show it
          as before, a hair off. */}
      <span aria-hidden="true" className="[text-box:trim-both_cap_alphabetic]">
        {woman ? 'F' : 'M'}
      </span>
      <span className="sr-only">{woman ? 'Woman:' : 'Man:'}</span>
    </span>
  )
}
