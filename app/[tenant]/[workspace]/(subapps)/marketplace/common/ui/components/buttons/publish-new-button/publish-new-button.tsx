'use client';

import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {Button} from '@/ui/components/button';
import {Plus} from 'lucide-react';
import {useState} from 'react';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {CompatibilityVersion, ListCategory} from '../../../../orm';
import {ProductFormDialog} from '../../dialogs/product-form-dialog';

type Props = {
  workspaceURI: string;
  workspaceURL: string;
  categories: Cloned<ListCategory>[];
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  requiresReview: boolean;
  allowToPublish: boolean;
  currencySymbol?: string | null;
  inAti: boolean;
  defaultType?: MARKETPLACE_TYPE;
};

export function PublishNewButton({
  workspaceURI,
  workspaceURL,
  categories,
  compatibilityVersions,
  requiresReview,
  allowToPublish,
  currencySymbol,
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
        compatibilityVersions={compatibilityVersions}
        requiresReview={requiresReview}
        allowToPublish={allowToPublish}
        currencySymbol={currencySymbol ?? null}
        inAti={inAti}
        defaultType={defaultType}
      />
    </>
  );
}
