// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {TenantConfig} from '@/tenant';
import type {PaymentContext, PaymentSource} from '../common/type';

/**
 * Context threaded through every payment saga step. Built by completePayment()
 * from the claimed payment context; `source` is absent only on corrupted
 * contexts (routed to reconcile_required). `entityId` = what the payment pays
 * for (invoice / sale order / registration id); absent at claim time when the
 * saga itself creates the entity — each definition validates its own payload.
 */
export type PaymentSagaContext = {
  tenantId: string;
  client: Client;
  config: TenantConfig;
  paymentContext: PaymentContext;
  source?: PaymentSource;
  entityId?: string;
  /** Paid amount — caller-provided (gateway-reported) or from context data. */
  amount?: string | number;
  paymentModeId?: string;
};
