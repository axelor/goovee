import {t} from '@/locale/server';
import {RichTextViewer} from '@/ui/components/rich-text-editor/rich-text-viewer';
import type {SingleProduct} from '../../../../orm';
import {getProductScreenshotURL} from '../../../../utils/images';
import {ScreenshotGallery} from '../../primitives/screenshot-gallery';

interface OverviewTabProps {
  product: SingleProduct;
  workspaceURI: string;
}

export async function OverviewTab({product, workspaceURI}: OverviewTabProps) {
  const images = (product.pictureList || []).filter(img => !!img.picture?.id);

  const [screenshotsLabel, screenshotAlt, aboutLabel] = await Promise.all([
    t('Screenshots'),
    t('Product screenshot'),
    t('About this plugin'),
  ]);

  return (
    <div className="space-y-8">
      {/* Screenshots */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            {screenshotsLabel}
          </h2>
          <ScreenshotGallery
            images={images
              .filter(img => img.picture?.id)
              .map(img => ({
                id: img.id,
                src: getProductScreenshotURL({
                  workspaceURI,
                  productId: product.id,
                  fileId: img.picture!.id,
                }),
              }))}
            alt={screenshotAlt}
          />
        </div>
      )}

      {/* About Section */}
      <div className="bg-card rounded-lg border border-border p-4 md:p-8 space-y-4">
        <h2 className="text-xl font-bold text-foreground">{aboutLabel}</h2>
        <RichTextViewer
          content={product.longDescription || product.description || undefined}
        />
      </div>
    </div>
  );
}
