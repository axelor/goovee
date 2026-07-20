/* The error the pricing core throws — at the same point the mirrored AOS Java
 * raises an `AxelorException`. Callers decide their own degradation policy. */

import type {PriceComputationErrorCode} from './types';

export class PriceComputationError extends Error {
  constructor(
    public readonly code: PriceComputationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PriceComputationError';
  }
}
