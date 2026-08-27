import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {withBasePath} from '@/lib/core/path/base-path';
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
  /** Writes a bundle token to the row identified by `rowKey`, resolving its
   *  current index at commit time. An upload settles long after it was picked,
   *  by which point `namePrefix` may name a different row. */
  commitBundleToken: (rowKey: string, token: string | undefined) => void;
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  workspaceURI: string;
  productId: string;
};

/**
 * Version input fields for the combined editor, bound to one row of the form's
 * version array via `namePrefix`. This renders only the editable fields; the
 * status control and cursor nav sit outside it. Read-only context (current
 * bundle) comes in via `existingBundle`, not the form. A picked bundle starts
 * uploading at once, the token reaching `bundleToken` only when the transfer
 * succeeds; the dropzone shows live progress.
 */
export function VersionFields({
  namePrefix,
  rowKey,
  existingBundle,
  bundleUpload,
  bundleItemByRow,
  commitBundleToken,
  compatibilityVersions,
  workspaceURI,
  productId,
}: VersionFieldsProps) {
  const {toast} = useToast();
  const {control, getValues, register} = useFormContext<CombinedEditValues>();

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
      ? withBasePath(
          `${workspaceURI}/${SUBAPP_CODES.marketplace}/api/products/${productId}/versions/${rowId}/download`,
        )
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
        status: item.status,
        error: item.error,
      }
    : undefined;

  const handleBundleFile = (file: File) => {
    /* Re-pick supersedes any prior attempt for this row: give it up and clear
     * the staged token before staging the new file. */
    const prior = bundleItemByRow.current.get(rowKey);
    if (prior) bundleUpload.remove(prior);
    commitBundleToken(rowKey, undefined);
    const {ids, done} = bundleUpload.upload([file], {
      purpose: 'marketplace:bundle',
      /* Refuse an oversized bundle here rather than send it and have the route
       * reject it. The purpose registry on the server stays the real check. */
      maxBytes: MAX_BUNDLE_SIZE,
    });
    /* upload() returns its item ids synchronously, so the row's entry lands
     * before a remount could lose it. */
    bundleItemByRow.current.set(rowKey, ids[0]);
    done.then(([result]) => {
      if (!result) return; // failed or paused — the dropzone offers the resume
      commitBundleToken(rowKey, result.token);
    });
  };

  const handleBundleClear = () => {
    const prior = bundleItemByRow.current.get(rowKey);
    if (prior) bundleUpload.remove(prior);
    bundleItemByRow.current.delete(rowKey);
    commitBundleToken(rowKey, undefined);
  };

  const handleBundlePause = () => {
    if (itemId) bundleUpload.pause(itemId);
  };

  /* Carries on from what the server already holds. The token only lands on the
   * form if this attempt is the one that finishes, same as the first. */
  const handleBundleResume = () => {
    if (!itemId) return;
    bundleUpload.resume(itemId).then(result => {
      if (!result) return;
      commitBundleToken(rowKey, result.token);
    });
  };

  return (
    <div className="space-y-8">
      {/* RHF keeps field-array values only for registered fields, and this one
          has no visible input — register it hidden so appended (paginated)
          rows carry their id into the save; otherwise the upsert reads them as
          new versions. */}
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
                            ? 'border-royal bg-royal text-white'
                            : 'border-ink-100 bg-ink-25 text-ink-500 hover:border-royal/50',
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
                onPause={handleBundlePause}
                onResume={handleBundleResume}
              />
            </FormControl>
            <FormMessageSpace />
          </FormItem>
        )}
      />
    </div>
  );
}
