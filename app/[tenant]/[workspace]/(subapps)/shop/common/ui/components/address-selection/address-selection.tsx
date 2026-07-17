'use client';

import React, {useCallback, useEffect, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Button, Loader} from '@/ui/components';
import {ADDRESS_TYPE} from '@/constants';
import type {PartnerAddress} from '@/types';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {
  findAddress,
  fetchDeliveryAddresses,
  fetchInvoicingAddresses,
  findDefaultDelivery,
  findDefaultInvoicing,
} from '@/subapps/shop/common/actions/address';

export function AddressSelection({
  callbackURL,
  title,
}: {
  callbackURL?: string;
  title?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [invoicingAddress, setInvoicingAddress] =
    useState<PartnerAddress | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<PartnerAddress | null>(
    null,
  );

  const {cart, updateAddress} = useCart();
  const {workspaceURI, workspaceURL} = useWorkspace();

  const {
    invoicingAddress: cartInvoicingAddress,
    deliveryAddress: cartDeliveryAddress,
  } = cart || {};

  const resolveFromCartAddresses = useCallback(async () => {
    setLoading(true);

    const [delivery, invoicing] = await Promise.all([
      cartDeliveryAddress
        ? findAddress({id: cartDeliveryAddress, workspaceURL})
        : null,
      cartInvoicingAddress
        ? findAddress({id: cartInvoicingAddress, workspaceURL})
        : null,
    ]);
    if (delivery) setDeliveryAddress(delivery as unknown as PartnerAddress);
    if (invoicing) setInvoicingAddress(invoicing as unknown as PartnerAddress);
    setLoading(false);
  }, [cartDeliveryAddress, cartInvoicingAddress, workspaceURL]);

  const resolveDefaultAddresses = useCallback(async () => {
    setLoading(true);

    const getDeliveryAddress = async (): Promise<PartnerAddress | null> => {
      const def = await findDefaultDelivery({workspaceURL});
      if (def) return def as unknown as PartnerAddress;
      const addresses = await fetchDeliveryAddresses({workspaceURL});
      return (addresses?.[0] ?? null) as unknown as PartnerAddress | null;
    };

    const getInvoicingAddress = async (): Promise<PartnerAddress | null> => {
      const def = await findDefaultInvoicing({workspaceURL});
      if (def) return def as unknown as PartnerAddress;
      const addresses = await fetchInvoicingAddresses({workspaceURL});
      return (addresses?.[0] ?? null) as unknown as PartnerAddress | null;
    };

    const [deliveryResult, invoicingResult] = await Promise.allSettled([
      getDeliveryAddress(),
      getInvoicingAddress(),
    ]);

    const delivery =
      deliveryResult.status === 'fulfilled' ? deliveryResult.value : null;
    const invoicing =
      invoicingResult.status === 'fulfilled' ? invoicingResult.value : null;

    if (delivery) {
      setDeliveryAddress(delivery);
      updateAddress({addressType: ADDRESS_TYPE.delivery, address: delivery.id});
    }

    if (invoicing) {
      setInvoicingAddress(invoicing);
      updateAddress({
        addressType: ADDRESS_TYPE.invoicing,
        address: invoicing.id,
      });
    }

    setLoading(false);
  }, [updateAddress, workspaceURL]);

  useEffect(() => {
    if (cartDeliveryAddress && cartInvoicingAddress) {
      resolveFromCartAddresses();
    } else {
      resolveDefaultAddresses();
    }
  }, [
    cartDeliveryAddress,
    cartInvoicingAddress,
    resolveFromCartAddresses,
    resolveDefaultAddresses,
  ]);

  const noAddress = !invoicingAddress && !deliveryAddress;

  const sameDeliveryAndInvoicingAddress = Boolean(
    invoicingAddress?.id && invoicingAddress.id === deliveryAddress?.id,
  );

  const LinkButton = ({
    children,
    variant,
    ...props
  }: React.ComponentPropsWithoutRef<typeof Button>) => (
    <Link
      className="block"
      href={`${workspaceURI}/account/addresses?checkout=true${callbackURL ? `&callbackURL=${callbackURL}` : ''}`}>
      <Button variant={variant ?? 'royal-outline'} size="sm" {...props}>
        {children}
      </Button>
    </Link>
  );

  return (
    <section className="bg-white border border-ink-100 shadow-xs rounded-xl p-6">
      <h2 className="text-lg font-bold text-ink-900 mb-4">
        {title || i18n.t('Contact')}
      </h2>
      {loading ? (
        <Loader />
      ) : noAddress ? (
        <div className="rounded-lg border border-ink-150 p-4 flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-400">
            {i18n.t('Invoicing and delivery address')}
          </h3>
          <LinkButton variant="royal">
            {i18n.t('Create or Select an address')}
          </LinkButton>
        </div>
      ) : sameDeliveryAndInvoicingAddress ? (
        <div className="rounded-lg border border-ink-150 p-4 flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-400">
            {i18n.t('Invoicing and delivery address')}
          </h3>
          <AddressBlock address={deliveryAddress?.address} />
          <LinkButton>{i18n.t('Choose another address')}</LinkButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {title: 'Delivery Address', address: deliveryAddress?.address},
            {title: 'Invoicing Address', address: invoicingAddress?.address},
          ].map(({title, address}) => (
            <div
              key={title}
              className="rounded-lg border border-ink-150 p-4 flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-400">
                {i18n.t(title)}
              </h3>
              {address ? (
                <>
                  <AddressBlock address={address} />
                  <LinkButton>{i18n.t('Choose another address')}</LinkButton>
                </>
              ) : (
                <LinkButton variant="royal">
                  {i18n.t('Create or Select an address')}
                </LinkButton>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AddressBlock({address}: {address: any}) {
  if (!address) return null;
  return (
    <div className="text-sm leading-snug">
      <p className="font-bold text-base text-ink-900">{address.addressl2}</p>
      {address.addressl4 && <p className="text-ink-700">{address.addressl4}</p>}
      {address.addressl6 && <p className="text-ink-700">{address.addressl6}</p>}
      {address.country?.name && (
        <p className="text-ink-500 mt-0.5">{address.country.name}</p>
      )}
    </div>
  );
}

export default AddressSelection;
