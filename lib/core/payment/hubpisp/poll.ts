import {PaymentOption} from '@/types';

// ---- CORE IMPORTS ---- //
import {CONTEXT_STATUS, findPaymentContext} from '../common/orm';
import {fetchPaymentRequestStatus} from './paymentRequest';
import {HUBPISP_LOCAL_INSTRUMENT} from './constants';
import type {HubPispLocalInstrument} from './constants';
import {applyTransactionStatus} from './process';

// Tracks active payment request polls to prevent duplicate sessions.
const activePolls = new Set<string>();

// Polling intervals in milliseconds
const POLL_INTERVAL_INST = 10_000; // 10s for SCTInst (completes in ~10s)
const POLL_INTERVAL_SCT = 30_000; // 30s for SCT (can take up to 1 business day)

// Max polling duration in milliseconds
const MAX_POLL_DURATION_INST = 2 * 60 * 1000; // 2 minutes for SCTInst
const MAX_POLL_DURATION_SCT = 24 * 60 * 60 * 1000; // 24 hours for SCT

function getPollConfig(localInstrument?: HubPispLocalInstrument): {
  interval: number;
  maxDuration: number;
} {
  if (localInstrument === HUBPISP_LOCAL_INSTRUMENT.INST) {
    return {interval: POLL_INTERVAL_INST, maxDuration: MAX_POLL_DURATION_INST};
  }
  return {interval: POLL_INTERVAL_SCT, maxDuration: MAX_POLL_DURATION_SCT};
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Polls the HUB PISP payment request status until a terminal state is reached.
 * Designed to be called fire-and-forget from the webhook handler.
 *
 * For SCTInst: polls every 10s for up to 2 minutes.
 * For SCT: polls every 30s for up to 24 hours.
 */
export async function pollPaymentRequestStatus({
  paymentRequestResourceId,
  contextId,
  tenantId,
  localInstrument,
}: {
  paymentRequestResourceId: string;
  contextId: string;
  tenantId: string;
  localInstrument?: HubPispLocalInstrument;
}): Promise<void> {
  if (activePolls.has(paymentRequestResourceId)) {
    console.log('[HUBPISP][POLL] Poll already active, skipping', {
      paymentRequestResourceId,
      contextId,
    });
    return;
  }

  activePolls.add(paymentRequestResourceId);

  const {interval, maxDuration} = getPollConfig(localInstrument);
  const deadline = Date.now() + maxDuration;

  console.log('[HUBPISP][POLL] Starting polling', {
    paymentRequestResourceId,
    contextId,
    localInstrument,
    interval,
    maxDuration,
  });

  try {
    while (Date.now() < deadline) {
      await sleep(interval);

      // Re-fetch context to check if it was already processed (e.g. by a concurrent webhook)
      const paymentContext = await findPaymentContext({
        id: contextId,
        tenantId,
        mode: PaymentOption.hubpisp,
        ignoreExpiration: true,
      });

      if (!paymentContext) {
        console.warn(
          '[HUBPISP][POLL] Payment context not found, stopping poll',
          {
            contextId,
          },
        );
        return;
      }

      if (
        paymentContext.status === CONTEXT_STATUS.processed ||
        paymentContext.status === CONTEXT_STATUS.failed ||
        paymentContext.status === CONTEXT_STATUS.cancelled ||
        paymentContext.status === CONTEXT_STATUS.expired
      ) {
        console.log(
          '[HUBPISP][POLL] Context in terminal state, stopping poll',
          {
            contextId,
            status: paymentContext.status,
          },
        );
        return;
      }

      let transactionStatus: string | undefined;
      let statusReasonInformation: string | undefined;

      try {
        const paymentRequest = await fetchPaymentRequestStatus(
          paymentRequestResourceId,
        );
        transactionStatus =
          paymentRequest?.creditTransferTransaction?.[0]?.transactionStatus ||
          paymentRequest?.transactionStatus;
        statusReasonInformation = (paymentRequest
          ?.creditTransferTransaction?.[0]?.statusReasonInformation ||
          paymentRequest?.statusReasonInformation) as string | undefined;
      } catch (err) {
        console.error(
          '[HUBPISP][POLL] Failed to fetch payment request status',
          {
            paymentRequestResourceId,
            error: (err as Error).message,
          },
        );
        // Non-fatal: continue polling on transient errors
        continue;
      }

      if (!transactionStatus) {
        console.warn('[HUBPISP][POLL] Missing transactionStatus, retrying', {
          paymentRequestResourceId,
        });
        continue;
      }

      console.log('[HUBPISP][POLL] Transaction status', {
        contextId,
        transactionStatus,
      });

      const isTerminal = await applyTransactionStatus({
        paymentContext,
        transactionStatus,
        statusReasonInformation,
        tenantId,
      });

      if (isTerminal) return;

      // Non-terminal status, keep polling
      console.log('[HUBPISP][POLL] Non-terminal status, continuing poll', {
        contextId,
        transactionStatus,
      });
    }

    console.warn(
      '[HUBPISP][POLL] Polling deadline reached without terminal status',
      {contextId, paymentRequestResourceId},
    );
  } finally {
    activePolls.delete(paymentRequestResourceId);
  }
}
