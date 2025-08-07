'use client';

import {i18n} from '@/locale';
import type {
  MainPartnerContact,
  ProjectClientPartner,
  ProjectCompany,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '@/orm/project-task';
import type {PortalAppConfig} from '@/types';
import type {Cloned} from '@/types/util';
import {
  Badge,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components';
import {Button} from '@/ui/components/button';
import {Drawer, DrawerContent, DrawerTrigger} from '@/ui/components/drawer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from '@/ui/components/multi-select';
import {
  CategoryField,
  DatesField,
  PriorityField,
  StatusField,
} from '@/ui/components/task-components/filter-fields';
import {useResponsive} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {decodeFilter, encodeFilter} from '@/utils/url';
import {zodResolver} from '@hookform/resolvers/zod';
import {X as RemoveIcon} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useForm, UseFormReturn} from 'react-hook-form';
import {FaFilter} from 'react-icons/fa';
import {z} from 'zod';

import {ASSIGNMENT, COMPANY, FIELDS} from '../../../constants';
import {SearchParams} from '../../../types/search-param';
import {
  EncodedTicketFilter,
  EncodedTicketFilterSchema,
  TicketFilterSchema,
} from '../../../utils/validators';

type FilterProps = {
  url: string;
  searchParams: SearchParams;
  contacts: Cloned<MainPartnerContact>[];
  priorities: Cloned<TaskPriority>[];
  statuses: Cloned<TaskStatus>[];
  categories: Cloned<TaskCategory>[];
  company?: Cloned<ProjectCompany>;
  clientPartner?: Cloned<ProjectClientPartner>;
  fields: PortalAppConfig['ticketingFieldSet'];
};

type FilterFormProps = FilterProps & {
  close: () => void;
  filter: unknown;
};

const defaultValues = {
  createdBy: [] as string[],
  managedBy: [] as string[],
  category: [] as string[],
  updatedOn: ['', ''] as [string, string],
  taskDate: ['', ''] as [string, string],
  priority: [] as string[],
  status: [] as string[],
  myTickets: false,
  assignment: null,
};

// NOTE: Steps to add more filters
// 1. Define the field in filter schema
// 2. Add a defualt value
// 3. Connect the form field
// 4. Add the where clause in getWhere function

export function Filter(props: FilterProps) {
  const {
    contacts,
    priorities,
    statuses,
    url,
    searchParams,
    company,
    clientPartner,
    fields,
    categories,
  } = props;

  const [open, setOpen] = useState(false);
  const filter = useMemo(
    () => searchParams.filter && decodeFilter(searchParams.filter),
    [searchParams.filter],
  );
  const filterCount = useMemo(
    () => (filter ? Object.keys(filter).length : 0),
    [filter],
  );

  const res = useResponsive();
  const small = (['xs', 'sm', 'md'] as const).some(x => res[x]);

  const [Controller, Trigger, Content] = small
    ? ([Drawer, DrawerTrigger, DrawerContent] as const)
    : ([Popover, PopoverTrigger, PopoverContent] as const);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <div className={cn('relative', {'mt-5': small})}>
      <Controller open={open} onOpenChange={setOpen}>
        <Trigger asChild>
          <Button
            variant={filterCount ? 'success' : 'outline'}
            className={cn('flex justify-between w-[400px]', {
              ['w-full']: small,
            })}>
            <div className="flex items-center space-x-2">
              <FaFilter className="size-4" />
              <span> {i18n.t('Filters')}</span>
            </div>
            {filterCount > 0 && (
              <Badge
                className="ms-auto ps-[0.45rem] pe-2"
                variant="success-inverse">
                {filterCount}
              </Badge>
            )}
          </Button>
        </Trigger>

        <Content
          className={
            small
              ? 'px-5 pb-5 max-h-full'
              : 'w-[--radix-popper-anchor-width] p-0'
          }>
          {small && (
            <>
              <h3 className="text-xl font-semibold mb-2">
                {i18n.t('Filters')}
              </h3>
              <hr className="mb-2" />
            </>
          )}
          <FilterForm
            url={url}
            searchParams={searchParams}
            contacts={contacts}
            priorities={priorities}
            statuses={statuses}
            categories={categories}
            company={company}
            clientPartner={clientPartner}
            fields={fields}
            filter={filter}
            close={close}
          />
        </Content>
      </Controller>
    </div>
  );
}

