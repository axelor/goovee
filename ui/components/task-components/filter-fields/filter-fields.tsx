import {FieldPath, FieldValues, Path, UseFormReturn} from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../form';
import {i18n} from '@/lib/core/locale';
import {Input} from '../../input';
import {Cloned} from '@/types/util';
import {TaskCategory, TaskPriority, TaskStatus} from '@/orm/project-task';
import {Checkbox} from '../../checkbox';
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from '../../multi-select';

export type DatesFieldProps<T extends FieldValues, N extends FieldPath<T>> = {
  form: UseFormReturn<T>;
  name: N;
  title?: string;
};

export function DatesField<T extends FieldValues, N extends FieldPath<T>>(
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

export type PriorityFieldProps = {
  form: UseFormReturn<{priority?: string[] | undefined}>;
  priorities: Cloned<TaskPriority>[];
};
export function PriorityField(props: PriorityFieldProps) {
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

export type StatusFieldProps = {
  form: UseFormReturn<{status?: string[] | undefined}>;
  statuses: Cloned<TaskStatus>[];
};

export function StatusField(props: StatusFieldProps) {
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

export type CategoryFieldProps = {
  form: UseFormReturn<{category?: string[] | undefined}>;
  categories: Cloned<TaskCategory>[];
};
export function CategoryField(props: CategoryFieldProps) {
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

type InvoicedFieldProps = {
  form: UseFormReturn<{invoiced?: boolean | undefined}>;
};
export function InvoicedField(props: InvoicedFieldProps) {
  const {form} = props;
  return (
    <FormField
      control={form.control}
      name="invoiced"
      render={({field}) => (
        <FormItem className="flex items-center space-y-0">
          <FormControl>
            <Checkbox
              checked={!!field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <FormLabel className="ms-4 text-xs">{i18n.t('Invoiced')}</FormLabel>
        </FormItem>
      )}
    />
  );
}
