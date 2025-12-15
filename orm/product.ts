// ---- CORE IMPORTS ---- //
import {type Tenant, manager} from '@/lib/core/tenant';
import type {User, PortalWorkspace} from '@/types';
import {getPartnerId} from '@/utils';

export async function shouldHidePricesAndPurchase({
  user,
  workspace,
  tenantId,
}: {
  user: User | undefined;
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
}) {
  const {hidePriceForEmptyPricelist} = workspace.config || {};
  if (hidePriceForEmptyPricelist) {
    if (!user) return true;
    const client = await manager.getClient(tenantId);
    const mainPartner = await client.aOSPartner.findOne({
      where: {
        id: getPartnerId(user),
      },
      select: {
        salePartnerPriceList: {id: true},
      },
    });
    if (!mainPartner?.salePartnerPriceList?.id) return true;
  }
  return false;
}
