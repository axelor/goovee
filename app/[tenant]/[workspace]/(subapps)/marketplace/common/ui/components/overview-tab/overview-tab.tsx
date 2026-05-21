import Image from 'next/image';
import {RichTextViewer} from '@/ui/components/rich-text-editor/rich-text-viewer';
import {t} from '@/locale/server';
import type {SingleProduct} from '../../../orm/orm';

interface OverviewTabProps {
  product: SingleProduct;
  tenantId: string;
}

export async function OverviewTab({product, tenantId}: OverviewTabProps) {
  const images = (product.portalImageList || []).filter(
    img => !!img.picture?.id,
  );

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map(
              image =>
                image.picture?.id && (
                  <div
                    key={image.id}
                    className="aspect-video bg-muted rounded-lg border border-border overflow-hidden">
                    <Image
                      src={`/api/tenant/${tenantId}/product/image/${image.picture.id}`}
                      alt={screenshotAlt}
                      width={600}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ),
            )}
          </div>
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
