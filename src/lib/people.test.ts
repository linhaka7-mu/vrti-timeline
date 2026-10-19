import { describe, expect, it } from 'vitest'
import { displayName, nameFromUri, peopleAliveQuery, toPeople } from './people'
import type { Binding } from './sparql'

const lit = (value: string) => ({ type: 'literal', value })
const uri = (value: string) => ({ type: 'uri', value })

function row(
  person: string,
  b: [string, string],
  d: [string, string],
  label?: string,
  names?: { forename: string; surname: string },
): Binding {
  return {
    person: uri(person),
    ...(label ? { label: lit(label) } : {}),
    ...(names ? { forename: lit(names.forename), surname: lit(names.surname) } : {}),
    birthStart: lit(b[0]),
    birthEnd: lit(b[1]),
    deathStart: lit(d[0]),
    deathEnd: lit(d[1]),
  }
}

const NUGENT = 'https://kg.virtualtreasury.ie/person/Nugent_Christopher_c16/abc'
const ART = 'https://kg.virtualtreasury.ie/person/MacMurrough_Art_c15/def'

describe('peopleAliveQuery', () => {
  it('asks for overlap with the range, with zero-padded years', () => {
    const q = peopleAliveQuery(400, 1499)
    expect(q).toContain('?birthStart <= "1499-12-31"^^xsd:date')
    expect(q).toContain('?deathEnd >= "0400-01-01"^^xsd:date')
    expect(q).toContain('SELECT DISTINCT')
  })
})

describe('nameFromUri', () => {
  it('drops the century tag and keeps the data order', () => {
    expect(nameFromUri('https://kg.virtualtreasury.ie/person/Ley_Alison_c16/v1m1g2q')).toBe('Ley Alison')
  })
})

describe('displayName', () => {
  const u = 'https://kg.virtualtreasury.ie/person/Madden_Samuel-Molyneux_c18/v1qg75j'
  it('puts the forename first (as found for Samuel Molyneux Madden on 2026-10-19)', () => {
    expect(displayName({ uri: u, forename: 'Samuel Molyneux', surname: 'Madden' })).toBe('Samuel Molyneux Madden')
  })
  it('shows a single Irish name once', () => {
    expect(displayName({ uri: u, forename: 'Adomnán', surname: 'Adomnán' })).toBe('Adomnán')
  })
  it('prefers the name parts over rdfs:label, and the label over the URI', () => {
    expect(displayName({ uri: u, forename: 'Henry', surname: 'Jones', label: 'Jones Henry' })).toBe('Henry Jones')
    expect(displayName({ uri: u, label: 'Henry Jones' })).toBe('Henry Jones')
    expect(displayName({ uri: u })).toBe('Madden Samuel-Molyneux')
  })
})

describe('toPeople', () => {
  it('builds the name from forename and surname', () => {
    const { people } = toPeople([
      row(NUGENT, ['1544-01-01', '1544-12-31'], ['1602-01-01', '1602-12-31'], undefined, { forename: 'Christopher', surname: 'Nugent' }),
    ])
    expect(people[0].name).toBe('Christopher Nugent')
  })

  it('merges duplicate rows (several labels) into one person', () => {
    const rows = [
      row(NUGENT, ['1544-01-01', '1544-12-31'], ['1602-01-01', '1602-12-31'], 'Christopher Nugent'),
      row(NUGENT, ['1544-01-01', '1544-12-31'], ['1602-01-01', '1602-12-31'], 'Críostóir Nuinseann'),
    ]
    const { people } = toPeople(rows)
    expect(people).toHaveLength(1)
    expect(people[0].name).toBe('Christopher Nugent')
    expect(people[0].birth.precision).toBe('year')
    expect(people[0].issues).toEqual([])
  })

  it('falls back to a name from the URI when there is no label', () => {
    const { people } = toPeople([row(NUGENT, ['1544-01-01', '1544-12-31'], ['1602-01-01', '1602-12-31'])])
    expect(people[0].name).toBe('Nugent Christopher')
  })

  it('flags a death before the birth instead of hiding it (Art MacMurrough)', () => {
    const { people } = toPeople([row(ART, ['1480-01-01', '1480-12-31'], ['1362-07-31', '1362-07-31'])])
    expect(people[0].issues).toContain('death recorded before birth')
  })

  it('flags a second birth record and draws the earlier one', () => {
    const rows = [
      row(ART, ['1580-01-01', '1580-12-31'], ['1645-10-26', '1645-10-26']),
      row(ART, ['1590-01-01', '1590-12-31'], ['1645-10-26', '1645-10-26']),
    ]
    const { people } = toPeople(rows)
    expect(people[0].issues).toContain('2 birth records')
    expect(people[0].birth.raw.begin).toBe('1580-01-01')
  })

  it('counts unreadable dates rather than dropping them silently', () => {
    const { people, unreadable } = toPeople([row(NUGENT, ['17/01/1683', '17/01/1683'], ['1700-01-01', '1700-01-01'])])
    expect(people).toHaveLength(0)
    expect(unreadable).toBe(1)
  })

  it('sorts by birth', () => {
    const rows = [
      row(NUGENT, ['1544-01-01', '1544-12-31'], ['1602-01-01', '1602-12-31']),
      row(ART, ['1480-01-01', '1480-12-31'], ['1530-01-01', '1530-12-31']),
    ]
    expect(toPeople(rows).people.map((p) => p.uri)).toEqual([ART, NUGENT])
  })
})
