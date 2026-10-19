import { useEffect, useState } from 'react'

/**
 * Returns `value`, but only once it has stopped changing for `delay` ms.
 * Dragging the slider changes the range dozens of times a second; the endpoint is asked
 * only when the hand pauses (handbook §13.1: do not flood the endpoint).
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return settled
}
