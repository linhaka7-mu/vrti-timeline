import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchPeopleAlive } from '../lib/people'
import type { YearRange } from '../lib/range'

/**
 * Loads the people alive in a range.
 * - Results are cached per range, so going back to a range already seen is instant
 *   and does not ask the endpoint again (staleTime: Infinity — the data changes rarely).
 * - While a new range loads, the previous result stays on screen (keepPreviousData)
 *   instead of the timeline flashing empty.
 * - `signal` cancels a request that is no longer wanted.
 */
export function usePeopleAlive(range: YearRange) {
  return useQuery({
    queryKey: ['people-alive', range.from, range.to],
    queryFn: ({ signal }) => fetchPeopleAlive(range.from, range.to, signal),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    retry: 1,
  })
}
