'use client';

import {useRef} from 'react';
import {useForm, useFieldArray} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {MdAdd, MdDelete, MdUploadFile, MdImage} from 'react-icons/md';
import Link from 'next/link';

import {
  Button,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@/ui/components';
import type {MarketplaceCategory} from '../../../types';
import {
  SellerProductSchema,
  type SellerProductFormData,
} from '../../../utils/validators';

type SellerProductFormProps = {
  categories: MarketplaceCategory[];
  workspaceURI: string;
  initialValues?: Partial<SellerProductFormData>;
  onSubmit?: (data: FormData, status: 'draft' | 'submitted') => Promise<void>;
};

function makeVersionRow() {
  return {
    _key: Math.random().toString(36).slice(2),
    version: '',
    releaseNotes: '',
    releaseDate: '',
    isLatest: false,
    file: null,
    fileName: '',
  };
}

export function SellerProductForm({
  categories,
  workspaceURI,
  initialValues,
  onSubmit,
}: SellerProductFormProps) {
  const form = useForm<SellerProductFormData>({
    resolver: zodResolver(SellerProductSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      longDescription: initialValues?.longDescription ?? '',
      isFree: initialValues?.isFree ?? true,
      salePrice: initialValues?.salePrice ?? 0,
      categoryIds: initialValues?.categoryIds ?? [],
      versions: initialValues?.versions?.length
        ? initialValues.versions
        : [makeVersionRow()],
      marketplaceStatusSelect: 'draft',
    },
  });

  const {fields, append, remove, update} = useFieldArray({
    control: form.control,
    name: 'versions',
  });

  const coverRef = useRef<HTMLInputElement>(null);
  const coverPreviewRef = useRef<string | null>(null);

  const isFree = form.watch('isFree');
  const submitting = form.formState.isSubmitting;

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    coverPreviewRef.current = url;
    form.trigger();
  };

  const handleSubmit = async (
    data: SellerProductFormData,
    status: 'draft' | 'submitted',
  ) => {
    const fd = new FormData();
    fd.set('name', data.name);
    fd.set('description', data.description ?? '');
    fd.set('longDescription', data.longDescription ?? '');
    fd.set('marketplaceStatusSelect', status);
    fd.set('isFree', String(data.isFree));
    if (!data.isFree && data.salePrice != null) {
      fd.set('salePrice', String(data.salePrice));
    }
    data.categoryIds.forEach(id => fd.append('categoryIds', id));
    data.versions.forEach((v, i) => {
      fd.set(`versions[${i}][version]`, v.version);
      fd.set(`versions[${i}][releaseNotes]`, v.releaseNotes ?? '');
      fd.set(`versions[${i}][releaseDate]`, v.releaseDate ?? '');
      fd.set(`versions[${i}][isLatest]`, String(v.isLatest));
      if (v.file) fd.set(`versions[${i}][file]`, v.file);
    });
    if (coverRef.current?.files?.[0])
      fd.set('picture', coverRef.current.files[0]);
    await onSubmit?.(fd, status);
  };

  const setLatestVersion = (index: number) => {
    fields.forEach((_f, i) => {
      update(i, {...form.getValues(`versions.${i}`), isLatest: i === index});
    });
  };

  return (
    <Form {...form}>
      <form className="flex flex-col gap-8">
        {/* Basic Info */}
        <section className="bg-card rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="font-semibold text-base">Basic information</h2>

          <FormField
            control={form.control}
            name="name"
            render={({field}) => (
              <FormItem>
                <FormLabel>
                  Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Axelor CRM Connector" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryIds"
            render={({field}) => (
              <FormItem>
                <FormLabel>
                  Categories <span className="text-destructive">*</span>
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => {
                    const active = field.value.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          const next = active
                            ? field.value.filter(id => id !== cat.id)
                            : [...field.value, cat.id];
                          field.onChange(next);
                        }}
                        className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground hover:bg-muted'
                        }`}>
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({field}) => (
              <FormItem>
                <FormLabel>Short description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={2}
                    placeholder="One-line summary shown on product cards"
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longDescription"
            render={({field}) => (
              <FormItem>
                <FormLabel>Full description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={6}
                    placeholder="Detailed description shown on the product detail page (HTML supported)"
                    className="resize-none font-mono"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Pricing */}
        <section className="bg-card rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="font-semibold text-base">Pricing</h2>

          <FormField
            control={form.control}
            name="isFree"
            render={({field}) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer">
                  This product is free
                </FormLabel>
              </FormItem>
            )}
          />

          {!isFree && (
            <FormField
              control={form.control}
              name="salePrice"
              render={({field}) => (
                <FormItem>
                  <FormLabel>
                    Price <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative w-48">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        €
                      </span>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        className="pl-7"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </section>

        {/* Cover image */}
        <section className="bg-card rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="font-semibold text-base">Cover image</h2>
          <div
            className="relative w-full h-48 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
            onClick={() => coverRef.current?.click()}>
            {coverPreviewRef.current ? (
              <img
                src={coverPreviewRef.current}
                alt="Cover preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <>
                <MdImage className="text-3xl text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload cover image
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 5MB
                </p>
              </>
            )}
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>
        </section>

        {/* Versions */}
        <section className="bg-card rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">
              Software versions <span className="text-destructive">*</span>
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(makeVersionRow())}
              className="gap-1.5">
              <MdAdd />
              Add version
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {fields.map((field, idx) => (
              <VersionRow
                key={field._key}
                form={form}
                index={idx}
                isOnly={fields.length === 1}
                onRemove={() => remove(idx)}
                onSetLatest={() => setLatestVersion(idx)}
              />
            ))}
          </div>
          {form.formState.errors.versions?.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.versions.root.message}
            </p>
          )}
        </section>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`${workspaceURI}/marketplace/my-products`}>Cancel</Link>
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={form.handleSubmit(data => handleSubmit(data, 'draft'))}>
              {submitting ? 'Saving...' : 'Save as draft'}
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={form.handleSubmit(data =>
                handleSubmit(data, 'submitted'),
              )}>
              {submitting ? 'Submitting...' : 'Submit for review'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

type VersionRowProps = {
  form: ReturnType<typeof useForm<SellerProductFormData>>;
  index: number;
  isOnly: boolean;
  onRemove: () => void;
  onSetLatest: () => void;
};

function VersionRow({
  form,
  index,
  isOnly,
  onRemove,
  onSetLatest,
}: VersionRowProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const fileName = form.watch(`versions.${index}.fileName`);
  const isLatest = form.watch(`versions.${index}.isLatest`);

  return (
    <div className="border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Version {index + 1}
        </span>
        {!isOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-7 w-7 text-muted-foreground hover:text-destructive">
            <MdDelete className="text-base" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name={`versions.${index}.version`}
          render={({field}) => (
            <FormItem>
              <FormLabel className="text-xs">
                Version string <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. 1.0.0"
                  className="font-mono"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`versions.${index}.releaseDate`}
          render={({field}) => (
            <FormItem>
              <FormLabel className="text-xs">Release date</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`versions.${index}.releaseNotes`}
        render={({field}) => (
          <FormItem>
            <FormLabel className="text-xs">Release notes</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={2}
                placeholder="What changed in this version?"
                className="resize-none"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div
        className="flex items-center gap-3 border border-dashed rounded-lg px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => fileRef.current?.click()}>
        <MdUploadFile className="text-xl text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">
            {fileName || 'Upload software file'}
          </p>
          <p className="text-xs text-muted-foreground">
            {fileName ? 'Click to change file' : 'ZIP, EXE, DMG, JAR, etc.'}
          </p>
        </div>
        {fileName && (
          <span className="text-xs text-green-600 font-medium shrink-0">
            ✓ Ready
          </span>
        )}
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0] ?? null;
            form.setValue(`versions.${index}.file`, file);
            form.setValue(`versions.${index}.fileName`, file?.name ?? '');
          }}
        />
      </div>

      <FormItem className="flex items-center gap-2 space-y-0">
        <FormControl>
          <Checkbox
            checked={isLatest}
            onCheckedChange={checked => checked && onSetLatest()}
          />
        </FormControl>
        <FormLabel className="text-xs text-muted-foreground font-normal cursor-pointer">
          Mark as latest version
        </FormLabel>
      </FormItem>
    </div>
  );
}

export default SellerProductForm;
