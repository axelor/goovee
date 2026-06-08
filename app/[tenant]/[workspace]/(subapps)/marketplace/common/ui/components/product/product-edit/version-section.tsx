import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {Alert, AlertDescription, AlertTitle} from '@/ui/components/alert';
import {Button} from '@/ui/components/button';
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
import {useWatch, type FieldPath} from 'react-hook-form';
import {MARKETPLACE_VERSION_STATUS} from '../../../../constants/statuses';
import type {CompatibilityVersion} from '../../../../orm';
import type {CombinedEditValues, VersionRowValues} from './combined-validator';
import type {ProductEditFormModel} from './use-product-edit-form';
import {VersionFields} from './version-fields';

type VersionStatus = VersionRowValues['statusSelect'];

const STATUS = MARKETPLACE_VERSION_STATUS;

type StatusSegment = {id: string; label: string; intent: VersionStatus};
type StatusPillInfo = {label: string; tone: 'review' | 'rejected'};

/**
 * The status segments offered for a version, gated by its current persisted
 * status so only lifecycle-legal transitions appear (SPEC §4.9.2): a
 * Published / In-review version can only be unpublished (never demoted straight
 * to Draft); Unpublished / Rejected versions can go to Draft or be (re)submitted;
 * Rejected is a reviewer outcome shown read-only via a pill. Each segment's
 * `intent` is the editable value sent to the server (draft/published/
 * unpublished); "Publish" resolves to In-review when the workspace requires it.
 */
function statusOptions(
  original: string | undefined,
  requiresReview: boolean,
): {pill?: StatusPillInfo; segments: StatusSegment[]} {
  const publish: StatusSegment = {
    id: 'publish',
    label: requiresReview ? i18n.t('Submit for review') : i18n.t('Publish'),
    intent: STATUS.PUBLISHED,
  };
  const draft: StatusSegment = {
    id: 'draft',
    label: i18n.t('Draft'),
    intent: STATUS.DRAFT,
  };
  const unpublish: StatusSegment = {
    id: 'unpublish',
    label: i18n.t('Unpublish'),
    intent: STATUS.UNPUBLISHED,
  };
  switch (original) {
    case STATUS.PUBLISHED:
      return {
        segments: [
          {
            id: 'published',
            label: i18n.t('Published'),
            intent: STATUS.PUBLISHED,
          },
          unpublish,
        ],
      };
    case STATUS.IN_REVIEW:
      return {
        pill: {label: i18n.t('In review'), tone: 'review'},
        segments: [
          {
            id: 'inreview',
            label: i18n.t('Keep in review'),
            intent: STATUS.PUBLISHED,
          },
          unpublish,
        ],
      };
    case STATUS.UNPUBLISHED:
      return {
        segments: [
          {
            id: 'unpublished',
            label: i18n.t('Unpublished'),
            intent: STATUS.UNPUBLISHED,
          },
          draft,
          publish,
        ],
      };
    case STATUS.REJECTED:
      return {
        pill: {label: i18n.t('Rejected'), tone: 'rejected'},
        segments: [draft, publish],
      };
    default:
      // draft, or a brand-new version
      return {segments: [draft, publish]};
  }
}

function StatusPill({label, tone}: StatusPillInfo) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        tone === 'rejected'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-palette-amber/15 text-palette-amber',
      )}>
      {label}
    </span>
  );
}

/**
 * What saving will do to the version under the cursor, keyed on its real
 * persisted status (not the staged intent) and the workspace review policy.
 * `currentStatus` is null for an unsaved new row.
 */
