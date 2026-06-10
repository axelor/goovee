import {i18n} from '@/locale';
import type {UseStagedUpload} from '@/lib/core/upload/use-staged-upload';
import type {Cloned} from '@/types/util';
import {RichTextEditor} from '@/ui/components';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/ui/components/form';
import {Input} from '@/ui/components/input';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {getFileSizeText} from '@/utils/files';
import {useRef, type RefObject} from 'react';
import {useFormContext, type FieldPath} from 'react-hook-form';
import type {CompatibilityVersion} from '../../../../orm';
import {FormMessageSpace} from '../../shared/form-message-space';
import {
  BundleDropzone,
  type StagedBundle,
} from '../../versions/bundle-dropzone';
import {MAX_BUNDLE_SIZE} from '../../versions/version-form/validator';
import type {CombinedEditValues} from './combined-validator';

type VersionFieldsProps = {
  /** Field-array path of the version under the cursor, e.g. `versions.0` or
   *  `newVersions.1`. */
  namePrefix: string;
  /** Stable field-array id (rhfId) of this row — keys its bundle upload across
   *  the per-version remount (namePrefix is index-based and shifts). */
  rowKey: string;
  /** The persisted bundle (read-only context, not a form value) for the
   *  dropzone's current-file display. Absent for new versions. */
  existingBundle?: {id: string; fileName?: string; sizeText?: string};
  /** Session-level bundle upload hook (lifted so an upload survives this
   *  component remounting on version navigation). */
  bundleUpload: UseStagedUpload;
  /** rowKey → in-flight bundle upload item id, owned by the session so it
   *  survives the remount. */
  bundleItemByRow: RefObject<Map<string, string>>;
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  workspaceURI: string;
  productId: string;
};

/** Map a live upload item's status to the dropzone's narrower set (an aborted
 *  item is dropped from the hook on cancel, so it shouldn't surface — treat any
 *  stray one as a failure). */
function toStagedStatus(
  status: UseStagedUpload['uploads'][number]['status'],
): StagedBundle['status'] {
  return status === 'aborted' ? 'error' : status;
}

/**
 * Version input fields for the combined editor, bound to one row of the form's
 * version array via `namePrefix`. The status control and cursor nav live around
 * this (in version-section); this renders only the editable fields. Read-only
 * context (current bundle) comes in via `existingBundle`, not the form. A picked
 * bundle is staged immediately (token stored in `bundleToken`); the dropzone
 * shows live progress sourced from the session upload hook.
 */
