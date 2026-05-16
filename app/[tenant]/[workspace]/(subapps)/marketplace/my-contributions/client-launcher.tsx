'use client';

import {useState} from 'react';
import {Plus} from 'lucide-react';
import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import type {Cloned} from '@/types/util';
import {ProductFormDialog} from '../common/ui/components/product-form';
import {MARKETPLACE_TYPE} from '../common/constant/marketplace-types';
import type {CompatibilityVersion, ListCategory} from '../common/orm/orm';

type Props = {
  workspaceURI: string;
  categories: Cloned<ListCategory>[];
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  defaultType?: MARKETPLACE_TYPE;
};

export function PublishNewLauncher({
  workspaceURI,
  categories,
  compatibilityVersions,
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
        categories={categories}
        compatibilityVersions={compatibilityVersions}
        defaultType={defaultType}
      />
    </>
  );
}
