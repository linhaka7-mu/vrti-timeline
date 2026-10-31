import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

interface SelectProps<T extends string> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  /** Id of the visible label, or… */
  labelledBy?: string
  /** …a name for screen readers when there is no visible label. */
  ariaLabel?: string
  /**
   * Extra labels the box should be wide enough for, though they are not options right now.
   * Used when the options change (the order box says "A to Z" or "earliest first" depending on
   * the sort key), so the box keeps one width and the controls to its right do not move.
   */
  sizeFor?: string[]
}

/**
 * A drop-down drawn by the page instead of the browser, so it matches the style tile
 * (bottle green on white) on every system. The browser's own menu cannot be styled.
 *
 * It follows the WAI-ARIA "select-only combobox" pattern, so it works like a native select:
 * - Mouse: click to open, click an option to choose it, click elsewhere to close.
 * - Keyboard: Tab to it; ↓ / ↑ / Enter / Space open it; ↓ ↑ Home End move; Enter, Space or Tab
 *   choose; Esc closes without changing; typing a letter jumps to the next option starting with it.
 * - Screen readers hear the label, the current value, and each option as it is highlighted.
 */
export function Select<T extends string>({ value, options, onChange, labelledBy, ariaLabel, sizeFor = [] }: SelectProps<T>) {
  const id = useId()
  const [open, setOpen] = useState(false)
  // The highlighted option while the list is open (moved by arrow keys or the mouse).
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))

  const openList = (index = selectedIndex) => {
    setActive(index)
    setOpen(true)
  }
  const choose = (index: number) => {
    setOpen(false)
    if (options[index].value !== value) onChange(options[index].value)
  }

  // Close when the user clicks anywhere outside.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Keep the highlighted option in view when the list is long enough to scroll.
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        openList()
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        openList(event.key === 'Home' ? 0 : last)
      }
      return
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActive((i) => Math.min(last, i + 1))
        return
      case 'ArrowUp':
        event.preventDefault()
        setActive((i) => Math.max(0, i - 1))
        return
      case 'Home':
      case 'End':
        event.preventDefault()
        setActive(event.key === 'Home' ? 0 : last)
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        choose(active)
        return
      case 'Tab':
        choose(active) // no preventDefault: focus still moves on, as with a native select
        return
      case 'Escape':
        event.preventDefault()
        setOpen(false)
        return
    }
    // Type-ahead: a letter jumps to the next option that starts with it.
    if (event.key.length === 1 && /\S/.test(event.key)) {
      const letter = event.key.toLowerCase()
      for (let step = 1; step <= options.length; step++) {
        const i = (active + step) % options.length
        if (options[i].label.toLowerCase().startsWith(letter)) {
          setActive(i)
          break
        }
      }
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        aria-labelledby={labelledBy ? `${labelledBy} ${id}-value` : undefined}
        aria-label={labelledBy ? undefined : ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false)
        }}
        className={`flex h-10 cursor-pointer items-center gap-4 rounded border-[1.5px] bg-white pr-3.5 pl-3.5 text-base text-ink ${
          open ? 'border-bottle' : 'border-umber hover:border-bottle'
        }`}
      >
        {/* Every label sits in the same grid cell, so the box is as wide as the longest option and never jumps. */}
        <span className="grid text-left">
          {options.map((option, i) => (
            <span
              key={option.value}
              id={i === selectedIndex ? `${id}-value` : undefined}
              aria-hidden={i !== selectedIndex}
              className={`col-start-1 row-start-1 whitespace-nowrap ${i === selectedIndex ? '' : 'invisible'}`}
            >
              {option.label}
            </span>
          ))}
          {sizeFor.map((label) => (
            <span key={label} aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-nowrap">
              {label}
            </span>
          ))}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 8"
          className={`h-2 w-3 shrink-0 text-bottle transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-labelledby={labelledBy}
          aria-label={labelledBy ? undefined : ariaLabel}
          className="absolute top-[calc(100%+4px)] left-0 z-20 m-0 max-h-72 min-w-full list-none overflow-y-auto rounded-md border-[1.5px] border-bottle bg-white p-1 shadow-[0_6px_18px_rgb(46_74_51/0.18)]"
        >
          {options.map((option, i) => {
            const selected = i === selectedIndex
            const highlighted = i === active
            return (
              <li
                key={option.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={selected}
                // pointerdown + preventDefault keeps focus on the button, so the keyboard keeps working.
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(i)}
                onPointerMove={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-sm py-2 pr-4 pl-2.5 whitespace-nowrap ${
                  selected ? 'bg-bottle font-bold text-white' : highlighted ? 'bg-bottle-tint text-ink' : 'text-ink'
                } ${selected && highlighted ? 'ring-2 ring-bottle/30 ring-inset' : ''}`}
              >
                <svg aria-hidden="true" viewBox="0 0 12 10" className={`h-2.5 w-3 shrink-0 ${selected ? '' : 'invisible'}`}>
                  <path d="M1 5.5 4.5 9 11 1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {option.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
