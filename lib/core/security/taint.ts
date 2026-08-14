import {experimental_taintUniqueValue} from 'react';

/* React keys its taint registry by the value, so marking a secret twice only
 * bumps a counter — but it also registers a `FinalizationRegistry` cell every
 * call, and that does not dedupe. The lifetime is `process`, which is never
 * collected, so each repeat retains another cell for the life of the server.
 * Marking once is enough, and holding the value here retains nothing new:
 * React's own registry is already keyed by it. */
const marked = new Set<string>();

export function taintSecret(message: string, value: string | undefined): void {
  if (!value || marked.has(value)) {
    return;
  }

  marked.add(value);

  /* The seed and geocode scripts run outside Next, where `react` exports no
   * taint API and there is no Client Component to leak into. */
  if (typeof experimental_taintUniqueValue === 'function') {
    experimental_taintUniqueValue(message, process, value);
  }
}
