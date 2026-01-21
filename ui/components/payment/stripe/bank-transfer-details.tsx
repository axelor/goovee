'use client';

import {useState, useCallback} from 'react';
import {AlertCircle, Copy} from 'lucide-react';
import {MdDoneAll} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/lib/core/locale';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/components';
import {
  BankAddress,
  NormalizedBankDetails,
} from '@/ui/components/payment/types';
import {BANK_ACCOUNT_TYPE} from '@/lib/core/payment/stripe/utils';

interface BankTransferDetailsProps {
  details: {
    id: string;
    reference?: string;
    formattedAmount: string;
    bankDetails: NormalizedBankDetails;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DetailRow = ({
  label,
  value,
  onCopy,
  isCopied,
  isLast = false,
}: {
  label: string;
  value: string;
  onCopy: (val: string) => void;
  isCopied: boolean;
  isLast?: boolean;
}) => (
  <div
    className={`flex items-center justify-between gap-4 pb-3 ${
      !isLast ? 'border-b border-border' : ''
    }`}>
    <p className="text-sm text-foreground">{label}</p>
    <div className="flex items-center gap-2">
      <code className="text-sm font-mono text-foreground break-all text-right">
        {value}
      </code>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onCopy(value)}
        className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
        title={i18n.t('Copy')}>
        {isCopied ? (
          <MdDoneAll className="h-4 w-4 text-success" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  </div>
);

export function BankTransferDetails({
  details,
  open,
  onOpenChange,
}: BankTransferDetailsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = useCallback((text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const formatAddress = useCallback((address?: BankAddress) => {
    if (!address) return '';
    const clean = (v?: string | null) => v?.trim() || '';
    const cityStatePostal = [
      clean(address.city),
      clean(address.state),
      clean(address.postal_code),
    ]
      .filter(Boolean)
      .join(', ');
    return [
      clean(address.line1),
      clean(address.line2),
      cityStatePostal,
      clean(address.country),
    ]
      .filter(Boolean)
      .join(', ');
  }, []);

  const reference = details.reference || details.id;

  const showAddresses =
    details.bankDetails.bankAddress || details.bankDetails.accountHolderAddress;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{i18n.t('Bank Transfer Payment')}</DialogTitle>
          <DialogDescription>
            {i18n.t('Complete your payment with the details below')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <span className="text-sm text-muted-foreground block mb-1">
              {i18n.t('Amount to pay')}
            </span>
            <p className="text-4xl font-bold text-foreground">
              {details.formattedAmount}
            </p>
          </div>

          <section className="space-y-4">
            <header>
              <h3 className="text-sm font-semibold text-foreground">
                {i18n.t('Bank information')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {i18n.t('Transfer funds using the following bank information:')}
              </p>
            </header>

            <div className="space-y-1">
              {details.bankDetails.type === BANK_ACCOUNT_TYPE.IBAN && (
                <>
                  {details.bankDetails.accountHolderName && (
                    <DetailRow
                      label={i18n.t('Account holder name')}
                      value={details.bankDetails.accountHolderName}
                      onCopy={val => copyToClipboard(val, 'holder')}
                      isCopied={copiedField === 'holder'}
                    />
                  )}
                  {details.bankDetails.iban && (
                    <DetailRow
                      label={i18n.t('IBAN')}
                      value={details.bankDetails.iban}
                      onCopy={val =>
                        copyToClipboard(val, BANK_ACCOUNT_TYPE.IBAN)
                      }
                      isCopied={copiedField === BANK_ACCOUNT_TYPE.IBAN}
                    />
                  )}
                  {details.bankDetails.swiftCode && (
                    <DetailRow
                      label={i18n.t('BIC / SWIFT')}
                      value={details.bankDetails.swiftCode}
                      onCopy={val => copyToClipboard(val, 'swift')}
                      isCopied={copiedField === 'swift'}
                    />
                  )}
                </>
              )}

              {details.bankDetails.type === BANK_ACCOUNT_TYPE.ABA && (
                <>
                  {details.bankDetails.accountHolderName && (
                    <DetailRow
                      label={i18n.t('Account holder name')}
                      value={details.bankDetails.accountHolderName}
                      onCopy={val => copyToClipboard(val, 'holder')}
                      isCopied={copiedField === 'holder'}
                    />
                  )}
                  {details.bankDetails.routingNumber && (
                    <DetailRow
                      label={i18n.t('Routing number')}
                      value={details.bankDetails.routingNumber}
                      onCopy={val => copyToClipboard(val, 'routing')}
                      isCopied={copiedField === 'routing'}
                    />
                  )}
                  {details.bankDetails.accountNumber && (
                    <DetailRow
                      label={i18n.t('Account number')}
                      value={details.bankDetails.accountNumber}
                      onCopy={val => copyToClipboard(val, 'account')}
                      isCopied={copiedField === 'account'}
                    />
                  )}
                  {details.bankDetails.accountType && (
                    <DetailRow
                      label={i18n.t('Account type')}
                      value={details.bankDetails.accountType}
                      onCopy={val => copyToClipboard(val, 'type')}
                      isCopied={copiedField === 'type'}
                    />
                  )}
                </>
              )}

              {reference && (
                <DetailRow
                  label={i18n.t('Reference')}
                  value={reference}
                  onCopy={val => copyToClipboard(val, 'ref')}
                  isCopied={copiedField === 'ref'}
                />
              )}

              {details.bankDetails.country && (
                <DetailRow
                  label={i18n.t('Country')}
                  value={details.bankDetails.country}
                  onCopy={val => copyToClipboard(val, 'country')}
                  isCopied={copiedField === 'country'}
                  isLast
                />
              )}
            </div>

            <p className="text-xs bg-muted/50 p-3 rounded-md text-muted-foreground flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {i18n.t(
                'If you can, please include the reference mentioned above to ensure faster processing.',
              )}
            </p>
          </section>

          {showAddresses ? (
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger className="[&>svg]:text-muted-foreground">
                  {i18n.t('View recipient addresses')}
                </AccordionTrigger>
                <AccordionContent className="bg-muted/20 border border-border rounded-md p-4 space-y-6 mb-4">
                  {[
                    {
                      title: 'Bank address',
                      addr: details.bankDetails?.bankAddress,
                      id: 'bAddr',
                    },
                    {
                      title: 'Account holder address',
                      addr: details.bankDetails?.accountHolderAddress,
                      id: 'hAddr',
                    },
                  ].map(
                    ({title, addr, id}) =>
                      addr && (
                        <div key={id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {i18n.t(title)}
                            </h4>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(formatAddress(addr), id)
                              }
                              className="text-xs flex items-center gap-1 text-primary hover:text-primary/80">
                              {copiedField === id ? (
                                <MdDoneAll className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                          <div className="text-sm text-foreground bg-background p-3 rounded border border-border/50 shadow-sm leading-relaxed">
                            {addr.line1}
                            <br />
                            {addr.city}, {addr.state} {addr.postal_code}{' '}
                            {addr.country}
                          </div>
                        </div>
                      ),
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}
        </div>

        <footer className="flex gap-3 pt-6 border-t border-border mt-4">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1">
            {i18n.t('Close')}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
