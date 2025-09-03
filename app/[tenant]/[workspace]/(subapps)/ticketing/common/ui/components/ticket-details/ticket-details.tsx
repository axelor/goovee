'use client';

import {i18n} from '@/locale';
import {formatDate} from '@/locale/formatters';
import type {PortalAppConfig} from '@/types';
import type {Cloned, Maybe} from '@/types/util';
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
  InnerHTML,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {Progress} from '@/ui/components/progress';
import {cn} from '@/utils/css';
import {useMemo} from 'react';
import {FIELDS, INVOICING_TYPE, UPDATABLE_FIELDS} from '../../../constants';
import type {
  ContactPartner,
  Category as TCategory,
  Priority as TPriority,
} from '../../../types';
import {isWithProvider} from '../../../utils';
import {Category, Priority, Status} from '../pills';
import {useTicketDetails} from './ticket-details-provider';

import '@/ui/components/rich-text-editor/rich-text-editor.css';

type Props = {
  categories: TCategory[];
  priorities: TPriority[];
  contacts: ContactPartner[];
  formFields: PortalAppConfig['ticketingFormFieldSet'];
  showCancel?: boolean;
  showClose?: boolean;
  showAssignment?: boolean;
};

export function TicketDetails(props: Props) {
  const {
    ticketForm: form,
    ticket,
    handleTicketFormSubmit: handleSubmit,
    loading,
  } = useTicketDetails();
  const {
    categories,
    priorities,
    contacts,
    formFields,
    showCancel,
    showClose,
    showAssignment,
  } = props;

  const allowedFields = useMemo(
    () => new Set(formFields?.map(f => f.name)),
    [formFields],
  );

  const hasEditableFields = useMemo(
    () => UPDATABLE_FIELDS.some(f => allowedFields.has(f)),
    [allowedFields],
  );

  const close = !ticket.status?.isCompleted && showClose && <CloseTicket />;
  const cancel = !ticket.status?.isCompleted && showCancel && <CancelTicket />;

  const assignToButton = showAssignment && <AssignToButton />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(value => handleSubmit(value))}>
        <div className="flex flex-col-reverse lg:flex-col gap-4 rounded-md border bg-card p-4 mt-5">
          <div className="grid grid-cols-1 gap-4 lg:flex lg:flex-row-reverse lg:justify-start lg:grow">
            {hasEditableFields && (
              <Button
                size="sm"
                type="submit"
                variant="success"
                disabled={!form.formState.isDirty || loading}>
                {i18n.t('Save Changes')}
              </Button>
            )}
            <div className="contents lg:hidden">
              {assignToButton}
              {close}
              {cancel}
            </div>
          </div>
          <div className="space-y-3">
            {allowedFields.has(FIELDS.ID) && (
              <div className="flex justify-between">
                <p className="text-base font-medium">#{ticket?.id}</p>
              </div>
            )}
            <h1 className="text-xl font-semibold">{ticket.name}</h1>
            <hr />
            <div className="flex flex-col gap-4">
              <>
                <div className="flex items-center gap-4">
                  {allowedFields.has(FIELDS.STATUS) && (
                    <span>
                      <span className="font-medium pe-2">
                        {i18n.t('Status')}:
                      </span>
                      <Status name={ticket.status?.name} />
                    </span>
                  )}
                  <span className="hidden lg:inline-flex gap-4 ml-auto">
                    {close}
                    {cancel}
                  </span>
                </div>
                {(allowedFields.has(FIELDS.STATUS) || close || cancel) && (
                  <hr className="hidden lg:block" />
                )}
              </>
              {allowedFields.has(FIELDS.CATEGORY) && (
                <FormField
                  control={form.control}
                  name="category"
                  render={({field}) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormLabel className="font-medium text-md">
                        {i18n.t('Category')}:
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="w-fit">
                            <SelectValue
                              asChild
                              placeholder={i18n.t('Select your category')}>
                              <Category
                                name={
                                  categories.find(c => c.id == field.value)
                                    ?.name
                                }
                              />
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem
                              value={category.id.toString()}
                              key={category.id}>
                              <Category name={category.name} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {allowedFields.has(FIELDS.PRIORITY) && (
                <FormField
                  control={form.control}
                  name="priority"
                  render={({field}) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormLabel className="font-medium text-md">
                        {i18n.t('Priority')}:
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="w-fit">
                            <SelectValue
                              asChild
                              placeholder={i18n.t('Select your priority')}>
                              <Priority
                                name={
                                  priorities.find(c => c.id == field.value)
                                    ?.name
                                }
                              />
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorities.map(priority => (
                            <SelectItem
                              value={priority.id.toString()}
                              key={priority.id}>
                              <Priority name={priority.name} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <hr
              className={cn({
                ['hidden']:
                  !allowedFields.has(FIELDS.PRIORITY) &&
                  !allowedFields.has(FIELDS.CATEGORY),
              })}
            />
            {allowedFields.has(FIELDS.CREATED_BY) && (
              <p className="!mt-3.5">
                <span className="font-medium pe-2">
                  {i18n.t('Created by')}:
                </span>

                <span className="ms-2">
                  {ticket.createdByContact?.simpleFullName
                    ? ticket.createdByContact?.simpleFullName
                    : ticket.project?.company?.name}
                </span>
              </p>
            )}
            {allowedFields.has(FIELDS.CREATED_ON) && (
              <p>
                <span className="font-medium pe-2">
                  {i18n.t('Created on')}:
                </span>
                {formatDate(ticket?.createdOn!)}
              </p>
            )}
            <hr
              className={cn({
                ['hidden']:
                  !allowedFields.has(FIELDS.CREATED_BY) &&
                  !allowedFields.has(FIELDS.CREATED_ON),
              })}
            />

            <div>
              <div
                className={cn('lg:flex space-y-2', {
                  ['mb-3']:
                    allowedFields.has(FIELDS.ASSIGNMENT) || showAssignment,
                })}>
                {allowedFields.has(FIELDS.ASSIGNMENT) && (
                  <div>
                    <div className="flex items-center gap-2 space-y-0">
                      <span className="font-medium pe-2">
                        {i18n.t('Assigned to')}:
                      </span>
                      <div className="h-10 flex items-center">
                        {isWithProvider(ticket.assignment)
                          ? ticket.project?.company?.name
                          : ticket.project?.clientPartner?.simpleFullName}
                      </div>
                    </div>
                  </div>
                )}
                {showAssignment && (
                  <div className="hidden lg:block ml-auto">
                    {assignToButton}
                  </div>
                )}
              </div>
              {allowedFields.has(FIELDS.MANAGED_BY) && (
                <div className="lg:flex space-y-2 mb-3">
                  <FormField
                    control={form.control}
                    name="managedBy"
                    render={({field}) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormLabel className="font-medium text-md">
                          {i18n.t('Managed by')}:
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="w-fit">
                              <SelectValue
                                placeholder={i18n.t('Select Assignee')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contacts.map(contact => (
                              <SelectItem
                                value={contact.id.toString()}
                                key={contact.id}>
                                {contact.simpleFullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              {allowedFields.has(FIELDS.TASK_END_DATE) && (
                <p>
                  <span className="font-medium pe-2">
                    {i18n.t('Expected on')}:
                  </span>
                  {formatDate(ticket?.taskEndDate!)}
                </p>
              )}
            </div>
            <hr
              className={cn({
                ['hidden']:
                  !allowedFields.has(FIELDS.TASK_END_DATE) &&
                  !allowedFields.has(FIELDS.MANAGED_BY) &&
                  !allowedFields.has(FIELDS.ASSIGNMENT) &&
                  !showAssignment,
              })}
            />
            {allowedFields.has(FIELDS.PROGRESS) && (
              <div className="sm:flex items-center !mt-3.5">
                <p className="font-medium pe-2 mb-3 sm:mb-0">
                  {i18n.t('Progress')}: {getProgress(ticket.progress)}%
                </p>
                <Progress
                  value={getProgress(ticket.progress)}
                  className="h-3 basis-3/4 sm:ms-5 rounded-none"
                />
              </div>
            )}
            {allowedFields.has(FIELDS.TARGET_VERSION) && (
              <p>
                <span className="font-medium pe-2"> {i18n.t('Version')}:</span>
                {ticket.targetVersion?.title}
              </p>
            )}
            <hr
              className={cn({
                ['hidden']:
                  !allowedFields.has(FIELDS.PROGRESS) &&
                  !allowedFields.has(FIELDS.TARGET_VERSION),
              })}
            />
            {ticket.displayFinancialData &&
              ticket.invoicingType === INVOICING_TYPE.PACKAGE && (
                <>
                  <div className="flex gap-4">
                    <span className="font-medium">
                      {i18n.t('Financial data')}:
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium">{i18n.t('Qty')}</span>
                      <span>{ticket.quantity}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {i18n.t('Invoicing unit')}
                      </span>
                      <span>{ticket.invoicingUnit?.name}</span>
                    </div>
                  </div>
                  <hr />
                </>
              )}
            <div className="DraftEditor-editorContainer">
              <InnerHTML
                content={ticket.description}
                className="public-DraftEditor-content"
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

function getProgress(p: Maybe<string>): number {
  if (p) {
    const progress = Number(p);
    if (!isNaN(progress)) {
      return progress;
    }
  }
  return 0;
}

function AssignToButton({className}: {className?: string}) {
  const {loading, handleAssignment, ticket} = useTicketDetails();

  const company = ticket.project?.company?.name ?? '';
  const client = ticket.project?.clientPartner?.simpleFullName ?? '';
  return (
    <Button
      size="sm"
      type="button"
      className={className}
      variant="success"
      disabled={loading}
      onClick={handleAssignment}>
      {isWithProvider(ticket.assignment)
        ? i18n.t('Assign to') + ' ' + client
        : i18n.t('Assign to') + ' ' + company}
    </Button>
  );
}

function CancelTicket({className}: {className?: string}) {
  const {loading, handleCancelTicket} = useTicketDetails();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="destructive"
          disabled={loading}
          className={className}>
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
            <Button type="button" size="sm" variant="outline">
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
  );
}

function CloseTicket({className}: {className?: string}) {
  const {loading, handleCloseTicket} = useTicketDetails();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="success"
          disabled={loading}
          className={className}>
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
            <Button type="button" size="sm" variant="outline">
              {i18n.t('Cancel')}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleCloseTicket}>
              {i18n.t('OK')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
