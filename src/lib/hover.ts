import type { MouseEvent } from 'react'

/** Notes on the element which side the pointer came in from, so the sweep starts there. */
export function markEntrySide(event: MouseEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect()
  event.currentTarget.dataset.from = event.clientX - box.left < box.width / 2 ? 'left' : 'right'
}
