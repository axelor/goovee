'use client';

import {useRouter} from 'next/navigation';
import {useCallback} from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/ui/components/responsive-dialog';
import {useResponsive} from '@/ui/hooks';
import {RESPONSIVE_SIZES} from '@/constants';
import type {Cloned} from '@/types/util';
import {ProductForm} from './product-form';
import type {MARKETPLACE_TYPE} from '../../../constant/marketplace-types';
import type {
  CompatibilityVersion,
  ListCategory,
  MyProductWithVersions,
} from '../../../orm/orm';

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  workspaceURI: string;
  categories: Cloned<ListCategory>[];
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  initial?: Cloned<MyProductWithVersions>;
  defaultType?: MARKETPLACE_TYPE;
};

export function ProductFormDialog({
  open,
  onOpenChange,
  mode,
  workspaceURI,
  categories,
  compatibilityVersions,
  initial,
  defaultType,
}: ProductFormDialogProps) {
  const router = useRouter();
  const responsive = useResponsive();
  const isSmall = RESPONSIVE_SIZES.some(size => responsive[size]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const onSuccess = useCallback(() => {
    close();
    router.refresh();
  }, [close, router]);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} isSmall={isSmall}>
      <ResponsiveDialogContent className="max-w-6xl gap-0 p-0">
        <ProductForm
          mode={mode}
          workspaceURI={workspaceURI}
          categories={categories}
          compatibilityVersions={compatibilityVersions}
          initial={initial}
          defaultType={defaultType}
          onSuccess={onSuccess}
          onCancel={close}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
