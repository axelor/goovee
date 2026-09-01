import {notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';
import {findGooveeUserByEmail} from '@/orm/partner';
import {SUBAPP_CODES} from '@/constants';
import {getTranslation} from '@/locale/server';
import {DEFAULT_LOCALE} from '@/locale/contants';
import type {Client} from '@/goovee/.generated/client';
import {toWorkspaceURI} from '@/utils/workspace-url';
import {getPublicEnvironment} from '@/environment';
import {tenantConfigProvider} from '@/tenant/config-provider';

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

    const workspaceURL = invoice.portalWorkspace.url;
    const config = tenantConfigProvider.get(tenantId);
    const workspaceURI = toWorkspaceURI(
      workspaceURL,
      getPublicEnvironment(config).GOOVEE_PUBLIC_HOST,
    );
    const invoiceUrl = `${workspaceURI}/${SUBAPP_CODES.invoices}/${invoiceId}`;

    const tr = getTranslation.bind(null, {
      locale: user.localization?.code || DEFAULT_LOCALE,
      tenant: tenantId,
    });
    await notifyUser({
      userId: user.id,
      tenantId,
      client,
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