function FilterForm(props: FilterFormProps) {
  const {
    contacts,
    priorities,
    statuses,
    url,
    searchParams,
    company,
    clientPartner,
    fields,
    categories,
    close,
    filter,
  } = props;

  const router = useRouter();

  const filterKeys = useMemo(() => {
    if (!filter) return new Set();
    return new Set(Object.keys(filter));
  }, [filter]);

  const allowedFields = useMemo(
    () => new Set(fields?.map(f => f.name)),
    [fields],
  );

  const showField = useCallback(
    ({
      field,
      formKey,
    }: {
      field: string;
      formKey: keyof z.infer<typeof TicketFilterSchema>;
    }) => allowedFields.has(field) || filterKeys.has(formKey),
    [allowedFields, filterKeys],
  );

  const onSubmit = (value: z.infer<typeof TicketFilterSchema>) => {
    const filter = EncodedTicketFilterSchema.parse(value);
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    if (filter) {
      params.set('filter', encodeFilter<EncodedTicketFilter>(filter));
    } else {
      params.delete('filter');
    }
    params.delete('title');

    const route = `${url}?${params.toString()}`;
    router.replace(route);
    close();
  };

  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<z.infer<typeof TicketFilterSchema>>({
    resolver: zodResolver(TicketFilterSchema),
    defaultValues,
  });

  useEffect(() => {
    const {success, data} = EncodedTicketFilterSchema.safeParse(filter);
    if (!success || !data) {
      form.reset(defaultValues);
    } else {
      form.reset({...defaultValues, ...data});
    }
  }, [filter, form]);

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="relative overflow-x-hidden lg:h-fit lg:max-h-[--radix-popper-available-height] lg:overflow-y-auto p-4">
        <div className="space-y-4">
          {(showField({field: FIELDS.CREATED_BY, formKey: 'myTickets'}) ||
            showField({field: FIELDS.MANAGED_BY, formKey: 'myTickets'})) && (
            <MyTicketsField form={form} />
          )}
          {!form.watch('myTickets') && (
            <>
              {showField({field: FIELDS.CREATED_BY, formKey: 'createdBy'}) && (
                <CreatedByField
                  form={form}
                  contacts={contacts}
                  company={company}
                />
              )}
              {showField({field: FIELDS.MANAGED_BY, formKey: 'managedBy'}) && (
                <ManagedByField form={form} contacts={contacts} />
              )}
            </>
          )}
          {showField({field: FIELDS.ASSIGNMENT, formKey: 'assignment'}) && (
            <AssignedToField
              form={form}
              company={company}
              clientPartner={clientPartner}
            />
          )}
          {showField({field: FIELDS.UPDATED_ON, formKey: 'updatedOn'}) && (
            <DatesField form={form} name="updatedOn" title="Updated" />
          )}
          {showField({field: FIELDS.TASK_DATE, formKey: 'taskDate'}) && (
            <DatesField form={form} name="taskDate" title="Task Date" />
          )}
          {showField({field: FIELDS.PRIORITY, formKey: 'priority'}) && (
            <PriorityField form={form} priorities={priorities} />
          )}
          {showField({field: FIELDS.STATUS, formKey: 'status'}) && (
            <StatusField form={form} statuses={statuses} />
          )}
          {showField({field: FIELDS.CATEGORY, formKey: 'category'}) && (
            <CategoryField form={form} categories={categories} />
          )}
          <Button
            variant="success"
            type="submit"
            className="w-full sticky bottom-0 text-xs">
            {i18n.t('Apply')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ManagedByField(props: FieldProps & Pick<FilterProps, 'contacts'>) {
  const {form, contacts} = props;
  return (
    <FormField
      control={form.control}
      name="managedBy"
      render={({field}) => (
        <FormItem className="grow">
          <FormLabel className="text-xs">{i18n.t('Managed by')} :</FormLabel>
          <MultiSelector
            onValuesChange={field.onChange}
            values={field.value ?? []}
            className="space-y-0">
            <MultiSelectorTrigger
              renderLabel={value =>
                contacts.find(contact => contact.id === value)?.simpleFullName
              }>
              <MultiSelectorInput
                placeholder={i18n.t('Select users')}
                className="text-xs"
              />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList>
                {contacts.map(contact => (
                  <MultiSelectorItem key={contact.id} value={contact.id}>
                    <div className="flex items-center space-x-2">
                      <span>{contact.simpleFullName}</span>
                    </div>
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
function CreatedByField(
  props: FieldProps & Pick<FilterProps, 'contacts' | 'company'>,
) {
  const {form, contacts, company} = props;
  return (
    <FormField
      control={form.control}
      name="createdBy"
      render={({field}) => (
        <FormItem className="grow">
          <FormLabel className="text-xs">{i18n.t('Created by')} :</FormLabel>
          <MultiSelector
            onValuesChange={field.onChange}
            values={field.value ?? []}
            className="space-y-0">
            <MultiSelectorTrigger
              renderLabel={value =>
                value === COMPANY
                  ? company?.name
                  : contacts.find(contact => contact.id === value)
                      ?.simpleFullName
              }>
              <MultiSelectorInput
                placeholder={i18n.t('Select users')}
                className="text-xs"
              />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList>
                {company?.id && (
                  <MultiSelectorItem value={COMPANY}>
                    <div className="flex items-center space-x-2">
                      <span>{company.name}</span>
                    </div>
                  </MultiSelectorItem>
                )}
                {contacts.map(contact => (
                  <MultiSelectorItem key={contact.id} value={contact.id}>
                    <div className="flex items-center space-x-2">
                      <span>{contact.simpleFullName}</span>
                    </div>
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function MyTicketsField(props: FieldProps) {
  const {form} = props;
  return (
    <FormField
      control={form.control}
      name="myTickets"
      render={({field}) => (
        <FormItem className="flex items-center space-y-0">
          <FormControl>
            <Checkbox
              checked={!!field.value}
              onCheckedChange={v => {
                if (v) {
                  form.unregister(['createdBy', 'managedBy']);
                }
                field.onChange(v);
              }}
            />
          </FormControl>
          <FormLabel className="ms-4 text-xs">{i18n.t('My Tickets')}</FormLabel>
        </FormItem>
      )}
    />
  );
}

function AssignedToField(
  props: FieldProps & Pick<FilterProps, 'company' | 'clientPartner'>,
) {
  const {form, company, clientPartner} = props;

  const handleClear = () => {
    form.setValue('assignment', null);
  };

  return (
    <div>
      <FormField
        control={form.control}
        name="assignment"
        render={({field}) => (
          <FormItem className="grow">
            <FormLabel className="text-xs">{i18n.t('Assigned To')} :</FormLabel>

            <Select
              value={field.value ? field.value.toString() : ''}
              onValueChange={value => {
                field.onChange(Number(value));
              }}
              defaultValue={field.value?.toString()}>
              <FormControl>
                <div className="flex">
                  <SelectTrigger
                    className={cn('w-full text-xs text-muted-foreground', {
                      ['text-foreground']: field.value,
                    })}>
                    <SelectValue
                      placeholder={i18n.t('Select assignee')}></SelectValue>
                  </SelectTrigger>
                  {field.value && (
                    <RemoveIcon
                      className="h-4 w-4 hover:stroke-destructive -ms-12 mt-3 cursor-pointer"
                      onClick={handleClear}
                    />
                  )}
                </div>
              </FormControl>
              <SelectContent className="w-full">
                <SelectItem
                  value={ASSIGNMENT.CUSTOMER.toString()}
                  className="text-xs">
                  {clientPartner?.simpleFullName}
                </SelectItem>
                <SelectItem
                  value={ASSIGNMENT.PROVIDER.toString()}
                  className="text-xs">
                  {company?.name}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

type FieldProps = {
  form: UseFormReturn<z.infer<typeof TicketFilterSchema>>;
};
