// ---- CORE IMPORTS ---- //
import {SAGA_FAILURE_STATUS} from '@/lib/core/saga';
import type {SagaDefinition} from '@/lib/core/saga';
import type {PaymentSagaContext} from '@/lib/core/payment/saga/types';
import {findWorkspace} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import {registerParticipants} from '@/subapps/events/common/orm/registration';
import {createInvoice} from '@/subapps/events/common/service';
import {getParticipantsFromValues} from '@/subapps/events/common/utils/registration';

/**
 * Post-capture business tail for event registrations.
 *
 * registerParticipants routes to refund_required: it is the delivery step —
 * if it fails the customer paid and got nothing, so the payment lands in the
 * refund queue. The single ORM create rolls back clean, leaving no partial
 * registration behind.
 *
 * createInvoice routes to reconcile_required: the registration already
 * stands, so the money is rightfully kept and only the ERP bookkeeping is
 * incomplete. The ERP's "Create invoice" fix action completes it in-process
 * (guarded there by the one-invoice-per-registration check).
 *
 * The context data snapshots everything the steps need at creation time
 * (values, eventId, workspaceURL, currencyCode, optional user — guest
 * registration is allowed) so the saga never depends on a live session.
 * The created registration id is persisted as data.id: register() refetches
 * it for the notification/mail extras, and the ERP admin can trace a context
 * to its registration.
 */
export const eventsPaymentSaga: SagaDefinition<PaymentSagaContext> = {
  steps: [
    {
      name: 'registerParticipants',
      onFailure: SAGA_FAILURE_STATUS.refundRequired,
      async execute(ctx) {
        const {client, paymentContext} = ctx;
        const {values, eventId, workspaceURL} = paymentContext.data ?? {};

        if (!values || !eventId || !workspaceURL) {
          throw new Error(
            'Missing registration values, event or workspace snapshot in context data',
          );
        }

        const participants = getParticipantsFromValues(values);
        const registration = await registerParticipants({
          eventId,
          participants,
          workspaceURL,
          client,
        });

        if (!registration?.id) {
          throw new Error('Registration creation returned no id');
        }

        const data = {...paymentContext.data, id: String(registration.id)};
        const updated = await client.paymentContext.update({
          data: {
            id: paymentContext.id,
            version: paymentContext.version,
            data: Promise.resolve(data),
            updatedOn: new Date(),
          },
          select: {id: true, version: true},
        });

        paymentContext.version = updated.version;
        paymentContext.data = data;
      },
    },
    {
      name: 'createInvoice',
      onFailure: SAGA_FAILURE_STATUS.reconcileRequired,
      async execute(ctx) {
        const {client, config, paymentContext} = ctx;
        const {
          workspaceURL,
          user,
          currencyCode,
          id: registrationId,
        } = paymentContext.data ?? {};

        if (!registrationId || !workspaceURL) {
          throw new Error(
            'Missing registration id or workspace snapshot in context data',
          );
        }

        const workspace = await findWorkspace({
          url: workspaceURL,
          user,
          client,
        });

        if (!workspace) {
          throw new Error(`Workspace not found: ${workspaceURL}`);
        }

        const result = await createInvoice({
          workspace,
          config,
          registrationId,
          currencyCode,
          paymentModeId: ctx.paymentModeId,
        });

        if (result.error) {
          throw new Error(result.message);
        }
      },
    },
  ],
};