function ReviewStatusAlert({
  requiresReview,
  currentStatus,
}: {
  requiresReview: boolean;
  currentStatus: string | null;
}) {
  // Rejected or unpublished — saving brings the version back into circulation,
  // either directly or via review depending on the workspace flag.
  if (
    currentStatus === STATUS.REJECTED ||
    currentStatus === STATUS.UNPUBLISHED
  ) {
    const title =
      currentStatus === STATUS.REJECTED
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
  if (currentStatus === STATUS.IN_REVIEW) {
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
  if (currentStatus === STATUS.PUBLISHED) {
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
  if (currentStatus === STATUS.DRAFT) {
    return (
      <Alert variant="primary">
        <Info className="h-4 w-4" />
        <AlertTitle>
          {requiresReview ? i18n.t('Draft · review required') : i18n.t('Draft')}
        </AlertTitle>
        <AlertDescription>
          {requiresReview
            ? i18n.t(
                'Keep saving as a draft, or submit for review to make this version live.',
              )
            : i18n.t(
                'Keep saving as a draft, or publish to make this version live.',
              )}
        </AlertDescription>
      </Alert>
    );
  }

  // New version (no saved state yet).
  return (
    <Alert variant="primary">
      <Info className="h-4 w-4" />
      <AlertTitle>
        {requiresReview
          ? i18n.t('New version · review required')
          : i18n.t('New version')}
      </AlertTitle>
      <AlertDescription>
        {requiresReview
          ? i18n.t(
              'Save as a draft, or submit for review. The version becomes visible once approved.',
            )
          : i18n.t(
              'Save as a draft, or publish to make this version live immediately.',
            )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * The version surface of the combined editor: header with cursor nav, the
 * state-aware status segmented control, add/discard, and the fields for the
 * single version under the cursor. Shared by the full-page editor and the
 * dialog — both drive it with the same `useProductEditForm` model.
 */
export function VersionSection({
  model,
  requiresReview,
  allowToPublish,
  compatibilityVersions,
  workspaceURI,
}: {
  model: ProductEditFormModel;
  requiresReview: boolean;
  allowToPublish: boolean;
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  workspaceURI: string;
}) {
  const {position, namePrefix, isNew, currentVersionMeta} = model;
  const status = useWatch({
    control: model.form.control,
    name: `${namePrefix}.statusSelect` as FieldPath<CombinedEditValues>,
  }) as VersionStatus | undefined;

  const {pill, segments} = statusOptions(
    currentVersionMeta?.originalStatus,
    requiresReview,
  );

  return (
    <section className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">
            {i18n.t('Versions')}
          </h3>
          {position.total > 1 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={model.goPrev}
                disabled={!model.canPrev || model.loadingMore}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                {position.current} / {position.total}
                {isNew ? ` (${i18n.t('new')})` : ''}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={model.goNext}
                disabled={!model.canNext || model.loadingMore}>
                {model.loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isNew && position.total > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={model.discardCurrentNew}
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
              onClick={model.addNew}>
              <Plus className="mr-1 h-4 w-4" />
              {i18n.t('Add new version')}
            </Button>
          )}
        </div>
      </div>

      {position.total === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {i18n.t('No versions yet. Add one to publish this product.')}
        </p>
      ) : model.loadingMore ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <ReviewStatusAlert
            requiresReview={requiresReview}
            currentStatus={currentVersionMeta?.originalStatus ?? null}
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {i18n.t('Status')}
            </span>
            {pill && <StatusPill label={pill.label} tone={pill.tone} />}
            {/* Segments are the lifecycle-legal targets; the highlighted one is
                the staged value, applied on Save (not immediately). */}
            <div className="inline-flex overflow-hidden rounded-lg border border-border">
              {segments.map((segment, index) => {
                const selected = status === segment.intent;
                return (
                  <button
                    key={segment.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => model.setStatus(segment.intent)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium transition-colors',
                      index > 0 && 'border-l border-border',
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted',
                    )}>
                    {segment.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Keyed by the cursor path so it remounts per version — the
              changelog editor then re-seeds from that row's persisted value. */}
          <VersionFields
            key={namePrefix}
            namePrefix={namePrefix}
            existingBundle={currentVersionMeta?.bundle}
            compatibilityVersions={compatibilityVersions}
            workspaceURI={workspaceURI}
            productId={model.productId}
          />
        </div>
      )}
    </section>
  );
}
