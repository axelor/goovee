'use client';

import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {Button} from '@/ui/components/button';
import {Form} from '@/ui/components/form';
import {Loader2} from 'lucide-react';
import {useRouter} from 'next/navigation';
import type {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {
  CompatibilityVersion,
  ListCategory,
  ListLicense,
  MyProductForEdit,
  MyProductVersion,
} from '../../../../orm';
import type {Currency} from '@/product/orm';
import {ProductFields} from './product-fields';
import {ScreenshotStagingProvider} from './screenshot-staging-context';
import {VersionSection} from './version-section';
import {useProductEditForm} from './use-product-edit-form';

type ProductEditPageProps = {
  /** The product being edited; absent in create mode. */
  initial?: Cloned<MyProductForEdit>;
  /** Fixed product type for create mode. */
  defaultType?: MARKETPLACE_TYPE;
  initialVersions: Cloned<MyProductVersion>[];
  initialTotal: number;
  categories: Cloned<ListCategory>[];
  licenses: Cloned<ListLicense>[];
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  listingCurrency: Cloned<Currency> | null;
  inAti: boolean;
  requiresReview: boolean;
  allowToPublish: boolean;
  /** Where Save and Cancel navigate to. */
  returnHref: string;
};

export function ProductEditPage({
  initial,
  defaultType,
  initialVersions,
  initialTotal,
  categories,
  licenses,
  compatibilityVersions,
  listingCurrency,
  inAti,
  requiresReview,
  allowToPublish,
  returnHref,
}: ProductEditPageProps) {
  const router = useRouter();
  const model = useProductEditForm({
    initial,
    defaultType,
    initialVersions,
    initialTotal,
    onSaved: () => router.push(returnHref, {scroll: false}),
  });
  const leave = () => router.push(returnHref, {scroll: false});
  /* True only for genuine edits: `loadMore` rebaselines appended rows, so
   * paginating doesn't dirty the form. */
  const isDirty = model.form.formState.isDirty;

  return (
    <Form {...model.form}>
      <ScreenshotStagingProvider value={model.screenshotStaging}>
        <div className="space-y-6 pb-24">
          <ProductFields
            categories={categories}
            licenses={licenses}
            initial={initial}
            listingCurrency={listingCurrency}
            inAti={inAti}
          />

          <VersionSection
            model={model}
            requiresReview={requiresReview}
            allowToPublish={allowToPublish}
            compatibilityVersions={compatibilityVersions}
          />
        </div>

        {/* One combined save for the whole page. */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-25 px-6 py-4">
          {model.uploadsInFlight ? (
            <span className="mr-auto text-sm text-ink-500">
              {i18n.t('Uploads in progress…')}
            </span>
          ) : model.uploadsPaused ? (
            <span className="mr-auto text-sm text-status-pending-fg">
              {i18n.t('Resume or remove the paused uploads to save.')}
            </span>
          ) : (
            model.uploadsFailed && (
              <span className="mr-auto text-sm text-destructive">
                {i18n.t('Fix failed uploads to save.')}
              </span>
            )
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={leave}
            disabled={model.pending}>
            {i18n.t('Cancel')}
          </Button>
          <Button
            variant="royal"
            type="button"
            onClick={model.save}
            disabled={model.pending || !isDirty || !model.uploadsStaged}>
            {model.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {i18n.t('Save')}
          </Button>
        </div>
      </ScreenshotStagingProvider>
    </Form>
  );
}
