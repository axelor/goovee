import {i18n} from '@/locale';
import type {TicketingConfig} from '../../../orm/config';
import type {Cloned} from '@/types/util';
import {
  Checkbox,
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
import {Input} from '@/ui/components/input';
import {cn} from '@/utils/css';
import {encodeFilter} from '@/utils/url';
import {zodResolver} from '@hookform/resolvers/zod';
import {X as RemoveIcon} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {Button} from '@/ui/components/button';
import {useCallback, useEffect, useMemo, useRef} from 'react';
import {
  useForm,
  UseFormReturn,
  FieldValues,
  FieldPath,
  Path,
} from 'react-hook-form';
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
  EncodedTicketFilter,
  EncodedTicketFilterSchema,
  TicketFilterSchema,
} from '../../../utils/validators';
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from '../multi-select';

export type FilterFormProps = {
  url: string;
  searchParams: SearchParams;
  contacts: Cloned<ContactPartner>[];
  priorities: Cloned<Priority>[];
  statuses: Cloned<Status>[];
  categories: Cloned<Category>[];
  company?: Cloned<Company> | null;
  clientPartner?: Cloned<ClientPartner> | null;
  fields: TicketingConfig['ticketingFieldSet'];
};

type TicketFilterFormProps = FilterFormProps & {
  close: () => void;
  filter: unknown;
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

const getDefaultValues = (filter: unknown) => {
  const {success, data} = EncodedTicketFilterSchema.safeParse(filter);
  if (!success || !data) {
    return defaultValues;
  } else {
    return {...defaultValues, ...data};
  }
};
export function TicketFilterForm(props: TicketFilterFormProps) {
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

  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<z.infer<typeof TicketFilterSchema>>({
    resolver: zodResolver(TicketFilterSchema),
    defaultValues: getDefaultValues(filter),
  });

  const onSubmit = (value: z.infer<typeof TicketFilterSchema>) => {
    const encodedFilter = EncodedTicketFilterSchema.parse(value);
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    if (encodedFilter) {
      params.set('filter', encodeFilter<EncodedTicketFilter>(encodedFilter));
    } else {
      params.delete('filter');
    }
    params.delete('title');

    const route = `${url}?${params.toString()}`;
    router.replace(route);
    close();
  };

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
            <DatesField form={form} name="updatedOn" />
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

function ManagedByField(
  props: FieldProps & Pick<TicketFilterFormProps, 'contacts'>,
) {
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
  props: FieldProps & Pick<TicketFilterFormProps, 'contacts' | 'company'>,
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
  props: FieldProps & Pick<TicketFilterFormProps, 'company' | 'clientPartner'>,
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

type DatesFieldProps<T extends FieldValues, N extends FieldPath<T>> = {
  form: UseFormReturn<T>;
  name: N;
  title?: string;
};

function DatesField<T extends FieldValues, N extends FieldPath<T>>(
  props: DatesFieldProps<T, N>,
) {
  const {form, name, title} = props;
  return (
    <div>
      <div className="md:flex gap-2 block items-end">
        <FormField
          control={form.control}
          name={`${name}.0` as Path<T>}
          render={({field}) => (
            <FormItem className="grow">
              {title && (
                <FormLabel className="text-xs block">
                  {i18n.t(title)}:
                </FormLabel>
              )}
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
          name={`${name}.1` as Path<T>}
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
      {form.formState.errors[name]?.root &&
        'message' in form.formState.errors[name].root && (
          <FormMessage>{form.formState.errors[name].root.message}</FormMessage>
        )}
    </div>
  );
}

function PriorityField(
  props: FieldProps & Pick<TicketFilterFormProps, 'priorities'>,
) {
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
  form: UseFormReturn<z.infer<typeof TicketFilterSchema>>;
};

function StatusField(
  props: FieldProps & Pick<TicketFilterFormProps, 'statuses'>,
) {
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

function CategoryField(
  props: FieldProps & Pick<TicketFilterFormProps, 'categories'>,
) {
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
