import {useMemo, useRef, useState, useTransition} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Info,
  Plus,
  Trash2,
  Upload,
  FileArchive,
} from 'lucide-react';
import {i18n} from '@/locale';
import {Alert, AlertDescription, AlertTitle} from '@/ui/components/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/components/alert-dialog';
import {Button} from '@/ui/components/button';
import {Input} from '@/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import {RichTextEditor} from '@/ui/components';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {packIntoFormData} from '@/utils/formdata';
import type {Cloned} from '@/types/util';
import {MARKETPLACE_VERSION_STATUS} from '../../../constants/statuses';
import {saveVersion, unpublishVersion} from '../../../actions/actions';
import {versionSchema, type VersionFormValues, MAX_BUNDLE_SIZE} from './schema';
import type {
  CompatibilityVersion,
  MyProductWithVersions,
} from '../../../orm/orm';

type ExistingVersion = NonNullable<
  Cloned<MyProductWithVersions>['versionList']
>[number];

type VersionFormProps = {
  workspaceURI: string;
  workspaceURL: string;
  productId: string;
  versions: ExistingVersion[];
  productCurrentVersionId: string | null;
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  requiresReview: boolean;
  allowToPublish: boolean;
  onCancel: () => void;
  onDone: () => void;
};

const BLANK_FORM_VALUES = (productId: string): VersionFormValues => ({
  productId,
  versionNumber: '',
  changelog: '',
  statusSelect: MARKETPLACE_VERSION_STATUS.DRAFT,
  compatibilitySetIds: [],
});

