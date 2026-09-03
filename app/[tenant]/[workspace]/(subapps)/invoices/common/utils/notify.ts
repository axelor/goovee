import {notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';
import {findGooveeUserByEmail} from '@/orm/partner';
import {SUBAPP_CODES} from '@/constants';
import {getTranslation} from '@/locale/server';
import {DEFAULT_LOCALE} from '@/locale/contants';
import type {Client} from '@/goovee/.generated/client';

export async function notifyInvoicePaymentSuccess({
  invoiceId,
  payer,
  client,
  tenantId,
}: {
  invoiceId: string;
  payer: string;
  client: Client;
  tenantId: string;
}): Promise<void> {
  try {
    const user = await findGooveeUserByEmail(payer, client);
    if (!user?.id) return;

    const invoice = await client.aOSInvoice.findOne({
      where: {id: invoiceId},
      select: {
        invoiceId: true,
        portalWorkspace: {url: true},
      },
    });

    if (!invoice?.portalWorkspace?.url) return;

    const tr = getTranslation.bind(null, {
      locale: user.localization?.code || DEFAULT_LOCALE,
      tenant: tenantId,
    });
    await notifyUser({
      userId: user.id,
      tenantId,
      /* This runs from a payment callback, which carries no proxy headers, so
       * the workspace is named from the invoice's own row. */
      workspaceURL: invoice.portalWorkspace.url,
      client,
      payload: {
        title: await tr(
          'Payment received for invoice {0}',
          String(invoice.invoiceId ?? invoiceId),
        ),
        link: `/${SUBAPP_CODES.invoices}/${invoiceId}`,
        tag: NotificationTag.invoicePayment(invoiceId),
      },
    });
  } catch (error) {
    console.error('[INVOICE] Failed to send payment notification', {error});
  }
}
