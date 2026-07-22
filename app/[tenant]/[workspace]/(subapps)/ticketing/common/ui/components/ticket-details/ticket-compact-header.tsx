'use client';

import {useMemo} from 'react';
import {Link} from '@/ui/components/link';
import {MdArrowBack} from 'react-icons/md';

import {i18n} from '@/locale';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/components';

import {FIELDS} from '../../../constants';
import type {TicketingConfig} from '../../../orm/config';
import {Category, Priority, Status} from '../pills';
import {useTicketDetails} from './ticket-details-provider';

interface CompactHeaderProps {
  backHref: string;
  showCancel?: boolean | null;
  showClose?: boolean | null;
  formFields: TicketingConfig['ticketingFormFieldSet'];
}

export function TicketCompactHeader(props: CompactHeaderProps) {
  const {backHref, showCancel, showClose, formFields} = props;
  const {ticket, loading, handleCloseTicket, handleCancelTicket} =
    useTicketDetails();
  const isResolved = ticket.status?.isCompleted;
  const canClose = !isResolved && showClose;
  const canCancel = !isResolved && showCancel;

  const visibleFields = useMemo(
    () => new Set(formFields?.map(field => field.name)),
    [formFields],
  );

  return (
    <div>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-700 mb-3">
        <MdArrowBack className="text-sm" />
        {i18n.t('Back to tickets')}
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
            {i18n.t('Ticket')} #{ticket?.id}
          </p>
          <h1 className="text-2xl font-bold text-ink-900 tracking-[-0.01em] leading-tight">
            {ticket.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {visibleFields.has(FIELDS.STATUS) && (
              <Status name={ticket.status?.name} />
            )}
            {visibleFields.has(FIELDS.PRIORITY) && (
              <Priority name={ticket.priority?.name} />
            )}
            {visibleFields.has(FIELDS.CATEGORY) && (
              <Category name={ticket.projectTaskCategory?.name} />
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {canClose && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="mint" disabled={loading}>
                  {i18n.t('Close ticket')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{i18n.t('Are you sure?')}</DialogTitle>
                  <DialogDescription>
                    {i18n.t('This action cannot be undone.')}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" size="sm" variant="ink-outline">
                      {i18n.t('Cancel')}
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="mint"
                      onClick={handleCloseTicket}>
                      {i18n.t('OK')}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {canCancel && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={loading}>
                  {i18n.t('Cancel ticket')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{i18n.t('Are you sure?')}</DialogTitle>
                  <DialogDescription>
                    {i18n.t('This action cannot be undone.')}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" size="sm" variant="ink-outline">
                      {i18n.t('Cancel')}
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={handleCancelTicket}>
                      {i18n.t('OK')}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
