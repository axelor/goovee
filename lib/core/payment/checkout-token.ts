import 'server-only';

import {randomUUID} from 'node:crypto';

/**
 * Minted when a checkout renders and carried by every payment button on it.
 * The payment row holds it under a unique constraint, so a double-click or a
 * repeated press after a refusal finds the same payment rather than opening a
 * second one.
 */
export function mintCheckoutToken(): string {
  return randomUUID();
}
