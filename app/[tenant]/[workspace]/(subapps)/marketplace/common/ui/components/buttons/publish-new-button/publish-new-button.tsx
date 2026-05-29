'use client';

import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {Button} from '@/ui/components/button';
import {Plus} from 'lucide-react';
import {useState} from 'react';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {
  CompatibilityVersion,
  ListCategory,
  ListLicense,
  Currency,
} from '../../../../orm';
import {ProductFormDialog} from '../../dialogs/product-form-dialog';

type Props = {
  workspaceURI: string;
  workspaceURL: string;
  categories: Cloned<ListCategory>[];
  licenses: Cloned<ListLicense>[];
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  requiresReview: boolean;
  allowToPublish: boolean;
  newListingCurrency: Cloned<Currency> | null;
  inAti: boolean;
  defaultType?: MARKETPLACE_TYPE;
};

export function PublishNewButton({
  workspaceURI,
  workspaceURL,
  categories,
  licenses,
  compatibilityVersions,
  requiresReview,
  allowToPublish,
  newListingCurrency,
  inAti,
  defaultType,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="lg"
        className="gap-2 rounded-full"
        onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {i18n.t('Publish new')}
      </Button>
      <ProductFormDialog
        open={open}
        onOpenChange={setOpen}
        mode="create"
        workspaceURI={workspaceURI}
        workspaceURL={workspaceURL}
        categories={categories}
        licenses={licenses}
        compatibilityVersions={compatibilityVersions}
        requiresReview={requiresReview}
        allowToPublish={allowToPublish}
        listingCurrency={newListingCurrency}
        inAti={inAti}
        defaultType={defaultType}
      />
    </>
  );
}
