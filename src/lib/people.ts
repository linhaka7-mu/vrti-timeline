import { padYear, toInterval, type Interval } from './dates'
import { runSelect, type Binding } from './sparql'

/** A person who can be drawn as a lifetime bar: they have both a birth and a death time-span. */
export interface Person {
  uri: string
  name: string
  birth: Interval
  death: Interval
  /** Things in the data that do not add up. The timeline shows them instead of hiding them (handbook §3.10–3.11). */
  issues: string[]
}

export interface PeopleResult {
  people: Person[]
  /** Rows dropped because a stored date could not be read. Reported to the user, never dropped silently. */
  unreadable: number
}

/**
 * People with a birth AND a death time-span who were alive at some point in [from, to].
 *
 * Notes on the data (handbook §3):
 * - Births, deaths and archival events use three different classes and predicates (§3.7).
 * - Every time-span stores four bounds, but P82a always equals P81a and P81b always equals P82b,
 *   so P82a (earliest start) and P82b (latest end) carry all the information (§3.1).
 * - "Alive in the range" means overlap: born before the range ends and died after it starts (§4.3).
 *   The old timeline asked "born inside the range" instead.
 * - DISTINCT matters: the same person is typed in several named graphs (§8).
 * - Names: 99% of these people have no rdfs:label (2,303 of 2,330 rows for 1500–1749, checked
 *   2026-10-19). The name lives in separate appellation objects linked by P1_is_identified_by,
 *   typed vrti:Surname / vrti:Forename, each with its own rdfs:label.
 */
export function peopleAliveQuery(from: number, to: number): string {
  return `PREFIX crm: <http://erlangen-crm.org/current/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX vrti: <https://www.w3id.org/virtual-treasury/ontology#>
SELECT DISTINCT ?person ?label ?forename ?surname ?birthStart ?birthEnd ?deathStart ?deathEnd WHERE {
  ?birth a crm:E67_Birth ;
         crm:P98_brought_into_life ?person ;
         crm:P4_has_time-span ?birthSpan .
  ?birthSpan crm:P82a_begin_of_the_begin ?birthStart ;
             crm:P82b_end_of_the_end ?birthEnd .
  ?death a crm:E69_Death ;
         crm:P93_took_out_of_existence ?person ;
         crm:P4_has_time-span ?deathSpan .
  ?deathSpan crm:P82a_begin_of_the_begin ?deathStart ;
             crm:P82b_end_of_the_end ?deathEnd .
  FILTER(?birthStart <= "${padYear(to)}-12-31"^^xsd:date && ?deathEnd >= "${padYear(from)}-01-01"^^xsd:date)
  OPTIONAL { ?person rdfs:label ?label }
  OPTIONAL { ?person crm:P1_is_identified_by ?surnameNode .
             ?surnameNode crm:P2_has_type vrti:Surname ; rdfs:label ?surname }
  OPTIONAL { ?person crm:P1_is_identified_by ?forenameNode .
             ?forenameNode crm:P2_has_type vrti:Forename ; rdfs:label ?forename }
}`
}

/**
 * The name shown on the timeline, in reading order ("Samuel Molyneux Madden").
 * Preference: forename + surname → rdfs:label → the URI.
 * Single-name Irish people have the same value in both fields ("Adomnán Adomnán", handbook §3.11),
 * so a repeated name is shown once.
 */
export function displayName(parts: { forename?: string; surname?: string; label?: string; uri: string }): string {
  const { forename, surname, label, uri } = parts
  if (forename && surname) return forename === surname ? forename : `${forename} ${surname}`
  if (label) return label
  if (forename || surname) return (forename ?? surname)!
  return nameFromUri(uri)
}

/**
 * Last-resort name when nothing else is recorded, taken from the URI:
 * ".../person/Ley_Alison_c16/v1m1g2q" → "Ley Alison" (the data's own surname-first order).
 */
export function nameFromUri(uri: string): string {
  const match = /\/person\/([^/]+)/.exec(uri)
  if (!match) return uri
  return decodeURIComponent(match[1])
    .replace(/_c\d+$/, '')
    .replace(/_/g, ' ')
}

/**
 * Turns result rows into one Person per URI.
 * One person can come back as several rows (two labels, two birth records…), so rows are grouped.
 */
export function toPeople(rows: Binding[]): PeopleResult {
  interface Group {
    uri: string
    label?: string
    forename?: string
    surname?: string
    births: Map<string, Interval>
    deaths: Map<string, Interval>
  }
  const groups = new Map<string, Group>()
  let unreadable = 0

  for (const row of rows) {
    const uri = row.person?.value
    if (!uri) continue
    const birth = toInterval(row.birthStart?.value ?? '', row.birthEnd?.value ?? '')
    const death = toInterval(row.deathStart?.value ?? '', row.deathEnd?.value ?? '')
    if (!birth || !death) {
      unreadable++
      continue
    }
    let group = groups.get(uri)
    if (!group) {
      group = { uri, births: new Map(), deaths: new Map() }
      groups.set(uri, group)
    }
    if (!group.label && row.label?.value) group.label = row.label.value
    if (!group.forename && row.forename?.value) group.forename = row.forename.value
    if (!group.surname && row.surname?.value) group.surname = row.surname.value
    group.births.set(`${birth.raw.begin}|${birth.raw.end}`, birth)
    group.deaths.set(`${death.raw.begin}|${death.raw.end}`, death)
  }

  const people: Person[] = []
  for (const group of groups.values()) {
    const births = [...group.births.values()].sort((a, b) => a.start - b.start)
    const deaths = [...group.deaths.values()].sort((a, b) => a.start - b.start)
    const issues: string[] = []
    if (births.length > 1) issues.push(`${births.length} birth records`)
    if (deaths.length > 1) issues.push(`${deaths.length} death records`)
    const birth = births[0]
    const death = deaths[0]
    if (death.end <= birth.start) issues.push('death recorded before birth')
    people.push({ uri: group.uri, name: displayName(group), birth, death, issues })
  }

  people.sort((a, b) => a.birth.start - b.birth.start || a.name.localeCompare(b.name))
  return { people, unreadable }
}

export async function fetchPeopleAlive(from: number, to: number, signal?: AbortSignal): Promise<PeopleResult> {
  const rows = await runSelect(peopleAliveQuery(from, to), signal)
  return toPeople(rows)
}
