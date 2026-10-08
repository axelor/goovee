'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {EllipsisVertical} from 'lucide-react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {formatDate, formatDateTime} from '@/locale/formatters';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/components';
import {useToast} from '@/ui/hooks';
import {transferDeadline} from '@/payment/domain/transfers';
import {GATEWAY} from '@/payment/domain/types';
import {
  formatMoney,
  TransferInstructions,
} from '@/ui/components/payment/transfer-instructions';

// ---- LOCAL IMPORTS ---- //
import {cancelPendingTransfer} from '@/subapps/invoices/common/actions/transfers';
import type {PendingTransfer} from '@/subapps/invoices/common/payment/pending';

/** What a withdrawal needs to name the invoice the way the page was opened. */
type CancelScope = {
  invoiceId: string;
  workspaceURL: string;
  token?: string;
};

function PendingTransferEntry({
  transfer,
  cancelScope,
}: {
  transfer: PendingTransfer;
  /** Null where the workspace does not let the payer withdraw a transfer. */
  cancelScope: CancelScope | null;
}) {
  const router = useRouter();
  const {toast} = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const {instructions, currencyCode, currencyScale} = transfer;
  /* The reference the bank transfer must quote, which is the provider's, not
   * the payment's own. */
  const transferReference = instructions?.reference;
  const partlyReceived = transfer.remaining < transfer.amount;
  const canCancel = Boolean(cancelScope && transfer.cancelable);
  const hasActions = Boolean(instructions || transfer.href || canCancel);

  const cancel = async () => {
    if (!cancelScope || cancelling) return;
    setCancelling(true);
    try {
      const result = await cancelPendingTransfer({
        ...cancelScope,
        transferId: transfer.id,
      });
      if (result.error) {
        toast({variant: 'destructive', title: result.message});
      }
      setConfirmingCancel(false);
      router.refresh();
    } catch {
      toast({
        variant: 'destructive',
        title: i18n.t('Something went wrong while canceling the bank transfer'),
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <li className="flex items-center justify-between gap-2 rounded border border-ink-150 bg-white p-2">
      <div className="flex flex-col">
        <span className="font-medium tabular-nums">
          {formatMoney(transfer.amount, currencyCode, currencyScale)}
        </span>
        {partlyReceived && (
          <span className="text-xs">
            <span className="font-medium">{i18n.t('Amount remaining')}:</span>{' '}
            <span className="font-semibold tabular-nums">
              {formatMoney(transfer.remaining, currencyCode, currencyScale)}
            </span>
          </span>
        )}
        {transfer.partlyFunded && (
          <span className="text-xs text-ink-500">
            {i18n.t(
              'Part received. Send the rest with the same bank details to complete this payment.',
            )}
          </span>
        )}
        {transfer.gateway === GATEWAY.stripeBankTransfer &&
          transfer.startedOn && (
            <span className="text-xs text-ink-500">
              {i18n.t(
                'Send the transfer by {0}; after that it is cancelled.',
                formatDateTime(transferDeadline(new Date(transfer.startedOn))),
              )}
            </span>
          )}
        {transfer.startedOn && (
          <span className="text-xs text-ink-500">
            {formatDate(transfer.startedOn, {dateFormat: 'YYYY-MM-DD'})}
          </span>
        )}
      </div>

      {hasActions && (
        /* Not modal: a modal menu that opens a dialog from one of its items can
         * leave the page unclickable once the dialog closes. */
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            aria-label={i18n.t('Actions')}
            className="rounded p-1 hover:bg-ink-50">
            <EllipsisVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {instructions && (
              <DropdownMenuItem onSelect={() => setShowDetails(true)}>
                {i18n.t('Show Bank Details')}
              </DropdownMenuItem>
            )}
            {transferReference && (
              <DropdownMenuItem
                onSelect={() =>
                  void navigator.clipboard.writeText(transferReference)
                }>
                {i18n.t('Copy Reference')}
              </DropdownMenuItem>
            )}
            {transfer.href && (
              <DropdownMenuItem asChild>
                <a href={transfer.href}>{i18n.t('View payment')}</a>
              </DropdownMenuItem>
            )}
            {canCancel && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setConfirmingCancel(true)}
                  className="text-red-600 focus:bg-red-50 focus:text-red-600">
                  {i18n.t('Cancel Transfer')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {instructions && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{i18n.t('Bank Transfer Payment')}</DialogTitle>
              <DialogDescription>
                {i18n.t('Transfer funds using the following bank information:')}
              </DialogDescription>
            </DialogHeader>
            <TransferInstructions
              instructions={instructions}
              currencyCode={currencyCode}
              currencyScale={currencyScale}
            />
          </DialogContent>
        </Dialog>
      )}

      {canCancel && (
        <AlertDialog
          open={confirmingCancel}
          onOpenChange={open => {
            if (!cancelling) setConfirmingCancel(open);
          }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {i18n.t('Cancel bank transfer?')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {i18n.t(
                  'This bank transfer will be canceled and can no longer be completed. This action cannot be undone.',
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelling}>
                {i18n.t('Keep transfer')}
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={cancelling}
                className="bg-red-600 hover:bg-red-700"
                onClick={event => {
                  /* Kept open until the answer is in, so a refusal is read
                   * against the dialog the payer is looking at. */
                  event.preventDefault();
                  void cancel();
                }}>
                {cancelling ? i18n.t('Canceling…') : i18n.t('Yes, cancel')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </li>
  );
}

function PendingTransferGroup({
  heading,
  transfers,
  cancelScope,
}: {
  heading: string;
  transfers: PendingTransfer[];
  cancelScope: CancelScope | null;
}) {
  if (!transfers.length) {
    return null;
  }
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-yellow-200 bg-yellow-50/50 p-3 text-sm">
      <h3 className="font-semibold text-ink-900">{heading}</h3>
      <ul className="flex flex-col gap-2">
        {transfers.map(transfer => (
          <PendingTransferEntry
            key={transfer.id}
            transfer={transfer}
            cancelScope={cancelScope}
          />
        ))}
      </ul>
    </section>
  );
}

/**
 * Transfers started on the invoice that the payer's bank has not finished,
 * grouped by how they were started. Each carries what the payer needs to
 * complete it, and a Stripe transfer nothing has arrived for can be withdrawn;
 * a transfer that settles is no longer listed and is counted in what remains
 * to pay.
 */
export function PendingTransfers({
  transfers,
  cancelScope,
}: {
  transfers: PendingTransfer[];
  cancelScope: CancelScope | null;
}) {
  const stripe = transfers.filter(
    transfer => transfer.gateway === GATEWAY.stripeBankTransfer,
  );
  const hubpisp = transfers.filter(
    transfer => transfer.gateway === GATEWAY.hubpisp,
  );
  return (
    <>
      <PendingTransferGroup
        heading={i18n.t('Pending Stripe Bank transfers')}
        transfers={stripe}
        cancelScope={cancelScope}
      />
      <PendingTransferGroup
        heading={i18n.t('Pending HUB PISP payments')}
        transfers={hubpisp}
        cancelScope={cancelScope}
      />
    </>
  );
}
