/**
 * Data sources: which collection a person's record comes from (supervisor, 2026-11-17: people often
 * narrow a search to one source, "we're only interested in the 1641 Depositions").
 *
 * In the knowledge graph each source is a named graph (handbook §8). The names below are the ones the
 * Knowledge Graph's own Advanced Search shows under "Select Datasource" (kg.virtualtreasury.ie, checked
 * 2026-11-17), so both sites use the same words.
 *
 * Each VOICES source also has an "-events-" graph, which lists the same people again as event
 * participants. Those are not separate sources, so they are not matched here.
 *
 * Counts measured 2026-11-17 (Siyan, console): of the people with both a birth and a death date, the
 * Dictionary of Irish Biography has 10,624, Staple Books 24, PCC Wills 11, Freemen 1, Chancery 1, and
 * the 1641 Depositions none (its 1,565 people have only event dates, not drawn yet). In 1500–1749,
 * 27 of 2,330 people come from more than one source.
 */

export type SourceId = 'dib' | 'chancery' | 'depositions' | 'freemen' | 'staple' | 'wills'

export interface Source {
  id: SourceId
  /** Full name, as in the Knowledge Graph's Advanced Search. */
  name: string
  /** Short name for the closed drop-down and the status line. */
  short: string
  /** Named graph, without the version suffix ("-v1", "-v2"). */
  graph: string
}

export const SOURCES: Source[] = [
  { id: 'dib', name: 'Dictionary of Irish Biography', short: 'Dictionary of Irish Biography', graph: 'DIB' },
  { id: 'chancery', name: 'National Archives of Ireland: Salved Chancery Pleadings', short: 'Salved Chancery Pleadings', graph: 'NAISC' },
  { id: 'depositions', name: 'Trinity College Dublin: 1641 Depositions', short: '1641 Depositions', graph: 'VOICES-1641' },
  {
    id: 'freemen',
    name: 'Dublin City Library and Archive: Roll of Freemen of Dublin (1575–1774)',
    short: 'Roll of Freemen of Dublin',
    graph: 'VOICES-freewomen',
  },
  {
    id: 'staple',
    name: 'Dublin City Library and Archive: Irish Statute Staple Books (1596–1687)',
    short: 'Irish Statute Staple Books',
    graph: 'VOICES-staple',
  },
  { id: 'wills', name: 'The National Archives (UK): PCC Will Registers (TNA PROB 11)', short: 'PCC Will Registers', graph: 'VOICES-Prob11' },
]

const GRAPH_BASE = 'https://kg.virtualtreasury.ie/graph/'

/**
 * Which source a named graph belongs to: ".../graph/VOICES-1641-v2" → 'depositions'.
 * Any version number is accepted; "-events-" graphs and unknown graphs give undefined.
 */
export function sourceOfGraph(graph: string | undefined): SourceId | undefined {
  if (!graph?.startsWith(GRAPH_BASE)) return undefined
  const match = /^(.+)-v\d+$/.exec(graph.slice(GRAPH_BASE.length))
  return match ? SOURCES.find((source) => source.graph === match[1])?.id : undefined
}

export function isSourceId(value: string | null): value is SourceId {
  return SOURCES.some((source) => source.id === value)
}
