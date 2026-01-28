// ---- CORE IMPORTS ---- //
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
} from '@/ui/components';
import {i18n} from '@/lib/core/locale';

type BankTransferConfirmDialogProps = {
  open: boolean;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
};

export function BankTransferConfirmDialog({
  open,
  isLoading,
  onOpenChange,
  onConfirm,
  onCancel,
}: BankTransferConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{i18n.t('Confirm Bank Transfer')}</DialogTitle>

          <DialogDescription asChild>
            <div className="space-y-3">
              <p>
                {i18n.t(
                  'Bank transfers may immediately use your existing Stripe balance.',
                )}
              </p>

              <p className="text-sm text-gray-600">
                {i18n.t(
                  'If you already have sufficient balance, this payment will be completed instantly and funds will be deducted.',
                )}
              </p>

              <p className="text-sm text-gray-600 font-medium">
                {i18n.t('This action cannot be undone.')}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" disabled={isLoading} onClick={onCancel}>
            {i18n.t('Cancel')}
          </Button>

          <Button disabled={isLoading} onClick={onConfirm}>
            {i18n.t('Continue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
