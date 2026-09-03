import type {WorkspaceScope} from '@/lib/core/url/workspace-urls';
import {t} from '@/locale/server';
import {RichTextViewer} from '@/ui/components/rich-text-editor/rich-text-viewer';
import type {SingleProduct} from '../../../../orm';
import {getProductScreenshotURL} from '../../../../utils/images';
import {ScreenshotGallery} from '../../shared/screenshot-gallery';

interface OverviewTabProps {
  product: SingleProduct;
  scope: WorkspaceScope;
}

export async function OverviewTab({product, scope}: OverviewTabProps) {
  const images = (product.pictureList || []).filter(img => !!img.picture?.id);

  return (
    <div className="space-y-8">
      {/* Screenshots */}
      {images.length > 0 && (
        <ScreenshotGallery
          images={images
            .filter(img => img.picture?.id)
            .map(img => ({
              id: img.id,
              src: getProductScreenshotURL({
                scope,
                productId: product.id,
                fileId: img.picture!.id,
              }),
            }))}
          alt={await t('Product screenshot')}
        />
      )}

      {/* About Section */}
      <div className="bg-white rounded-lg border border-ink-100 p-4 md:p-8 space-y-4">
        <h2 className="text-xl font-bold text-ink-900">
          {await t('About this plugin')}
        </h2>
        <RichTextViewer
          content={product.longDescription || product.description || undefined}
        />
      </div>
    </div>
  );
}
