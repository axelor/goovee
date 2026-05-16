'use client';

import {useState, useTransition} from 'react';
import {useForm, useFieldArray} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {ChevronLeft, ChevronRight, Plus, Trash2} from 'lucide-react';
import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {Input} from '@/ui/components/input';
import {RichTextEditor} from '@/ui/components';
import {
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
} from '@/ui/components/responsive-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import {useToast} from '@/ui/hooks';
import {packIntoFormData} from '@/utils/formdata';
import {cn} from '@/utils/css';
import type {Cloned} from '@/types/util';
import {MARKETPLACE_TYPE} from '../../../constant/marketplace-types';
import {MARKETPLACE_VERSION_STATUS} from '../../../constant/statuses';
import {GRADIENT_MAP} from '../../../constant/gradients';
import {ProductIcon} from '../product-icon';
import {VersionForm} from './version-form';
import {
  productFormSchema,
  type ProductFormValues,
  type VersionFormValues,
} from './schema';
import type {
  CompatibilityVersion,
  ListCategory,
  MyProductWithVersions,
} from '../../../orm/orm';

const ICON_CODES = Array.from({length: 12}, (_, i) => `icon-${i + 1}`);
const COVER_CODES = Object.keys(GRADIENT_MAP);

type ProductFormProps = {
  mode: 'create' | 'edit';
  workspaceURI: string;
  categories: Cloned<ListCategory>[];
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  initial?: Cloned<MyProductWithVersions>;
  defaultType?: MARKETPLACE_TYPE;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ProductForm({
  mode,
  workspaceURI,
  categories,
  compatibilityVersions,
  initial,
  defaultType,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const {toast} = useToast();
  const [pending, startTransition] = useTransition();
  const [versionIndex, setVersionIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<'next' | 'prev'>('next');

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: buildDefaults(initial, defaultType),
    mode: 'onSubmit',
  });

  const {control, handleSubmit, watch} = form;
  const {fields, insert, remove} = useFieldArray({
    control,
    name: 'versions',
  });

  const type = watch('marketplaceTypeSelect');
  const productName = watch('name');
  const title =
    mode === 'edit'
      ? `${i18n.t('Edit')} · ${productName || initial?.name || ''}`
      : type === MARKETPLACE_TYPE.APP
        ? i18n.t('Publish a new app')
        : i18n.t('Publish a new skill');
  const subtitle =
    mode === 'edit'
      ? i18n.t('Update metadata or release a new version')
      : type === MARKETPLACE_TYPE.APP
        ? i18n.t('Apps hub · Discover and ship')
        : i18n.t('Skills hub · Open source, free for everyone');

  const submit = (status: MARKETPLACE_VERSION_STATUS) =>
    handleSubmit(values => {
      const payload = {
        ...values,
        versions: values.versions.map(v => ({
          ...v,
          statusSelect: v.id ? v.statusSelect : status,
        })),
        workspaceURI,
      };
      startTransition(async () => {
        try {
          const formData = packIntoFormData(payload);
          const response = await fetch(
            `${workspaceURI}/marketplace/api/products`,
            {method: 'POST', body: formData},
          );
          const result = await response.json();
          if (!response.ok || result?.error) {
            toast({
              variant: 'destructive',
              title: result?.message ?? i18n.t('Failed to save'),
            });
            return;
          }
          toast({
            variant: 'success',
            title:
              status === MARKETPLACE_VERSION_STATUS.PUBLISHED
                ? i18n.t('Published')
                : i18n.t('Saved as draft'),
          });
          onSuccess?.();
        } catch (e) {
          toast({
            variant: 'destructive',
            title: i18n.t('An unexpected error occurred'),
          });
        }
      });
    });

  const addVersion = () => {
    const blank: VersionFormValues = {
      versionNumber: '',
      changelog: '',
      statusSelect: MARKETPLACE_VERSION_STATUS.DRAFT,
      compatibilitySetIds: [],
    };
    insert(0, blank);
    setVersionIndex(0);
  };

  const removeVersion = (idx: number) => {
    if (fields.length <= 1) return;
    remove(idx);
    setVersionIndex(i => Math.max(0, Math.min(i, fields.length - 2)));
  };

  const goPrev = () => {
    setSlideDir('prev');
    setVersionIndex(i => (i - 1 + fields.length) % fields.length);
  };
  const goNext = () => {
    setSlideDir('next');
    setVersionIndex(i => (i + 1) % fields.length);
  };

  const currentVersion = fields[versionIndex];

  return (
    <Form {...form}>
      {/* Header */}
      <div className="border-b border-border px-6 py-5">
        <ResponsiveDialogTitle className="text-2xl font-semibold text-foreground">
          {title}
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription className="mt-1 text-sm text-muted-foreground">
          {subtitle}
        </ResponsiveDialogDescription>
      </div>

      {/* Body */}
      <div className="max-h-[70vh] space-y-16 overflow-y-auto bg-muted/30 p-6">
        {/* ---- Product section ---- */}
        <section className="space-y-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">
            {i18n.t('Product details')}
          </h3>

          <FormField
            control={control}
            name="marketplaceTypeSelect"
            render={({field}) => (
              <FormItem>
                <FormLabel>{i18n.t('Type')} *</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={mode === 'edit'}>
                    <SelectTrigger className="w-full md:w-[260px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MARKETPLACE_TYPE.SKILL}>
                        {i18n.t('Skill')}
                      </SelectItem>
                      <SelectItem value={MARKETPLACE_TYPE.APP}>
                        {i18n.t('App')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]">
            <FormField
              control={control}
              name="name"
              render={({field}) => (
                <FormItem>
                  <FormLabel>{i18n.t('Name')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={i18n.t('e.g. BPM Workflow Generator')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="productCategoryId"
              render={({field}) => (
                <FormItem>
                  <FormLabel>{i18n.t('Category')} *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={i18n.t('Select')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="description"
            render={({field}) => (
              <FormItem>
                <FormLabel>{i18n.t('Short description')} *</FormLabel>
                <FormControl>
                  <Input
                    placeholder={i18n.t('One-line summary, ~140 characters')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="longDescription"
            render={({field}) => (
              <FormItem>
                <FormLabel>{i18n.t('Long description')}</FormLabel>
                <FormControl>
                  <RichTextEditor
                    content={field.value}
                    onChange={field.onChange}
                    classNames={{
                      wrapperClassName: 'overflow-visible',
                      toolbarClassName: 'mt-0',
                      editorClassName: 'px-4',
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="marketplaceCoverStyle"
            render={({field}) => (
              <FormItem>
                <FormLabel>{i18n.t('Cover style')} *</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
                    {COVER_CODES.map(code => {
                      const selected = field.value === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => field.onChange(code)}
                          className={cn(
                            'aspect-square rounded-lg bg-gradient-to-br transition-all',
                            GRADIENT_MAP[code],
                            selected
                              ? 'ring-2 ring-primary ring-offset-2'
                              : 'hover:ring-2 hover:ring-foreground/20',
                          )}
                          aria-label={code}
                        />
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="marketplaceIconCode"
            render={({field}) => (
              <FormItem>
                <FormLabel>{i18n.t('Icon')} *</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {ICON_CODES.map(code => {
                      const selected = field.value === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => field.onChange(code)}
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-lg border transition-all',
                            selected
                              ? 'border-palette-indigo bg-palette-indigo/10 text-palette-indigo ring-1 ring-palette-indigo'
                              : 'border-border bg-background text-foreground hover:ring-1 hover:ring-foreground/20',
                          )}>
                          <ProductIcon
                            code={code}
                            className={cn(
                              'h-5 w-5',
                              selected && 'text-palette-indigo',
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={control}
              name="documentationUrl"
              render={({field}) => (
                <FormItem>
                  <FormLabel>{i18n.t('Documentation URL')}</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="supportIssuesUrl"
              render={({field}) => (
                <FormItem>
                  <FormLabel>{i18n.t('Issues URL')}</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="supportContactUrl"
              render={({field}) => (
                <FormItem>
                  <FormLabel>{i18n.t('Contact URL')}</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ---- Versions section ---- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-foreground">
                {i18n.t('Versions')}
              </h3>
              {fields.length > 1 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={goPrev}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span>
                    {versionIndex + 1} / {fields.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={goNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {fields.length > 1 && !watch(`versions.${versionIndex}.id`) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVersion(versionIndex)}
                  className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-1 h-4 w-4" />
                  {i18n.t('Remove')}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVersion}>
                <Plus className="mr-1 h-4 w-4" />
                {i18n.t('Add new version')}
              </Button>
            </div>
          </div>

          <div className="overflow-hidden">
            {currentVersion &&
              (() => {
                const editedVersionId = watch(`versions.${versionIndex}.id`);
                const existingVersion = editedVersionId
                  ? initial?.versionList?.find(v => v.id === editedVersionId)
                  : undefined;
                return (
                  <div
                    key={versionIndex}
                    className={cn(
                      'rounded-xl bg-card p-6 shadow-sm border',
                      'animate-in fade-in duration-300',
                      slideDir === 'next'
                        ? 'slide-in-from-right-12'
                        : 'slide-in-from-left-12',
                      {
                        'border-destructive/50': !editedVersionId,
                        'border-palette-amber/50':
                          editedVersionId &&
                          watch(`versions.${versionIndex}.statusSelect`) ===
                            MARKETPLACE_VERSION_STATUS.DRAFT,
                        'border-success/50':
                          editedVersionId &&
                          watch(`versions.${versionIndex}.statusSelect`) ===
                            MARKETPLACE_VERSION_STATUS.PUBLISHED,
                      },
                    )}>
                    <VersionForm
                      index={versionIndex}
                      compatibilityVersions={compatibilityVersions}
                      productId={initial?.id}
                      workspaceURI={workspaceURI}
                      existingBundleFileName={
                        existingVersion?.bundleFile?.fileName ?? undefined
                      }
                      existingBundleSizeText={
                        existingVersion?.bundleFile?.sizeText ?? undefined
                      }
                    />
                  </div>
                );
              })()}
          </div>
          {form.formState.errors.versions?.message && (
            <p className="text-xs text-destructive">
              {form.formState.errors.versions.message}
            </p>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}>
          {i18n.t('Cancel')}
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={submit(MARKETPLACE_VERSION_STATUS.DRAFT)}>
            {i18n.t('Save as draft')}
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={submit(MARKETPLACE_VERSION_STATUS.PUBLISHED)}>
            {mode === 'edit' ? i18n.t('Save & publish') : i18n.t('Publish')}
          </Button>
        </div>
      </div>
    </Form>
  );
}

function buildDefaults(
  initial: Cloned<MyProductWithVersions> | undefined,
  defaultType: MARKETPLACE_TYPE | undefined,
): Partial<ProductFormValues> {
  if (!initial) {
    return {
      marketplaceTypeSelect: defaultType ?? MARKETPLACE_TYPE.SKILL,
      name: '',
      description: '',
      longDescription: '',
      productCategoryId: '',
      marketplaceCoverStyle: 'gradient-1',
      marketplaceIconCode: 'icon-1',
      documentationUrl: '',
      supportIssuesUrl: '',
      supportContactUrl: '',
      versions: [
        {
          versionNumber: '1.0.0',
          changelog: '',
          statusSelect: MARKETPLACE_VERSION_STATUS.DRAFT,
          compatibilitySetIds: [],
        } satisfies VersionFormValues,
      ],
    };
  }
  return {
    id: initial.id,
    marketplaceTypeSelect:
      (initial.marketplaceTypeSelect as MARKETPLACE_TYPE) ??
      MARKETPLACE_TYPE.SKILL,
    name: initial.name ?? '',
    description: initial.description ?? '',
    longDescription: initial.longDescription ?? '',
    productCategoryId: initial.productCategory?.id ?? '',
    marketplaceCoverStyle: initial.marketplaceCoverStyle ?? 'gradient-1',
    marketplaceIconCode: initial.marketplaceIconCode ?? 'icon-1',
    documentationUrl: initial.documentationUrl ?? '',
    supportIssuesUrl: initial.supportIssuesUrl ?? '',
    supportContactUrl: initial.supportContactUrl ?? '',
    versions: (initial.versionList ?? []).map(v => ({
      id: v.id,
      versionNumber: v.versionNumber,
      changelog: v.changelog ?? '',
      statusSelect:
        v.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED
          ? MARKETPLACE_VERSION_STATUS.PUBLISHED
          : MARKETPLACE_VERSION_STATUS.DRAFT,
      compatibilitySetIds: (v.compatibilitySet ?? []).map(c => c.id),
      existingBundleFileId: v.bundleFile?.id,
    })),
  };
}
