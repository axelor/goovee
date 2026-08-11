'use client';

import {useMemo} from 'react';

import {i18n} from '@/locale';
import {formatDate} from '@/locale/formatters';
import type {TicketingConfig} from '../../../orm/config';
import {
  Button,
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

import {FIELDS, INVOICING_TYPE, UPDATABLE_FIELDS} from '../../../constants';
import type {
  ContactPartner,
  Category as TCategory,
  Priority as TPriority,
} from '../../../types';
import {isWithProvider} from '../../../utils';
import {Category, Priority} from '../pills';
import {useTicketDetails} from './ticket-details-provider';

type Props = {
  categories: TCategory[];
  priorities: TPriority[];
  contacts: ContactPartner[];
  formFields: TicketingConfig['ticketingFormFieldSet'];
  showAssignment?: boolean | null;
};

export function TicketSidebar(props: Props) {
  const {categories, priorities, contacts, formFields, showAssignment} = props;
  const {
    ticket,
    ticketForm: form,
    handleTicketFormSubmit: handleSubmit,
    handleAssignment,
    loading,
  } = useTicketDetails();

  const allowedFields = useMemo(
    () => new Set(formFields?.map(f => f.name)),
    [formFields],
  );

  const hasEditableFields = useMemo(
    () => UPDATABLE_FIELDS.some(f => allowedFields.has(f)),
    [allowedFields],
  );

  const company = ticket.project?.company?.name ?? '';
  const client = ticket.project?.clientPartner?.simpleFullName ?? '';

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(value => handleSubmit(value))}
        className="flex flex-col gap-4">
        {hasEditableFields && (
          <section className="bg-white rounded-xl border border-ink-100 shadow-xs p-5">
            <h3 className="text-sm font-bold uppercase tracking-[0.06em] text-ink-400 mb-4">
              {i18n.t('Details')}
            </h3>

            <dl className="flex flex-col gap-3 text-sm">
              {allowedFields.has(FIELDS.CATEGORY) && (
                <FormField
                  control={form.control}
                  name="category"
                  render={({field}) => (
                    <FormItem className="flex flex-col gap-1.5 space-y-0">
                      <FormLabel className="text-xs font-semibold text-ink-500 uppercase tracking-[0.04em]">
                        {i18n.t('Category')}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="w-full h-9 border-ink-150">
                            <SelectValue
                              asChild
                              placeholder={i18n.t('Select category')}>
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
                    <FormItem className="flex flex-col gap-1.5 space-y-0">
                      <FormLabel className="text-xs font-semibold text-ink-500 uppercase tracking-[0.04em]">
                        {i18n.t('Priority')}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="w-full h-9 border-ink-150">
                            <SelectValue
                              asChild
                              placeholder={i18n.t('Select priority')}>
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
              {allowedFields.has(FIELDS.MANAGED_BY) && (
                <FormField
                  control={form.control}
                  name="managedBy"
                  render={({field}) => (
                    <FormItem className="flex flex-col gap-1.5 space-y-0">
                      <FormLabel className="text-xs font-semibold text-ink-500 uppercase tracking-[0.04em]">
                        {i18n.t('Managed by')}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="w-full h-9 border-ink-150">
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
              )}

              {hasEditableFields && (
                <Button
                  size="sm"
                  type="submit"
                  variant="royal"
                  className="mt-2"
                  disabled={!form.formState.isDirty || loading}>
                  {i18n.t('Save Changes')}
                </Button>
              )}
            </dl>
          </section>
        )}

        {(allowedFields.has(FIELDS.CREATED_BY) ||
          allowedFields.has(FIELDS.CREATED_ON) ||
          allowedFields.has(FIELDS.ASSIGNMENT) ||
          showAssignment ||
          (allowedFields.has(FIELDS.TASK_END_DATE) && ticket?.taskEndDate)) && (
          <section className="bg-white rounded-xl border border-ink-100 shadow-xs p-5">
            <h3 className="text-sm font-bold uppercase tracking-[0.06em] text-ink-400 mb-4">
              {i18n.t('Participants')}
            </h3>
            <dl className="flex flex-col gap-3 text-sm">
              {allowedFields.has(FIELDS.CREATED_BY) && (
                <PersonField
                  label={i18n.t('Created by')}
                  name={
                    ticket.createdByContact?.simpleFullName ||
                    ticket.project?.company?.name ||
                    ''
                  }
                  gradient="peach"
                />
              )}
              {allowedFields.has(FIELDS.CREATED_ON) && (
                <Field label={i18n.t('Created on')}>
                  <span className="tabular-nums">
                    {formatDate(ticket?.createdOn!)}
                  </span>
                </Field>
              )}
              {allowedFields.has(FIELDS.ASSIGNMENT) && (
                <PersonField
                  label={i18n.t('Assigned to')}
                  name={
                    (isWithProvider(ticket.assignment)
                      ? ticket.project?.company?.name
                      : ticket.project?.clientPartner?.simpleFullName) || ''
                  }
                  gradient="mint"
                />
              )}
              {showAssignment && (
                <Button
                  size="sm"
                  type="button"
                  variant="royal-outline"
                  disabled={loading}
                  onClick={handleAssignment}
                  className="mt-1">
                  {i18n.t(
                    'Assign to {0}',
                    isWithProvider(ticket.assignment) ? client : company,
                  )}
                </Button>
              )}
              {allowedFields.has(FIELDS.TASK_END_DATE) &&
                ticket?.taskEndDate && (
                  <Field label={i18n.t('Expected on')}>
                    <span className="tabular-nums">
                      {formatDate(ticket.taskEndDate)}
                    </span>
                  </Field>
                )}
            </dl>
          </section>
        )}

        {(allowedFields.has(FIELDS.PROGRESS) ||
          (allowedFields.has(FIELDS.TARGET_VERSION) &&
            ticket.targetVersion?.title) ||
          (ticket.displayFinancialData &&
            ticket.invoicingType === INVOICING_TYPE.PACKAGE)) && (
          <section className="bg-white rounded-xl border border-ink-100 shadow-xs p-5">
            <h3 className="text-sm font-bold uppercase tracking-[0.06em] text-ink-400 mb-4">
              {i18n.t('Tracking')}
            </h3>
            <div className="flex flex-col gap-3 text-sm">
              {allowedFields.has(FIELDS.PROGRESS) && (
                <div>
                  <p className="text-xs font-semibold text-ink-500 uppercase tracking-[0.04em] mb-2">
                    {i18n.t('Progress')}{' '}
                    <span className="tabular-nums text-ink-900">
                      {getProgress(ticket.progress)}%
                    </span>
                  </p>
                  <Progress
                    value={getProgress(ticket.progress)}
                    className="h-2 rounded-full"
                  />
                </div>
              )}
              {allowedFields.has(FIELDS.TARGET_VERSION) &&
                ticket.targetVersion?.title && (
                  <Field label={i18n.t('Version')}>
                    {ticket.targetVersion.title}
                  </Field>
                )}
              {ticket.displayFinancialData &&
                ticket.invoicingType === INVOICING_TYPE.PACKAGE && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={i18n.t('Qty')}>
                      <span className="tabular-nums">{ticket.quantity}</span>
                    </Field>
                    <Field label={i18n.t('Invoicing unit')}>
                      {ticket.invoicingUnit?.name}
                    </Field>
                  </div>
                )}
            </div>
          </section>
        )}
      </form>
    </Form>
  );
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold text-ink-500 uppercase tracking-[0.04em]">
        {label}
      </dt>
      <dd className={cn('text-sm text-ink-900')}>{children}</dd>
    </div>
  );
}

function PersonField({
  label,
  name,
  gradient,
}: {
  label: string;
  name: string;
  gradient: 'peach' | 'mint' | 'gray';
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold text-ink-500 uppercase tracking-[0.04em]">
        {label}
      </dt>
      <dd className="flex items-center gap-2.5">
        <span
          className={cn(
            'grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white',
            gradient === 'peach' && 'bg-peach-avatar',
            gradient === 'mint' && 'bg-mint-logo',
            gradient === 'gray' && 'bg-ink-400',
          )}>
          {getInitials(name)}
        </span>
        <span className="text-sm text-ink-900">{name || '—'}</span>
      </dd>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getProgress(p: string | null | undefined): number {
  if (p) {
    const progress = Number(p);
    if (!isNaN(progress)) return progress;
  }
  return 0;
}
