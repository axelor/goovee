import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {useToast} from '@/ui/hooks';
import {Loader2, Pencil} from 'lucide-react';
import {useState} from 'react';
import {loadMyProductForEdit} from '../../../../actions';
import type {
  CompatibilityVersion,
  ListCategory,
  ListLicense,
  MyProductWithVersions,
} from '../../../../orm';
import type {Currency} from '@/product/orm';
import {ProductFormDialog} from '../product-form-dialog';

type Props = {
  workspaceURI: string;
  workspaceURL: string;
  productId: string;
  categories: Cloned<ListCategory>[];
  licenses: Cloned<ListLicense>[];
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  requiresReview: boolean;
  allowToPublish: boolean;
  listingCurrency: Cloned<Currency> | null;
  inAti: boolean;
};

export function EditProductButton({
  workspaceURI,
  workspaceURL,
  productId,
  categories,
  licenses,
  compatibilityVersions,
  requiresReview,
  allowToPublish,
  listingCurrency,
  inAti,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Cloned<MyProductWithVersions> | null>(
    null,
  );
  const {toast} = useToast();

  const handleOpen = async () => {
    setLoading(true);
    try {
      const result = await loadMyProductForEdit({productId, workspaceURL});
      if (!result.success) {
        toast({variant: 'destructive', title: result.message});
        return;
      }
      setProduct(result.data);
      setOpen(true);
    } catch {
      toast({
        variant: 'destructive',
        title: i18n.t('Failed to load the product. Please try again.'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className="rounded-full p-1.5 transition-colors hover:bg-muted">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : (
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="sr-only">{i18n.t('Edit')}</span>
      </button>
      {product && (
        <ProductFormDialog
          open={open}
          onOpenChange={setOpen}
          mode="edit"
          workspaceURI={workspaceURI}
          workspaceURL={workspaceURL}
          categories={categories}
          licenses={licenses}
          compatibilityVersions={compatibilityVersions}
          requiresReview={requiresReview}
          allowToPublish={allowToPublish}
          listingCurrency={listingCurrency}
          inAti={inAti}
          initial={product}
        />
      )}
    </>
  );
}
