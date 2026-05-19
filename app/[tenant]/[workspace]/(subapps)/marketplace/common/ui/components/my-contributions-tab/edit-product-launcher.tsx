import {useState} from 'react';
import {Pencil, Loader2} from 'lucide-react';
import {i18n} from '@/locale';
import {useToast} from '@/ui/hooks';
import type {Cloned} from '@/types/util';
import {ProductFormDialog} from '../product-form';
import {loadMyProductForEdit} from '../../../actions/actions';
import type {
  CompatibilityVersion,
  ListCategory,
  MyProductWithVersions,
} from '../../../orm/orm';

type Props = {
  workspaceURI: string;
  workspaceURL: string;
  productId: string;
  categories: Cloned<ListCategory>[];
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  requiresReview: boolean;
};

export function EditProductLauncher({
  workspaceURI,
  workspaceURL,
  productId,
  categories,
  compatibilityVersions,
  requiresReview,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Cloned<MyProductWithVersions> | null>(
    null,
  );
  const {toast} = useToast();

  const handleOpen = async () => {
    setLoading(true);
    const result = await loadMyProductForEdit({productId, workspaceURL});
    setLoading(false);
    if (!result.success) {
      toast({variant: 'destructive', title: result.message});
      return;
    }
    setProduct(result.data);
    setOpen(true);
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
          compatibilityVersions={compatibilityVersions}
          requiresReview={requiresReview}
          initial={product}
        />
      )}
    </>
  );
}
