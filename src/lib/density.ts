import { DOMAIN_END, DOMAIN_START } from './range'
import { runSelect, type Binding } from './sparql'

/*
 * The density chart above the range slider (sketch page 设计备份/密度图方案 2026-11-14.html, option D,
 * chosen by Siyan): for every decade, how many people may have been alive in it, so users can see
 * where the data is before they drag. Square-root heights, so the sparse medieval decades still show.
 */

export const DECADE = 10

export interface DecadeCount {
  /** First year of the decade: 1540 for the 1540s. */
  start: number
  count: number
}

/** How many people share one pair of birth and death years. */
export interface LifePair {
  birth: number
  death: number
  people: number
}

/**
 * One query for the whole knowledge graph: people with both a birth and a death time-span,
 * grouped by (earliest birth year, latest death year). The same people and the same rule as the
 * timeline (handbook §3), but only a few thousand small rows instead of one row per person.
 */
export function densityQuery(): string {
  return `PREFIX crm: <http://erlangen-crm.org/current/>
SELECT ?birth ?death (COUNT(DISTINCT ?person) AS ?people) WHERE {
  ?b a crm:E67_Birth ;
     crm:P98_brought_into_life ?person ;
     crm:P4_has_time-span ?bs .
  ?bs crm:P82a_begin_of_the_begin ?birthStart .
  ?d a crm:E69_Death ;
     crm:P93_took_out_of_existence ?person ;
     crm:P4_has_time-span ?ds .
  ?ds crm:P82b_end_of_the_end ?deathEnd .
  BIND(YEAR(?birthStart) AS ?birth)
  BIND(YEAR(?deathEnd) AS ?death)
}
GROUP BY ?birth ?death`
}

/** Reads the result rows; rows whose years cannot be read are left out. */
export function toPairs(rows: Binding[]): LifePair[] {
  const pairs: LifePair[] = []
  for (const row of rows) {
    const birth = Number(row.birth?.value)
    const death = Number(row.death?.value)
    const people = Number(row.people?.value)
    if (Number.isInteger(birth) && Number.isInteger(death) && Number.isInteger(people)) {
      pairs.push({ birth, death, people })
    }
  }
  return pairs
}

/**
 * People who may have been alive in each decade between DOMAIN_START and DOMAIN_END: born in or
 * before the decade's last year and died in or after its first year (the timeline's overlap rule).
 * People whose death is recorded before their birth are left out: they cannot be placed.
 */
export function decadeCounts(pairs: LifePair[], start = DOMAIN_START, end = DOMAIN_END): DecadeCount[] {
  const base = Math.floor(start / DECADE) * DECADE
  const counts: DecadeCount[] = []
  for (let year = base; year <= end; year += DECADE) counts.push({ start: year, count: 0 })
  for (const { birth, death, people } of pairs) {
    if (death < birth) continue
    const first = Math.max(start, birth)
    const last = Math.min(end, death)
    if (last < first) continue
    const firstIndex = Math.floor((first - base) / DECADE)
    const lastIndex = Math.floor((last - base) / DECADE)
    for (let i = firstIndex; i <= lastIndex; i++) counts[i].count += people
  }
  return counts
}

/** Bar height as a share of the tallest (0–1), on a square-root scale. */
export function sqrtShare(count: number, max: number): number {
  return max > 0 ? Math.sqrt(count) / Math.sqrt(max) : 0
}

export async function fetchDecadeCounts(signal?: AbortSignal): Promise<DecadeCount[]> {
  return decadeCounts(toPairs(await runSelect(densityQuery(), signal)))
}
