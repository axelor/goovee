import {useRef} from 'react';
import {useFormContext} from 'react-hook-form';
import {Upload, FileArchive} from 'lucide-react';
import {i18n} from '@/locale';
import {Badge} from '@/ui/components/badge';
import {Button} from '@/ui/components/button';
import {Input} from '@/ui/components/input';
import {RichTextEditor} from '@/ui/components';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {cn} from '@/utils/css';
import type {Cloned} from '@/types/util';
import {MARKETPLACE_VERSION_STATUS} from '../../../constant/statuses';
import type {ProductFormValues} from './schema';
import type {CompatibilityVersion} from '../../../orm/orm';

const MAX_BUNDLE_SIZE = 20 * 1024 * 1024;

type VersionFormProps = {
  index: number;
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  productId?: string;
  workspaceURI: string;
  existingBundleFileName?: string;
  existingBundleSizeText?: string;
};

export function VersionForm({
  index,
  compatibilityVersions,
  productId,
  workspaceURI,
  existingBundleFileName,
  existingBundleSizeText,
}: VersionFormProps) {
  const {control, watch, setValue} = useFormContext<ProductFormValues>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const version = watch(`versions.${index}`);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BUNDLE_SIZE) return;
    setValue(`versions.${index}.bundleFile`, file, {shouldValidate: true});
  };

  const downloadHref =
    productId && version?.id
      ? `${workspaceURI}/marketplace/api/products/${productId}/versions/${version.id}/download`
      : undefined;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <FormField
          control={control}
          name={`versions.${index}.versionNumber` as const}
          render={({field}) => (
            <FormItem>
              <FormLabel>{i18n.t('Version number')} *</FormLabel>
              <FormControl>
                <Input placeholder="1.0.0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {version?.id && (
          <Badge
            variant={
              version.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED
                ? 'success'
                : 'secondary'
            }
            className="h-9 self-end capitalize">
            {version.statusSelect}
          </Badge>
        )}
      </div>

      <FormField
        control={control}
        name={`versions.${index}.compatibilitySetIds` as const}
        render={({field}) => (
          <FormItem>
            <FormLabel>{i18n.t('Axelor compatibility')} *</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2">
                {compatibilityVersions.map(v => {
                  const selected = field.value?.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? field.value.filter(id => id !== v.id)
                          : [...(field.value ?? []), v.id];
                        field.onChange(next);
                      }}
                      className={cn(
                        'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                        selected
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-background text-muted-foreground hover:border-foreground/50',
                      )}>
                      {v.title}
                    </button>
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
        name={`versions.${index}.changelog` as const}
        render={({field}) => (
          <FormItem>
            <FormLabel>{i18n.t('Changelog')}</FormLabel>
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
        name={`versions.${index}.bundleFile` as const}
        render={() => (
          <FormItem>
            <FormLabel>{i18n.t('Bundle file (.zip, up to 20 MB)')} *</FormLabel>
            <FormControl>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
                <FileArchive className="h-8 w-8 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  {version?.bundleFile ? (
                    <>
                      <p className="truncate text-sm text-foreground">
                        {version.bundleFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(version.bundleFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : existingBundleFileName && downloadHref ? (
                    <>
                      <a
                        href={downloadHref}
                        download
                        className="truncate text-sm font-medium text-primary hover:underline">
                        {existingBundleFileName}
                      </a>
                      {existingBundleSizeText && (
                        <p className="text-xs text-muted-foreground">
                          {existingBundleSizeText}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="truncate text-sm text-muted-foreground">
                      {i18n.t('No file selected')}
                    </p>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  className="hidden"
                  onChange={handleFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-1 h-4 w-4" />
                  {version?.bundleFile || version?.existingBundleFileId
                    ? i18n.t('Replace')
                    : i18n.t('Upload')}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
