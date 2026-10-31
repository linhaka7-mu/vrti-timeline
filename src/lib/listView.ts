/**
 * How the list of people is ordered and narrowed down: sort, gender filter and name search.
 *
 * Supervisor feedback (2026-10-20): "at moment it is not obvious the ordering of the names…
 * user having control would be good". So the order is chosen by the user and always written out
 * on the page (describeOrder), and filters say how many people they hide (handbook §4.1).
 *
 * Everything here runs in the browser on people already fetched: changing the order or the filter
 * never asks the endpoint again.
 */
import { ageAtDeath } from './dates'
import type { Gender, Person } from './people'
import type { YearRange } from './range'

export type SortKey = 'birth' | 'death' | 'surname' | 'forename' | 'age'
export type SortDirection = 'asc' | 'desc'
export type GenderFilter = 'all' | Gender

export interface ListView {
  sort: SortKey
  direction: SortDirection
  gender: GenderFilter
  /** Name search, as typed. Empty means no search. */
  query: string
  /** "Mark gender": women's bars in pink and an F / M badge by each name. Off by default. */
  markGender: boolean
}

/** Earliest birth first: the order the timeline has always used, now stated on the page. */
export const DEFAULT_VIEW: ListView = { sort: 'birth', direction: 'asc', gender: 'all', query: '', markGender: false }

export const SORT_KEYS: SortKey[] = ['birth', 'death', 'surname', 'forename', 'age']

/** Words for the sort menu and for the sentence above the timeline. */
export const SORT_LABELS: Record<SortKey, string> = {
  birth: 'Year of birth',
  death: 'Year of death',
  surname: 'Surname',
  forename: 'Forename',
  age: 'Age at death',
}

/** What "ascending" and "descending" mean for each key, in plain words. */
export function directionLabel(sort: SortKey, direction: SortDirection): string {
  const asc = direction === 'asc'
  switch (sort) {
    case 'birth':
    case 'death':
      return asc ? 'earliest first' : 'latest first'
    case 'surname':
    case 'forename':
      return asc ? 'A to Z' : 'Z to A'
    case 'age':
      return asc ? 'youngest first' : 'oldest first'
  }
}

/** "Sorted by year of birth, earliest first." */
export function describeOrder({ sort, direction }: ListView): string {
  return `Sorted by ${SORT_LABELS[sort].toLowerCase()}, ${directionLabel(sort, direction)}`
}

// Ignores case and accents, and reads "10" after "9": Ó Briain sits with O Brien, not after Z.
const collator = new Intl.Collator('en-IE', { sensitivity: 'base', numeric: true })

/**
 * The value a person is sorted on. Uncertain dates sort on their earliest possible day, the same
 * rule the timeline already used. Age uses the middle of the possible range ("aged 57–58" → 57.5).
 * A missing name gives undefined, and those people go to the end in either direction.
 */
function sortValue(person: Person, sort: SortKey): number | string | undefined {
  switch (sort) {
    case 'birth':
      return person.birth.start
    case 'death':
      return person.death.start
    case 'surname':
      return person.surname
    case 'forename':
      return person.forename
    case 'age': {
      if (person.death.end <= person.birth.start) return undefined // death before birth: no real age
      const { min, max } = ageAtDeath(person.birth, person.death)
      return (min + max) / 2
    }
  }
}

function compareValues(a: number | string, b: number | string): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return collator.compare(String(a), String(b))
}

/**
 * A new array in the chosen order. Ties are broken by birth and then by name, always in the same
 * way, so the order never jumps around between two identical views.
 */
export function sortPeople(people: Person[], sort: SortKey, direction: SortDirection): Person[] {
  const sign = direction === 'asc' ? 1 : -1
  return [...people].sort((a, b) => {
    const va = sortValue(a, sort)
    const vb = sortValue(b, sort)
    if (va === undefined && vb !== undefined) return 1
    if (vb === undefined && va !== undefined) return -1
    if (va !== undefined && vb !== undefined) {
      const primary = compareValues(va, vb)
      if (primary !== 0) return sign * primary
    }
    return a.birth.start - b.birth.start || collator.compare(a.name, b.name) || a.uri.localeCompare(b.uri)
  })
}

/** Lower case, accents removed: "Adomnán" → "adomnan", so typing without fadas still finds people. */
export function foldText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/**
 * Does a person match the search box? Every word typed must appear somewhere in the name,
 * in any order: "eliz fitz" finds Elizabeth Fitzgerald.
 */
export function matchesName(person: Person, query: string): boolean {
  const words = foldText(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = foldText([person.name, person.forename, person.surname].filter(Boolean).join(' '))
  return words.every((word) => haystack.includes(word))
}

export function matchesGender(person: Person, gender: GenderFilter): boolean {
  return gender === 'all' || person.gender === gender
}

/** How many people of each gender, for the counts next to the filter buttons. */
export function countByGender(people: Person[]): Record<GenderFilter, number> {
  const counts = { all: people.length, female: 0, male: 0 }
  for (const person of people) if (person.gender) counts[person.gender]++
  return counts
}

/** Filter, then sort. */
export function applyListView(people: Person[], view: ListView): Person[] {
  const kept = people.filter((p) => matchesGender(p, view.gender) && matchesName(p, view.query))
  return sortPeople(kept, view.sort, view.direction)
}

/**
 * Reads the list settings from the page address (?sort=surname&dir=desc&gender=female&q=…&marks=gender),
 * so a filtered view can be shared like a range can. Anything unknown falls back to the default.
 */
export function listViewFromSearch(search: string): ListView {
  const params = new URLSearchParams(search)
  const sort = params.get('sort')
  const dir = params.get('dir')
  const gender = params.get('gender')
  return {
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : DEFAULT_VIEW.sort,
    direction: dir === 'asc' || dir === 'desc' ? dir : DEFAULT_VIEW.direction,
    gender: gender === 'female' || gender === 'male' ? gender : DEFAULT_VIEW.gender,
    query: params.get('q') ?? DEFAULT_VIEW.query,
    markGender: params.get('marks') === 'gender',
  }
}

/** The full address for a range plus list settings. Settings left at their default are left out. */
export function viewToSearch({ from, to }: YearRange, view: ListView): string {
  const params = new URLSearchParams({ from: String(from), to: String(to) })
  if (view.sort !== DEFAULT_VIEW.sort) params.set('sort', view.sort)
  if (view.direction !== DEFAULT_VIEW.direction) params.set('dir', view.direction)
  if (view.gender !== DEFAULT_VIEW.gender) params.set('gender', view.gender)
  if (view.query.trim()) params.set('q', view.query.trim())
  if (view.markGender) params.set('marks', 'gender')
  return `?${params.toString()}`
}
