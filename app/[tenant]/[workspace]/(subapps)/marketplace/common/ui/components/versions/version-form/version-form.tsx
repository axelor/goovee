import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {RichTextEditor} from '@/ui/components';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/ui/components/form';
import {Input} from '@/ui/components/input';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import {useWatch} from 'react-hook-form';
import {MARKETPLACE_VERSION_STATUS} from '../../../../constants/statuses';
import type {CompatibilityVersion} from '../../../../orm';
import type {VersionStepModel} from '../../product/product-form-dialog/use-product-edit';
import {BundleDropzone} from '../bundle-dropzone';
import {FormMessageSpace} from '../../shared/form-message-space';
import {MAX_BUNDLE_SIZE} from './validator';

type VersionFormProps = {
  /** Version-step model from `useProductEdit` (state + handlers live there). */
  vm: VersionStepModel;
  workspaceURI: string;
  productId: string;
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  requiresReview: boolean;
  allowToPublish: boolean;
};

export function VersionForm({
  vm,
  workspaceURI,
  productId,
  compatibilityVersions,
  requiresReview,
  allowToPublish,
}: VersionFormProps) {
  const {toast} = useToast();
  const {
    form,
    bodyRef,
    pending,
    current,
    total,
    creatingNew,
    awaitingNext,
    slideDir,
    index,
    displayTotal,
    positionLabel,
    goPrev,
    goNext,
    addNew,
    discardNew,
    saveAsDraft,
    publish,
    isPublished,
    canUnpublish,
    canSaveAsDraft,
    isUnpublishingCurrent,
    hasOtherPublished,
    confirmUnpublish,
    setConfirmUnpublish,
    runUnpublish,
    cancel,
  } = vm;
  const {control, setValue, formState} = form;

  const existingBundleFileId = useWatch({
    control,
    name: 'existingBundleFileId',
  });

  const downloadHref = current
    ? `${workspaceURI}/marketplace/api/products/${productId}/versions/${current.id}/download`
    : undefined;

  return (
    <Form {...form}>
      <div ref={bodyRef} className="bg-muted/30 p-6" data-vaul-no-drag>
        {/* Section header */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-foreground">
                {i18n.t('Versions')}
              </h3>
              {displayTotal > 1 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={goPrev}
                    disabled={creatingNew || total <= 1 || awaitingNext}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span>{positionLabel}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={goNext}
                    disabled={creatingNew || total <= 1 || awaitingNext}>
                    {awaitingNext ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {creatingNew && total > 0 && (
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
                  disabled={creatingNew || awaitingNext}>
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
            {awaitingNext ? (
              <div className="flex items-center justify-center rounded-xl border border-border bg-card p-12 shadow-sm">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
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
                        <FormMessageSpace />
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
                      <FormMessageSpace />
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
                          content={current?.changelog ?? ''}
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
                  name="bundleFile"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>
                        {i18n.t('Bundle file (.zip, up to 20 MB)')} *
                      </FormLabel>
                      <FormControl>
                        <BundleDropzone
                          file={field.value}
                          existingFileName={
                            existingBundleFileId
                              ? current?.bundleFile?.fileName
                              : null
                          }
                          existingFileSizeText={current?.bundleFile?.sizeText}
                          downloadHref={downloadHref}
                          maxSize={MAX_BUNDLE_SIZE}
                          onFile={file =>
                            setValue('bundleFile', file, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          onError={message =>
                            toast({variant: 'destructive', title: message})
                          }
                        />
                      </FormControl>
                      <FormMessageSpace />
                    </FormItem>
                  )}
                />
              </div>
            )}
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
              disabled={pending || awaitingNext}
              onClick={() => setConfirmUnpublish(true)}
              className="text-destructive hover:text-destructive">
              {i18n.t('Unpublish')}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={cancel}
            disabled={pending}>
            {i18n.t('Cancel')}
          </Button>
          {canSaveAsDraft && (
            <Button
              type="button"
              variant="outline"
              disabled={
                pending || awaitingNext || (!!current?.id && !formState.isDirty)
              }
              onClick={saveAsDraft}>
              {i18n.t('Save as draft')}
            </Button>
          )}
          <Button
            type="button"
            disabled={
              pending ||
              awaitingNext ||
              (!!current?.id &&
                !formState.isDirty &&
                isPublished &&
                !requiresReview)
            }
            onClick={publish}>
            {isPublished && !requiresReview
              ? i18n.t('Save')
              : requiresReview
                ? i18n.t('Submit for review')
                : i18n.t('Publish')}
          </Button>
        </div>
      </div>
      <AlertDialog open={confirmUnpublish} onOpenChange={setConfirmUnpublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {i18n.t('Unpublish this version?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {hasOtherPublished
                ? i18n.t(
                    'This version will be unlisted. The next-highest published version will become live.',
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
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {i18n.t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={runUnpublish} disabled={pending}>
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
                'You may submit this version for review again. It becomes visible once approved.',
              )
            : i18n.t(
                'You may publish this version again. Changes are visible to the community immediately.',
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