export function VersionFields({
  namePrefix,
  rowKey,
  existingBundle,
  bundleUpload,
  bundleItemByRow,
  compatibilityVersions,
  workspaceURI,
  productId,
}: VersionFieldsProps) {
  const {toast} = useToast();
  const {control, setValue, getValues, register} =
    useFormContext<CombinedEditValues>();

  const path = (field: string) =>
    `${namePrefix}.${field}` as FieldPath<CombinedEditValues>;

  /* The version id is immutable and the component remounts per version, so read
   * it once (no need for a useWatch subscription). */
  const rowId = getValues(path('id')) as string | undefined;

  /* Seed the editor ONCE, on mount, from the row's current value. The component
   * is keyed by the cursor, so it remounts per version with the right value.
   * This must be a stable value: RichTextEditor re-seeds (and resets the caret
   * to the start) whenever its `content` prop changes, so recomputing it via
   * getValues on every render would feed the editor's own onChange output back
   * as new `content` and displace the first typed character to the end. */
  const initialChangelogRef = useRef<string>(
    (getValues(path('changelog')) as string) ?? '',
  );

  const downloadHref =
    rowId && existingBundle
      ? `${workspaceURI}/marketplace/api/products/${productId}/versions/${rowId}/download`
      : undefined;

  /* This row's live bundle upload, re-found after a remount via the session-
   * owned id map. Drives the dropzone's progress / ready / error display. */
  const itemId = bundleItemByRow.current.get(rowKey);
  const item = itemId
    ? bundleUpload.uploads.find(candidate => candidate.id === itemId)
    : undefined;
  const staged: StagedBundle | undefined = item
    ? {
        fileName: item.fileName,
        progress: item.progress,
        status: toStagedStatus(item.status),
        error: item.error,
      }
    : undefined;

  const handleBundleFile = (file: File) => {
    /* Re-pick supersedes any prior attempt for this row: abort/drop it and
     * clear the staged token before staging the new file. */
    const prior = bundleItemByRow.current.get(rowKey);
    if (prior) bundleUpload.remove(prior);
    setValue(path('bundleToken'), undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
    const {ids, done} = bundleUpload.upload([file], {
      purpose: 'marketplace:bundle',
    });
    // ids are available synchronously, so the row's id is recorded before any
    // navigation could remount this component.
    bundleItemByRow.current.set(rowKey, ids[0]);
    done.then(([result]) => {
      if (!result) return; // failed/aborted — the dropzone shows the error
      setValue(path('bundleToken'), result.token, {
        shouldValidate: true,
        shouldDirty: true,
      });
    });
  };

  const handleBundleClear = () => {
    const prior = bundleItemByRow.current.get(rowKey);
    if (prior) bundleUpload.remove(prior);
    bundleItemByRow.current.delete(rowKey);
    setValue(path('bundleToken'), undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="space-y-8">
      {/* RHF persists field-array values only for registered fields, and this
          one has no visible input — register it (hidden) so appended
          (paginated) rows keep their id and aren't treated as brand-new. */}
      <input type="hidden" {...register(path('id'))} />

      <FormField
        control={control}
        name={path('versionNumber')}
        render={({field}) => (
          <FormItem>
            <FormLabel>{i18n.t('Version number')} *</FormLabel>
            <FormControl>
              {/* Dynamic field path widens `field.value` to the whole value
                  union; this row is always a string. */}
              <Input
                placeholder="1.0.0"
                {...field}
                value={(field.value as string | undefined) ?? ''}
              />
            </FormControl>
            <FormMessageSpace />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={path('compatibilitySetIds')}
        render={({field}) => {
          const value = (field.value as string[] | undefined) ?? [];
          return (
            <FormItem>
              <FormLabel>{i18n.t('Axelor compatibility')} *</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {compatibilityVersions.map(compatibility => {
                    const selected = value.includes(compatibility.id);
                    return (
                      <button
                        key={compatibility.id}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            selected
                              ? value.filter(id => id !== compatibility.id)
                              : [...value, compatibility.id],
                          )
                        }
                        className={cn(
                          'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                          selected
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-background text-muted-foreground hover:border-foreground/50',
                        )}>
                        {compatibility.title}
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessageSpace />
            </FormItem>
          );
        }}
      />

      <FormField
        control={control}
        name={path('changelog')}
        render={({field}) => (
          <FormItem>
            <FormLabel>{i18n.t('Changelog')}</FormLabel>
            <FormControl>
              <RichTextEditor
                content={initialChangelogRef.current}
                onChange={field.onChange}
                classNames={{
                  wrapperClassName: 'overflow-visible',
                  toolbarClassName: 'mt-0',
                  editorClassName: 'px-4',
                }}
              />
            </FormControl>
            <FormMessageSpace />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={path('bundleToken')}
        render={() => (
          <FormItem>
            <FormLabel>
              {i18n.t(
                'Bundle file (.zip, up to {0})',
                getFileSizeText(MAX_BUNDLE_SIZE),
              )}{' '}
              *
            </FormLabel>
            <FormControl>
              <BundleDropzone
                staged={staged}
                existingFileName={
                  existingBundle
                    ? (existingBundle.fileName ?? i18n.t('Current bundle'))
                    : null
                }
                existingFileSizeText={existingBundle?.sizeText}
                downloadHref={downloadHref}
                maxSize={MAX_BUNDLE_SIZE}
                onFile={handleBundleFile}
                onError={message =>
                  toast({variant: 'destructive', title: message})
                }
                onClear={handleBundleClear}
              />
            </FormControl>
            <FormMessageSpace />
          </FormItem>
        )}
      />
    </div>
  );
}
