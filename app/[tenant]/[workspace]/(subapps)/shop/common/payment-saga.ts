// ---- CORE IMPORTS ---- //
import {SAGA_FAILURE_STATUS, SagaStepError} from '@/lib/core/saga';
import type {SagaDefinition} from '@/lib/core/saga';
import type {PaymentSagaContext} from '@/lib/core/payment/saga/types';
import {findWorkspace} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import {createOrder} from '@/subapps/shop/common/service';
import {getShopConfig} from '@/subapps/shop/common/orm/config';

/** Writes the created (or AOS-reported committed) order id onto the context data. */
async function persistOrderId(
  ctx: PaymentSagaContext,
  orderId: string,
): Promise<void> {
  const {client, paymentContext} = ctx;
  const data = {...paymentContext.data, id: orderId};

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
}

/**
 * Post-capture business tail for shop payments.
 *
 * createOrder routes to refund_required (never reconcile_required): the
 * customer paid for a NEW order, so if the ERP call fails they got nothing —
 * the admin reviews the refund queue. Caveat for that review: the AOS
 * /orders/order endpoint is not atomic, so before refunding the admin must
 * check the ERP for a partially created order chain. There is deliberately no
 * retry: the endpoint has no idempotency protection, so re-running an
 * ambiguous failure could create the order twice.
 *
 * The context data snapshots everything the step needs at creation time
 * (cart, workspaceURL, user) so the saga never depends on a live session.
 * The created order id is persisted as data.id: the validate action returns
 * it to the UI for the redirect, and the ERP admin can trace a context to
 * its order.
 */
export const shopPaymentSaga: SagaDefinition<PaymentSagaContext> = {
  steps: [
    {
      name: 'createOrder',
      onFailure: SAGA_FAILURE_STATUS.refundRequired,
      async execute(ctx) {
        const {client, config, paymentContext} = ctx;
        const {cart, workspaceURL, user} = paymentContext.data ?? {};

        if (!cart || !workspaceURL || !user) {
          throw new Error(
            'Missing cart, workspace or user snapshot in context data',
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

        const workspaceConfig = await getShopConfig(
          workspace.config.id,
          client,
        );
        if (!workspaceConfig) {
          throw new Error(`Shop config not found: ${workspaceURL}`);
        }

        let result;
        try {
          result = await createOrder({
            cart,
            workspace,
            workspaceConfig,
            user,
            client,
            config,
            paymentModeId: ctx.paymentModeId,
            paymentContextId: paymentContext.id,
          });
        } catch (err) {
          /* A mid-chain AOS failure that still committed the order carries
           * its id (and re-routes to the reconcile queue) — persist the id so
           * the admin can trace the context to the existing order. */
          if (err instanceof SagaStepError && err.entityId) {
            await persistOrderId(ctx, err.entityId);
          }
          throw err;
        }

        const orderId = result?.data;
        if (!orderId) {
          throw new Error('Order creation returned no order id');
        }

        await persistOrderId(ctx, String(orderId));
      },
    },
  ],
};