export function VersionForm({
  workspaceURI,
  workspaceURL,
  productId,
  versions: initialVersions,
  productCurrentVersionId,
  compatibilityVersions,
  requiresReview,
  allowToPublish,
  onCancel,
  onDone,
}: VersionFormProps) {
  const {toast} = useToast();
  const [pending, startTransition] = useTransition();
  /** List of existing (saved) versions, kept up-to-date as we save. */
  const [versions, setVersions] = useState<ExistingVersion[]>(initialVersions);
  /** When true, we are editing/creating a brand-new version (not yet saved). */
  const [creatingNew, setCreatingNew] = useState(
    () => initialVersions.length === 0,
  );
  /** Index in the `versions` array we are currently editing (when not creatingNew). */
  const [index, setIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<'next' | 'prev'>('next');
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [replacementVersionId, setReplacementVersionId] = useState<
    string | undefined
  >(undefined);

  const current = creatingNew ? undefined : versions[index];

  const defaultValues = useMemo<VersionFormValues>(() => {
    if (!current) return BLANK_FORM_VALUES(productId);
    return {
      id: current.id,
      productId,
      versionNumber: current.versionNumber ?? '',
      changelog: current.changelog ?? '',
      statusSelect:
        current.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED
          ? MARKETPLACE_VERSION_STATUS.PUBLISHED
          : MARKETPLACE_VERSION_STATUS.DRAFT,
      compatibilitySetIds: (current.compatibilitySet ?? []).map(c => c.id),
      existingBundleFileId: current.bundleFile?.id,
    };
  }, [current, productId]);

  const form = useForm<VersionFormValues>({
    resolver: zodResolver(versionSchema),
    defaultValues,
    values: defaultValues,
    mode: 'onSubmit',
  });

  const {control, handleSubmit, watch, setValue, formState} = form;
  const watched = watch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const downloadHref = current
    ? `${workspaceURI}/marketplace/api/products/${productId}/versions/${current.id}/download`
    : undefined;

  const submit = handleSubmit(values => {
    startTransition(async () => {
      const formData = packIntoFormData({...values, workspaceURL});
      const result = await saveVersion(formData);
      if (!result.success) {
        toast({variant: 'destructive', title: result.message});
        return;
      }
      toast({variant: 'success', title: i18n.t('Version saved')});
      onDone();
    });
  });

  const guardedNavigate = (move: () => void, dir: 'next' | 'prev') => {
    if (formState.isDirty) {
      toast({
        variant: 'destructive',
        title: i18n.t('Save the current version before switching'),
      });
      return;
    }
    setSlideDir(dir);
    move();
  };

  const goPrev = () =>
    guardedNavigate(
      () => setIndex(i => (i - 1 + versions.length) % versions.length),
      'prev',
    );
  const goNext = () =>
    guardedNavigate(() => setIndex(i => (i + 1) % versions.length), 'next');

  const addNew = () => {
    if (formState.isDirty) {
      toast({
        variant: 'destructive',
        title: i18n.t('Save the current version first'),
      });
      return;
    }
    setSlideDir('next');
    setCreatingNew(true);
  };

  const discardNew = () => {
    setCreatingNew(false);
    setIndex(0);
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BUNDLE_SIZE) {
      toast({
        variant: 'destructive',
        title: i18n.t('Bundle must be 20 MB or less'),
      });
      return;
    }
    setValue('bundleFile', file, {shouldValidate: true, shouldDirty: true});
  };

  const total = versions.length + (creatingNew ? 1 : 0);
  const isPublished =
    !!current?.id &&
    current.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED;
  const canUnpublish =
    !!current?.id &&
    (current.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED ||
      current.statusSelect === MARKETPLACE_VERSION_STATUS.IN_REVIEW);

  // Other published versions the user could promote to currentVersion. Only
  // relevant when unpublishing the version that is currentVersion right now.
  const isUnpublishingCurrent =
    !!current?.id && current.id === productCurrentVersionId;
  const replacementCandidates = isUnpublishingCurrent
    ? versions.filter(
        v =>
          v.id !== current?.id &&
          v.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED,
      )
    : [];
  const needsReplacement = replacementCandidates.length > 0;

  const openUnpublish = () => {
    // Default the replacement select to the newest other published version.
    setReplacementVersionId(replacementCandidates[0]?.id);
    setConfirmUnpublish(true);
  };

  const runUnpublish = () => {
    if (!current?.id) return;
    setConfirmUnpublish(false);
    startTransition(async () => {
      const result = await unpublishVersion({
        versionId: current.id,
        productId,
        workspaceURL,
        newCurrentVersionId: needsReplacement ? replacementVersionId : undefined,
      });
      if (!result.success) {
        toast({variant: 'destructive', title: result.message});
        return;
      }
      toast({variant: 'success', title: i18n.t('Version unpublished')});
      onDone();
    });
  };
  const positionLabel = creatingNew
    ? `1 / ${total} (${i18n.t('new')})`
    : `${index + 1} / ${total}`;

  return (
    <Form {...form}>
      <div className="bg-muted/30 p-6" data-vaul-no-drag>
        {/* Section header */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-foreground">
                {i18n.t('Versions')}
              </h3>
              {total > 1 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={goPrev}
                    disabled={creatingNew || versions.length <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span>{positionLabel}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={goNext}
                    disabled={creatingNew || versions.length <= 1}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {creatingNew && versions.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={discardNew}
                  className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-1 h-4 w-4" />
                  {i18n.t('Discard')}
                </Button>
              )}
              {allowToPublish && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNew}
                  disabled={creatingNew}>
                  <Plus className="mr-1 h-4 w-4" />
                  {i18n.t('Add new version')}
                </Button>
              )}
            </div>
          </div>

          <ReviewStatusAlert
            requiresReview={requiresReview}
            currentStatus={current?.statusSelect ?? null}
          />

          <div className="overflow-hidden">
            <div
              key={`${creatingNew ? 'new' : current?.id}-${index}`}
              className={cn(
                'rounded-xl border border-border bg-card p-6 shadow-sm space-y-8',
                'animate-in fade-in duration-300',
                slideDir === 'next'
                  ? 'slide-in-from-right-12'
                  : 'slide-in-from-left-12',
              )}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <FormField
                  control={control}
                  name="versionNumber"
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
              </div>

              <FormField
                control={control}
                name="compatibilitySetIds"
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
                name="changelog"
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
                name="bundleFile"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      {i18n.t('Bundle file (.zip, up to 20 MB)')} *
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
                        <FileArchive className="h-8 w-8 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          {watched.bundleFile ? (
                            <>
                              <p className="truncate text-sm text-foreground">
                                {watched.bundleFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(
                                  watched.bundleFile.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{' '}
                                MB
                              </p>
                            </>
                          ) : current?.bundleFile?.fileName && downloadHref ? (
                            <>
                              <a
                                href={downloadHref}
                                download
                                className="truncate text-sm font-medium text-primary hover:underline">
                                {current.bundleFile.fileName}
                              </a>
                              {current.bundleFile.sizeText && (
                                <p className="text-xs text-muted-foreground">
                                  {current.bundleFile.sizeText}
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
                          {watched.bundleFile || watched.existingBundleFileId
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
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-border bg-background px-6 py-4">
        <div>
          {canUnpublish && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={openUnpublish}
              className="text-destructive hover:text-destructive">
              {i18n.t('Unpublish')}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}>
          {i18n.t('Cancel')}
        </Button>
        {isPublished ? (
          <Button
            type="button"
            disabled={pending || !formState.isDirty}
            onClick={() => {
              setValue('statusSelect', MARKETPLACE_VERSION_STATUS.PUBLISHED);
              submit();
            }}>
            {requiresReview ? i18n.t('Submit for review') : i18n.t('Save')}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setValue('statusSelect', MARKETPLACE_VERSION_STATUS.DRAFT);
                submit();
              }}>
              {i18n.t('Save as draft')}
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                setValue('statusSelect', MARKETPLACE_VERSION_STATUS.PUBLISHED);
                submit();
              }}>
              {requiresReview ? i18n.t('Submit for review') : i18n.t('Publish')}
            </Button>
          </>
        )}
        </div>
      </div>
      <AlertDialog open={confirmUnpublish} onOpenChange={setConfirmUnpublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {i18n.t('Unpublish this version?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {needsReplacement
                ? i18n.t(
                    'This version is currently the live version. Pick another published version to take its place.',
                  )
                : isUnpublishingCurrent
                  ? i18n.t(
                      'This is your only published version. Unpublishing will hide the product from listings until a new version is published.',
                    )
                  : i18n.t(
                      'This version will be unlisted and no longer available to users.',
                    )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {needsReplacement && (
            <div className="space-y-2 py-2">
              <label className="text-sm font-medium text-foreground">
                {i18n.t('New live version')}
              </label>
              <Select
                value={replacementVersionId}
                onValueChange={setReplacementVersionId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {replacementCandidates.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      v{v.versionNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {i18n.t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={runUnpublish}
              disabled={
                pending || (needsReplacement && !replacementVersionId)
              }>
              {i18n.t('Unpublish')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}

function ReviewStatusAlert({
  requiresReview,
  currentStatus,
}: {
  requiresReview: boolean;
  /** null for an unsaved new version. */
  currentStatus: string | null;
}) {
  // Rejected or unpublished — saving brings the version back into circulation,
  // either directly or via review depending on the workspace flag.
  if (
    currentStatus === MARKETPLACE_VERSION_STATUS.REJECTED ||
    currentStatus === MARKETPLACE_VERSION_STATUS.UNPUBLISHED
  ) {
    const title =
      currentStatus === MARKETPLACE_VERSION_STATUS.REJECTED
        ? i18n.t('Rejected')
        : i18n.t('Unpublished');
    return (
      <Alert variant="primary">
        <Info className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          {requiresReview
            ? i18n.t(
                'Saving will resubmit this version for review. It becomes visible once approved.',
              )
            : i18n.t(
                'Saving will publish this version. Changes are visible to the community immediately.',
              )}
        </AlertDescription>
      </Alert>
    );
  }

  // In review — independent of workspace flag, the version is already queued.
  if (currentStatus === MARKETPLACE_VERSION_STATUS.IN_REVIEW) {
    return (
      <Alert variant="primary">
        <Info className="h-4 w-4" />
        <AlertTitle>{i18n.t('In review')}</AlertTitle>
        <AlertDescription>
          {i18n.t(
            'This version is awaiting approval. Saving will requeue it for review.',
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Published — editing a live version.
  if (currentStatus === MARKETPLACE_VERSION_STATUS.PUBLISHED) {
    if (requiresReview) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {i18n.t('Published · editing sends back for review')}
          </AlertTitle>
          <AlertDescription>
            {i18n.t(
              'Saving moves this version to "in review" and unlists it. If this is your only published version, the product itself will be hidden from listings until a new version is approved.',
            )}
          </AlertDescription>
        </Alert>
      );
    }
    return (
      <Alert variant="primary">
        <Info className="h-4 w-4" />
        <AlertTitle>{i18n.t('Published · live')}</AlertTitle>
        <AlertDescription>
          {i18n.t(
            'Saving will update the published version. Changes are visible to the community immediately.',
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Draft — editing an existing draft.
  if (currentStatus === MARKETPLACE_VERSION_STATUS.DRAFT) {
    if (requiresReview) {
      return (
        <Alert variant="primary">
          <Info className="h-4 w-4" />
          <AlertTitle>{i18n.t('Draft · review required')}</AlertTitle>
          <AlertDescription>
            {i18n.t(
              'Keep saving as a draft, or submit for review to make this version live.',
            )}
          </AlertDescription>
        </Alert>
      );
    }
    return (
      <Alert variant="primary">
        <Info className="h-4 w-4" />
        <AlertTitle>{i18n.t('Draft')}</AlertTitle>
        <AlertDescription>
          {i18n.t(
            'Keep saving as a draft, or publish to make this version live.',
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // New version (no saved state yet).
  if (requiresReview) {
    return (
      <Alert variant="primary">
        <Info className="h-4 w-4" />
        <AlertTitle>{i18n.t('New version · review required')}</AlertTitle>
        <AlertDescription>
          {i18n.t(
            'Save as a draft, or submit for review. The version becomes visible once approved.',
          )}
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert variant="primary">
      <Info className="h-4 w-4" />
      <AlertTitle>{i18n.t('New version')}</AlertTitle>
      <AlertDescription>
        {i18n.t(
          'Save as a draft, or publish to make this version live immediately.',
        )}
      </AlertDescription>
    </Alert>
  );
}
