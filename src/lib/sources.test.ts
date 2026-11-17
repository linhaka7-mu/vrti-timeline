import { describe, expect, it } from 'vitest'
import { isSourceId, sourceOfGraph } from './sources'

describe('sourceOfGraph', () => {
  it('maps each named graph to its source, whatever the version', () => {
    expect(sourceOfGraph('https://kg.virtualtreasury.ie/graph/DIB-v1')).toBe('dib')
    expect(sourceOfGraph('https://kg.virtualtreasury.ie/graph/NAISC-v1')).toBe('chancery')
    expect(sourceOfGraph('https://kg.virtualtreasury.ie/graph/VOICES-1641-v2')).toBe('depositions')
    expect(sourceOfGraph('https://kg.virtualtreasury.ie/graph/VOICES-freewomen-v3')).toBe('freemen')
    expect(sourceOfGraph('https://kg.virtualtreasury.ie/graph/VOICES-staple-v2')).toBe('staple')
    expect(sourceOfGraph('https://kg.virtualtreasury.ie/graph/VOICES-Prob11-v2')).toBe('wills')
  })
  it('ignores the events graphs, which repeat the same people', () => {
    expect(sourceOfGraph('https://kg.virtualtreasury.ie/graph/VOICES-1641-events-v2')).toBeUndefined()
    expect(sourceOfGraph('https://kg.virtualtreasury.ie/graph/VOICES-staple-events-v1')).toBeUndefined()
  })
  it('ignores unknown graphs and missing values', () => {
    expect(sourceOfGraph('https://kg.virtualtreasury.ie/graph/present-day-places-v1')).toBeUndefined()
    expect(sourceOfGraph(undefined)).toBeUndefined()
  })
})

describe('isSourceId', () => {
  it('accepts only known ids', () => {
    expect(isSourceId('depositions')).toBe(true)
    expect(isSourceId('dictionary')).toBe(false)
    expect(isSourceId(null)).toBe(false)
  })
})
