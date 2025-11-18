'use client';

import {useMemo, useEffect, type KeyboardEvent} from 'react';
import {Search as SearchIcon, X as ClearIcon} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';

import {i18n} from '@/lib/core/locale';
import {useSearchParams} from '@/ui/hooks';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/ui/components/form';
import {Input} from '@/ui/components/input';
import {Button} from '@/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components';

import {defaultSortOption, sortOptions} from '../../../constants';

const FilterSchema = z.object({
  city: z.string().optional(),
  zip: z.string().optional(),
  sort: z.string().optional(),
});

type FilterValues = z.infer<typeof FilterSchema>;

export function Filter() {
  const {searchParams, update} = useSearchParams();

  const defaultValues = useMemo(
    () => ({
      city: searchParams.get('city') ?? '',
      zip: searchParams.get('zip') ?? '',
      sort: searchParams.get('sort') ?? defaultSortOption.value,
    }),
    [searchParams],
  );

  const form = useForm<FilterValues>({
    resolver: zodResolver(FilterSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleUpdate = (key: keyof FilterValues) => {
    const value = form.getValues(key);
    update([
      {key, value},
      {key: 'page', value: '1'},
    ]);
  };

  const handleClear = (key: keyof FilterValues) => {
    form.setValue(key, '');
    update([
      {key, value: ''},
      {key: 'page', value: '1'},
    ]);
  };

  const handleSortChange = (value: string) => {
    form.setValue('sort', value);
    update([
      {key: 'sort', value},
      {key: 'page', value: '1'},
    ]);
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    key: keyof FilterValues,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdate(key);
    }
  };

  return (
    <Form {...form}>
      <form className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 items-end">
        <FormField
          control={form.control}
          name="city"
          render={({field}) => (
            <FormItem>
              <FormLabel className="hidden lg:inline">
                {i18n.t('City')}
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder={i18n.t('Search by city')}
                    {...field}
                    className="pr-20"
                    onKeyDown={e => handleKeyDown(e, 'city')}
                  />
                </FormControl>
                <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    tabIndex={-1}
                    onClick={() => handleClear('city')}>
                    <ClearIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    tabIndex={-1}
                    onClick={() => handleUpdate('city')}>
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="zip"
          render={({field}) => (
            <FormItem>
              <FormLabel className="hidden lg:inline">
                {i18n.t('Zip Code')}
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder={i18n.t('Search by zip code')}
                    {...field}
                    className="pr-20"
                    onKeyDown={e => handleKeyDown(e, 'zip')}
                  />
                </FormControl>
                <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    tabIndex={-1}
                    onClick={() => handleClear('zip')}>
                    <ClearIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    tabIndex={-1}
                    onClick={() => handleUpdate('zip')}>
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sort"
          render={({field}) => (
            <FormItem>
              <FormLabel className="hidden lg:inline">
                {i18n.t('Sort by')}
              </FormLabel>
              <Select
                onValueChange={handleSortChange}
                defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={i18n.t('Select sort')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {i18n.t(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
