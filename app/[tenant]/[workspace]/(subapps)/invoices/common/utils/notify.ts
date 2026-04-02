import {manager} from '@/tenant';
import {notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';
import {findGooveeUserByEmail} from '@/orm/partner';
import {SUBAPP_CODES} from '@/constants';
import {getTranslation} from '@/locale/server';
import {DEFAULT_LOCALE} from '@/locale/contants';

export async function notifyInvoicePaymentSuccess({
  invoiceId,
  payer,
  tenantId,
}: {
  invoiceId: string | number;
  payer: string;
  tenantId: string;
}): Promise<void> {
  try {
    const user = await findGooveeUserByEmail(payer, tenantId);
    if (!user?.id) return;

    const client = await manager.getClient(tenantId);
    if (!client) return;

    const invoice = await client.aOSInvoice.findOne({
      where: {id: invoiceId},
      select: {
        invoiceId: true,
        portalWorkspace: {url: true},
      },
    });

    if (!invoice?.portalWorkspace?.url) return;

    const workspaceURL = invoice.portalWorkspace.url;
    const workspaceURI = new URL(workspaceURL).pathname;
    const invoiceUrl = `${workspaceURI}/${SUBAPP_CODES.invoices}/${invoiceId}`;

    const tr = getTranslation.bind(null, {
      locale: user.localization?.code || DEFAULT_LOCALE,
      tenant: tenantId,
    });
    notifyUser({
      userId: user.id,
      tenantId,
      workspaceURL,
      payload: {
        title: await tr(
          'Payment received for invoice {0}',
          String(invoice.invoiceId ?? invoiceId),
        ),
        url: invoiceUrl,
        tag: NotificationTag.invoicePayment(invoiceId),
      },
    });
  } catch (error) {
    console.error('[INVOICE] Failed to send payment notification', {error});
  }
}
