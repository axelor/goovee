'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {MdOutlineRefresh} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Button} from '@/ui/components/button';
import {Dialog, DialogContent, DialogTitle} from '@/ui/components/dialog';
import {useCart} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/context/cart-context';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {useToast} from '@/ui/hooks';
import {SUBAPP_CODES} from '@/constants';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {requestQuotation} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/actions/cart';
import {AddressSelection} from '../../../common/ui/components/address-selection';

export default function Content({
  quotationSubapp,
}: {
  quotationSubapp?: boolean;
}) {
  const [requestingQuotation, setRequestingQuotation] = useState(false);

  const {clearCart, cart} = useCart();
  const router = useRouter();
  const {url} = useWorkspace();
  const {toast} = useToast();

  const invoicingAddress = cart?.invoicingAddress;
  const deliveryAddress = cart?.deliveryAddress;

  const callbackURL = url.forRouter(
    `/${SUBAPP_CODES.shop}/cart/request-quotation`,
  );
  const checkoutURL = url.forRouter(`/${SUBAPP_CODES.shop}/cart`);

  const handleRequestQuotation = async () => {
    if (!(cart?.invoicingAddress && cart?.deliveryAddress)) {
      toast({
        variant: 'destructive',
        title: i18n.t(
          'Kindly add invoicing and delivery address for your profile.',
        ),
      });
      return;
    }

    setRequestingQuotation(true);

    const res = await requestQuotation({cart});

    if (res?.data) {
      toast({
        variant: 'success',
        title: i18n.t('Quotation requested successfully'),
      });
      clearCart();
      const redirectURL = quotationSubapp
        ? url.forRouter(`/${SUBAPP_CODES.quotations}/${res.data}`)
        : url.forRouter('/shop');
      router.replace(redirectURL);
    } else {
      toast({
        variant: 'destructive',
        title: i18n.t('Error requesting quotation, try again !'),
      });
      router.replace(url.forRouter(`/${SUBAPP_CODES.shop}/cart`));
    }
  };

  return (
    <>
      <Dialog open>
        {/*
          The address picker carries its own heading, so the dialog title is
          only there to name the dialog itself.
        */}
        <DialogContent
          className="space-y-2"
          hideClose
          aria-describedby={undefined}>
          <DialogTitle className="sr-only">
            {i18n.t('Request Quotation')}
          </DialogTitle>
          {!requestingQuotation ? (
            <>
              <AddressSelection
                title={i18n.t('Addresses')}
                callbackURL={callbackURL}
              />
              <div className="grid grid-cols-2 items-center gap-2">
                <Link href={checkoutURL}>
                  <Button variant="outline" className="w-full">
                    {i18n.t('Cancel')}
                  </Button>
                </Link>
                <Button
                  variant="success"
                  disabled={!(invoicingAddress && deliveryAddress)}
                  onClick={handleRequestQuotation}>
                  {i18n.t('Request')}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center">
              <MdOutlineRefresh className="h-6 w-6 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
