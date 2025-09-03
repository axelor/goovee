'use client';

import {i18n} from '@/locale';
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
import {Input} from '@/ui/components/input';
import {useResponsive} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {decodeFilter, encodeFilter} from '@/utils/url';
import {zodResolver} from '@hookform/resolvers/zod';
import {X as RemoveIcon} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useForm, UseFormReturn} from 'react-hook-form';
import {FaFilter} from 'react-icons/fa';
import {z} from 'zod';

import {ASSIGNMENT, COMPANY, FIELDS} from '../../../constants';
import type {
  Category,
  ClientPartner,
  Company,
  ContactPartner,
  Priority,
  Status,
} from '../../../types';
import {SearchParams} from '../../../types/search-param';
import {
  EncodedFilter,
  EncodedFilterSchema,
  FilterSchema,
} from '../../../utils/validators';
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from '../multi-select';

type FilterProps = {
  url: string;
  searchParams: SearchParams;
  contacts: Cloned<ContactPartner>[];
  priorities: Cloned<Priority>[];
  statuses: Cloned<Status>[];
  categories: Cloned<Category>[];
  company?: Cloned<Company>;
  clientPartner?: Cloned<ClientPartner>;
  fields: PortalAppConfig['ticketingFieldSet'];
};

const defaultValues = {
  createdBy: [] as string[],
  managedBy: [] as string[],
  category: [] as string[],
  updatedOn: ['', ''] as [string, string],
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

  const allowedFields = useMemo(
    () => new Set(fields?.map(f => f.name)),
    [fields],
  );

  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const res = useResponsive();
  const small = (['xs', 'sm', 'md'] as const).some(x => res[x]);

  const form = useForm<z.infer<typeof FilterSchema>>({
    resolver: zodResolver(FilterSchema),
    defaultValues,
  });

  const onSubmit = (value: z.infer<typeof FilterSchema>) => {
    const filter = EncodedFilterSchema.parse(value);
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    if (filter) {
      params.set('filter', encodeFilter<EncodedFilter>(filter));
    } else {
      params.delete('filter');
    }
    params.delete('title');

    const route = `${url}?${params.toString()}`;
    router.replace(route);
    setOpen(false);
  };

  useEffect(() => {
    const {success, data} = EncodedFilterSchema.safeParse(filter);
    if (!success || !data) {
      form.reset(defaultValues);
    } else {
      form.reset({...defaultValues, ...data});
    }
  }, [filter, form]);
  const [Controller, Trigger, Content] = small
    ? ([Drawer, DrawerTrigger, DrawerContent] as const)
    : ([Popover, PopoverTrigger, PopoverContent] as const);

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
          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)}
              className="relative overflow-x-hidden lg:h-fit lg:max-h-[--radix-popper-available-height] lg:overflow-y-auto p-4">
              <div className="space-y-4">
                {(allowedFields.has(FIELDS.CREATED_BY) ||
                  allowedFields.has(FIELDS.MANAGED_BY)) && (
                  <MyTicketsField form={form} />
                )}
                {!form.watch('myTickets') && (
                  <>
                    {allowedFields.has(FIELDS.CREATED_BY) && (
                      <CreatedByField
                        form={form}
                        contacts={contacts}
                        company={company}
                      />
                    )}
                    {allowedFields.has(FIELDS.MANAGED_BY) && (
                      <ManagedByField form={form} contacts={contacts} />
                    )}
                  </>
                )}
                {allowedFields.has(FIELDS.ASSIGNMENT) && (
                  <AssignedToField
                    form={form}
                    company={company}
                    clientPartner={clientPartner}
                  />
                )}
                {allowedFields.has(FIELDS.UPDATED_ON) && (
                  <DatesField form={form} />
                )}
                {allowedFields.has(FIELDS.PRIORITY) && (
                  <PriorityField form={form} priorities={priorities} />
                )}
                {allowedFields.has(FIELDS.STATUS) && (
                  <StatusField form={form} statuses={statuses} />
                )}
                {allowedFields.has(FIELDS.CATEGORY) && (
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
        </Content>
      </Controller>
    </div>
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
function DatesField(props: FieldProps) {
  const {form} = props;
  return (
    <div>
      <div className="md:flex gap-2 block">
        <FormField
          control={form.control}
          name="updatedOn.0"
          render={({field}) => (
            <FormItem className="grow">
              <FormLabel className="text-xs">{i18n.t('From')} :</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  placeholder="DD/MM/YYYY"
                  {...field}
                  className="block text-xs"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="updatedOn.1"
          render={({field}) => (
            <FormItem className="grow">
              <FormLabel className="text-xs">{i18n.t('To')} :</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  placeholder="DD/MM/YYYY"
                  {...field}
                  className="block text-xs"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {form.formState.errors.updatedOn?.root && (
        <FormMessage>
          {form.formState.errors.updatedOn.root.message}
        </FormMessage>
      )}
    </div>
  );
}

function PriorityField(props: FieldProps & Pick<FilterProps, 'priorities'>) {
  const {form, priorities} = props;
  return (
    <FormField
      control={form.control}
      name="priority"
      render={({field}) => (
        <FormItem>
          <FormLabel className="text-xs">{i18n.t('Priority')} :</FormLabel>
          {priorities.map(priority => (
            <FormField
              key={priority.id}
              control={form.control}
              name="priority"
              render={({field}) => (
                <FormItem className="flex items-center space-y-0">
                  <FormControl>
                    <Checkbox
                      name={priority.id}
                      checked={field.value?.includes(priority.id)}
                      onCheckedChange={checked =>
                        checked
                          ? field.onChange([
                              ...(field.value ?? []),
                              priority.id,
                            ])
                          : field.onChange(
                              field.value?.filter(
                                value => value !== priority.id,
                              ),
                            )
                      }
                    />
                  </FormControl>
                  <FormLabel className="ml-4 text-xs">
                    {priority.name}
                  </FormLabel>
                </FormItem>
              )}
            />
          ))}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type FieldProps = {
  form: UseFormReturn<z.infer<typeof FilterSchema>>;
};

function StatusField(props: FieldProps & Pick<FilterProps, 'statuses'>) {
  const {form, statuses} = props;
  return (
    <FormField
      control={form.control}
      name="status"
      render={({field}) => (
        <FormItem>
          <FormLabel className="text-xs">{i18n.t('Status')} :</FormLabel>
          <MultiSelector
            onValuesChange={field.onChange}
            className="space-y-0"
            values={field.value ?? []}>
            <MultiSelectorTrigger
              renderLabel={value =>
                statuses.find(status => status.id === value)?.name
              }>
              <MultiSelectorInput
                placeholder={i18n.t('Select statuses')}
                className="text-xs"
              />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList>
                {statuses.map(status => (
                  <MultiSelectorItem key={status.id} value={status.id}>
                    <div className="flex items-center space-x-2">
                      <span>{status.name}</span>
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

function CategoryField(props: FieldProps & Pick<FilterProps, 'categories'>) {
  const {form, categories} = props;
  return (
    <FormField
      control={form.control}
      name="category"
      render={({field}) => (
        <FormItem>
          <FormLabel className="text-xs">{i18n.t('Category')} :</FormLabel>
          <MultiSelector
            onValuesChange={field.onChange}
            className="space-y-0"
            values={field.value ?? []}>
            <MultiSelectorTrigger
              renderLabel={value =>
                categories.find(category => category.id === value)?.name
              }>
              <MultiSelectorInput
                placeholder={i18n.t('Select categories')}
                className="text-xs"
              />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList>
                {categories.map(category => (
                  <MultiSelectorItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-2">
                      <span>{category.name}</span>
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
