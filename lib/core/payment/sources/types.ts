import type {z} from 'zod';
import type {JsonObject} from '@goovee/orm';

import type {Client} from '@/goovee/.generated/client';
import type {PaymentConfig} from '@/orm/workspace';
import type {Tenant} from '@/tenant';
import type {ActionResponse} from '@/types/action';
import type {Subject, SubjectOf} from '../domain/subject';
import type {Gateway, Money, PaymentSource} from '../domain/types';
import type {BillingDetails} from '../adapters/types';

/** What the source needs to remember between the button press and delivery. Stored as JSON. */
export type IntentSnapshot = JsonObject;

/**
 * A priced, authorised purchase: everything T1 writes onto the payment row.
 * Produced on the server from the client's `{source, subjectRef}` and nothing
 * else the client sent.
 */
export type PreparedIntent<Source extends PaymentSource = PaymentSource> = {
  money: Money;
  payer: string;
  subjectLabel: string;
  /** The workspace's online payment methods; decides which gateways may be offered and which ERP payment mode each maps to. */
  paymentOptions: PaymentConfig['paymentOptionSet'];
  /** The workspace and the app configuration the checkout ran under; the ERP builds its records from the latter. */
  workspace: {id: string; url: string; configId: string};
  /** The subject when it exists before delivery, such as the invoice being paid. */
  subject: SubjectOf<Source> | null;
  snapshot: IntentSnapshot;
  /** Where known; some providers ask for it. */
  billing?: BillingDetails;
};

export type DeliveryResult<Source extends PaymentSource = PaymentSource> =
  /** Null keeps the subject the payment was started with, such as the invoice being paid. */
  | {delivered: true; subject: SubjectOf<Source> | null}
  | {delivered: false; reason: string};

export type DeliveredPayment = {
  id: string;
  reference: string;
  money: Money;
  payer: string | null;
  workspaceId: string;
  /** The ERP payment mode the chosen gateway maps to, frozen at T1. */
  paymentModeId: string | null;
};

/** A captured payment as its confirmation reads it. */
export type NotifiedPayment = {
  id: string;
  reference: string;
  money: Money;
  payer: string | null;
  /** Frozen at T1: what the payment was for, in the payer's words ("Invoice INV-1"). */
  subjectLabel: string | null;
  /** The workspace the payment was made in, as its address. */
  workspaceUrl: string;
};

/**
 * One payment source: what it sells, how it prices it, and what goovee-local
 * work a capture unlocks. Adding a source is one handler and one registry
 * entry; nothing in the core knows what a source sells. A source's subjects
 * are only ever of the models it pays for.
 */
export interface PaymentSourceHandler<
  TIntent = unknown,
  Source extends PaymentSource = PaymentSource,
> {
  source: Source;

  /** The shape of the client's intent. Only references; the server prices. */
  intentSchema: z.ZodType<TIntent>;

  /**
   * Whether a gateway may only be offered when the workspace maps it to an ERP
   * payment mode. Sources whose registration has no fallback mode set this, so
   * the refusal happens before any money is taken.
   */
  requiresPaymentMode?: boolean;

  /**
   * The gateways this source may be paid through. Nothing outside the list is
   * offered, and a start naming one is refused, so a gateway added to the
   * registry reaches a source only when that source opts in. Asynchronous
   * gateways, which settle days after the buyer leaves, belong only to sources
   * whose payer can come back to the result.
   */
  gateways: readonly Gateway[];

  /** Authorises the caller for the subject and prices it. Runs before T1, outside any transaction. */
  prepare(args: {
    intent: TIntent;
    tenant: Tenant;
  }): ActionResponse<PreparedIntent<Source>>;

  /**
   * The goovee-local work a full capture unlocks, inside the settle
   * transaction: goovee-owned or ERP rows written through the client, never an
   * HTTP call. Undeliverable still commits the capture and is a human's to
   * decide.
   *
   * Settle runs on whichever leg saw the capture first: the payer's return,
   * the provider's webhook, or a task from the clock. So this must not read the
   * session, the cookies or the headers — on a webhook they are the
   * provider's, in a task there are none — and must take everything about the
   * payer from `payment` and `snapshot`. Text it writes, such as an
   * undeliverable reason, is for the ERP's operators: `t()` renders it in the
   * request's language on the return leg, and in the default locale on a
   * webhook or in a task, so keep it plain rather than per-payer.
   */
  deliver(args: {
    payment: DeliveredPayment;
    snapshot: IntentSnapshot;
    txClient: Client;
    tenant: Tenant;
  }): Promise<DeliveryResult<Source>>;

  /**
   * Tells the payer, and whoever else the source names, that the payment was
   * captured and delivered. Runs as a `notify` task, outside any transaction and
   * often outside any request — from the task clock — so it must not read the
   * session, the cookies or the headers, or use a formatter that does. `t()`
   * does not throw there: tasks run in a background scope, where it renders the
   * portal's default locale. A payer's own language is not in that scope, so
   * translate what the payer reads with `getTranslation` given their locale and
   * the tenant. Mail and push are handed off and not waited on, so their
   * delivery never fails or holds the task; throwing runs the whole
   * notification again later.
   */
  notify?(args: {
    payment: NotifiedPayment;
    subject: Subject | null;
    snapshot: IntentSnapshot;
    tenant: Tenant;
  }): Promise<void>;

  /** Where the result page sends the payer next, as a workspace sub-path. */
  onwardLink(args: {
    subject: Subject | null;
    snapshot: IntentSnapshot;
  }): `/${string}` | null;
}
