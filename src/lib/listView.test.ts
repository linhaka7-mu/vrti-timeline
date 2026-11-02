import { describe, expect, it } from 'vitest'
import { toInterval } from './dates'
import {
  applyListView,
  countByGender,
  DEFAULT_VIEW,
  describeOrder,
  listViewFromSearch,
  matchesName,
  sortPeople,
  viewToSearch,
  type ListView,
} from './listView'
import type { Person } from './people'

/** A test person. Dates are [first day, last day]; a whole year means "only the year is known". */
function person(
  id: string,
  names: { forename?: string; surname?: string },
  birth: [string, string],
  death: [string, string],
  gender?: 'female' | 'male',
): Person {
  const name = [names.forename, names.surname].filter(Boolean).join(' ') || id
  return {
    uri: `https://kg.virtualtreasury.ie/person/${id}`,
    name,
    ...names,
    gender,
    birth: toInterval(...birth)!,
    death: toInterval(...death)!,
    issues: [],
  }
}

const elizabeth = person('ef', { forename: 'Elizabeth', surname: 'Fitzgerald' }, ['1580-01-01', '1580-12-31'], ['1645-10-26', '1645-10-26'], 'female')
const adomnan = person('ad', { forename: 'Adomnán', surname: 'Adomnán' }, ['0624-01-01', '0624-12-31'], ['0704-09-23', '0704-09-23'], 'male')
const nugent = person('cn', { forename: 'Christopher', surname: 'Nugent' }, ['1544-01-01', '1544-12-31'], ['1602-01-01', '1602-12-31'], 'male')
const obrien = person('ob', { forename: 'Muirchertach', surname: 'Ó Briain' }, ['1544-03-02', '1544-03-02'], ['1551-01-01', '1551-01-01'], 'male')
const nameless = person('zz', {}, ['1500-01-01', '1500-01-01'], ['1590-01-01', '1590-01-01'])
const everyone = [elizabeth, adomnan, nugent, obrien, nameless]
const ids = (people: Person[]) => people.map((p) => p.uri.split('/').pop())

describe('sortPeople', () => {
  it('sorts by birth, earliest first, ties broken by name (the order the timeline always had)', () => {
    // Nugent (born some time in 1544) can have been born as early as 1 January 1544,
    // earlier than Ó Briain (2 March 1544), so Nugent comes first.
    expect(ids(sortPeople(everyone, 'birth', 'asc'))).toEqual(['ad', 'zz', 'cn', 'ob', 'ef'])
  })
  it('reverses for latest first', () => {
    expect(ids(sortPeople(everyone, 'birth', 'desc'))).toEqual(['ef', 'ob', 'cn', 'zz', 'ad'])
  })
  it('sorts surnames ignoring accents, and puts people without one last in both directions', () => {
    expect(ids(sortPeople(everyone, 'surname', 'asc'))).toEqual(['ad', 'ef', 'cn', 'ob', 'zz'])
    expect(ids(sortPeople(everyone, 'surname', 'desc'))).toEqual(['ob', 'cn', 'ef', 'ad', 'zz'])
  })
  it('sorts by age at death, using the middle of an uncertain age', () => {
    // Ó Briain 6, Nugent 57–58, Elizabeth 64–65, Adomnán 79–80, nameless 90
    expect(ids(sortPeople(everyone, 'age', 'desc'))).toEqual(['zz', 'ad', 'ef', 'cn', 'ob'])
  })
  it('does not change the array it was given', () => {
    const copy = [...everyone]
    sortPeople(everyone, 'surname', 'desc')
    expect(everyone).toEqual(copy)
  })
})

describe('matchesName', () => {
  it('finds a name without typing the fada', () => {
    expect(matchesName(adomnan, 'adomnan')).toBe(true)
    expect(matchesName(obrien, 'o briain')).toBe(true)
  })
  it('needs every word, in any order', () => {
    expect(matchesName(elizabeth, 'fitz eliz')).toBe(true)
    expect(matchesName(elizabeth, 'fitz mary')).toBe(false)
  })
  it('matches everyone when the box is empty or only spaces', () => {
    expect(matchesName(nameless, '   ')).toBe(true)
  })
})

describe('applyListView', () => {
  it('filters by gender and name, then sorts', () => {
    const view: ListView = { ...DEFAULT_VIEW, gender: 'male', query: 'n', sort: 'surname' }
    expect(ids(applyListView(everyone, view))).toEqual(['ad', 'cn', 'ob'])
  })
  it('a person without a recorded gender only appears under "all"', () => {
    expect(ids(applyListView(everyone, { ...DEFAULT_VIEW, gender: 'female' }))).toEqual(['ef'])
  })
})

describe('countByGender', () => {
  it('counts each gender and the total', () => {
    expect(countByGender(everyone)).toEqual({ all: 5, female: 1, male: 3 })
  })
})

describe('describeOrder', () => {
  it('says the order in words', () => {
    expect(describeOrder(DEFAULT_VIEW)).toBe('Sorted by year of birth, earliest first')
    expect(describeOrder({ ...DEFAULT_VIEW, sort: 'age', direction: 'desc' })).toBe('Sorted by age at death, oldest first')
  })
})

describe('address', () => {
  it('leaves defaults out, so plain links look as before', () => {
    expect(viewToSearch({ from: 1500, to: 1749 }, DEFAULT_VIEW)).toBe('?from=1500&to=1749')
  })
  it('round-trips every setting, including accented searches', () => {
    const view: ListView = { sort: 'surname', direction: 'desc', gender: 'female', query: 'Ní Bhriain', markGender: false }
    const search = viewToSearch({ from: 1500, to: 1749 }, view)
    expect(listViewFromSearch(search)).toEqual(view)
  })
  it('ignores values it does not know', () => {
    expect(listViewFromSearch('?sort=height&dir=up&gender=x&marks=yes')).toEqual(DEFAULT_VIEW)
  })
  it('has "Mark gender" on by default and writes switching it off as marks=none', () => {
    expect(DEFAULT_VIEW.markGender).toBe(true)
    expect(listViewFromSearch('?from=1500&to=1749').markGender).toBe(true)
    const off = { ...DEFAULT_VIEW, markGender: false }
    expect(viewToSearch({ from: 1500, to: 1749 }, off)).toBe('?from=1500&to=1749&marks=none')
    expect(listViewFromSearch('?from=1500&to=1749&marks=none')).toEqual(off)
  })
  it('still opens older marks=gender links with "Mark gender" on', () => {
    expect(listViewFromSearch('?from=1500&to=1749&marks=gender').markGender).toBe(true)
  })
})
