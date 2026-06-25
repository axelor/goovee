import 'server-only';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {CURRENT_PATH_HEADER} from '@/proxy';

/**
 * The path (with query string) of the page currently being rendered, captured
 * by the proxy. Used as the post-login callback so a denied guest returns to
 * exactly where they were, search params preserved. Empty when the proxy did
 * not run for the request.
 */
export async function getCurrentPath(): Promise<string> {
  return (await headers()).get(CURRENT_PATH_HEADER) ?? '';
}
