import axios from 'axios';

import type {ExplainFailure} from './script';

/**
 * Turns an unanswered HTTP request into the one line worth reading. Supplied by
 * the scripts that call a back end, so the runner itself needs to know nothing
 * about HTTP.
 */
export const explainHttpFailure: ExplainFailure = error => {
  if (axios.isAxiosError(error) && !error.response) {
    const target = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
    return `Could not reach ${target} (${error.code ?? 'request failed'}). Is the back end running?`;
  }

  return undefined;
};
