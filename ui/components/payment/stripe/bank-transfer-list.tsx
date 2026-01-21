'use client';

import {useState} from 'react';
import {EllipsisVertical} from 'lucide-react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/lib/core/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/components';
import {formatDate} from '@/lib/core/locale/formatters';
import {BankTransferDetails} from './bank-transfer-details';
import {BankTransferDetailsType} from '../types';

type BankTransferItemProps = {
  transfer: BankTransferDetailsType;
  onCancel: (transfer: BankTransferDetailsType) => Promise<void>;
};

type BankTransferListProps = {
  bankTransfers: BankTransferDetailsType[];
  onCancelTransfer: (transfer: BankTransferDetailsType) => Promise<void>;
};

export function BankTransferList({
  bankTransfers,
  onCancelTransfer,
}: BankTransferListProps) {
  return (
    <div className="rounded-md border-l-4 border-yellow-400 bg-yellow-50 p-4">
      <p className="text-sm font-medium text-yellow-900">
        {i18n.t('Pending Bank transfers')}
      </p>

      <div className="mt-2 space-y-2">
        {bankTransfers.map(transfer => (
          <BankTransferItem
            key={transfer.id}
            transfer={transfer}
            onCancel={onCancelTransfer}
          />
        ))}
      </div>
    </div>
  );
}

function BankTransferItem({transfer, onCancel}: BankTransferItemProps) {
  const [showBankDetails, setShowBankDetails] = useState<boolean>(false);
  const [isCanceling, setIsCanceling] = useState<boolean>(false);
  const [openCancelDialog, setOpenCancelDialog] = useState<boolean>(false);
  const [bankTransferDetails, setBankTransferDetails] =
    useState<BankTransferDetailsType | null>(null);

  const handleCopyReference = () => {
    navigator.clipboard.writeText(transfer.reference);
  };

  const handleBankDetailsDialogClose = () => {
    setShowBankDetails(false);
  };

  const handleCancelIntent = async (): Promise<void> => {
    setIsCanceling(true);
    try {
      await onCancel(transfer);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCanceling(false);
      setOpenCancelDialog(false);
    }
  };

  const handleBankTransferDetails = (transfer: BankTransferDetailsType) => {
    setBankTransferDetails(transfer);
  };

  return (
    <div className="border border-yellow-200 rounded bg-white bg-opacity-50">
      <div className="flex items-center justify-between p-2">
        <div>
          <div className="font-medium">{transfer.amount}</div>
          <div className="text-xs text-gray-500">
            {formatDate(transfer.initiatedDate, {
              dateFormat: 'YYYY-MM-DD',
            })}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <EllipsisVertical className="h-4 w-4 cursor-pointer" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                setShowBankDetails(true);
                handleBankTransferDetails(transfer);
              }}>
              {i18n.t('Show Bank Details')}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleCopyReference}>
              {i18n.t('Copy Reference')}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setOpenCancelDialog(true)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50">
              {i18n.t('Cancel Transfer')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={openCancelDialog} onOpenChange={setOpenCancelDialog}>
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
            <AlertDialogCancel disabled={isCanceling}>
              {i18n.t('Keep transfer')}
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                handleCancelIntent();
              }}
              disabled={isCanceling}
              className="bg-red-600 hover:bg-red-700">
              {isCanceling ? i18n.t('Canceling…') : i18n.t('Yes, cancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showBankDetails && bankTransferDetails && (
        <BankTransferDetails
          open={showBankDetails}
          details={bankTransferDetails}
          onOpenChange={handleBankDetailsDialogClose}
        />
      )}
    </div>
  );
}
