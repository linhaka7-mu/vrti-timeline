/**
 * Talks to the public VRTI SPARQL endpoint straight from the browser.
 * No backend: the endpoint allows cross-origin requests (tested 2026-10-05, handbook §8).
 */

export const ENDPOINT = 'https://virtuoso.virtualtreasury.ie/sparql/'

/** One cell of a SPARQL JSON result, e.g. { type: "literal", value: "1544-01-01" }. */
export interface Term {
  type: string
  value: string
  datatype?: string
  'xml:lang'?: string
}

/** One result row: variable name → value. Variables left unbound by OPTIONAL are absent. */
export type Binding = Record<string, Term | undefined>

export class SparqlError extends Error {}

/**
 * Runs a SELECT query and returns its rows.
 * `signal` lets React Query cancel a request that is no longer needed
 * (for example when the slider has moved on before the answer arrives).
 */
export async function runSelect(query: string, signal?: AbortSignal): Promise<Binding[]> {
  const url = `${ENDPOINT}?query=${encodeURIComponent(query)}`
  let response: Response
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/sparql-results+json' },
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new SparqlError('Could not reach the VRTI data service. Check your connection and try again.')
  }
  if (!response.ok) {
    throw new SparqlError(`The VRTI data service answered with an error (HTTP ${response.status}).`)
  }
  const json = (await response.json()) as { results: { bindings: Binding[] } }
  return json.results.bindings
}
