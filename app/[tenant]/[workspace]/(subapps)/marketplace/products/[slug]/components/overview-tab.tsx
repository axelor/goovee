import Image from 'next/image';
import type {SingleProduct} from '../../../common/orm/orm';

interface OverviewTabProps {
  product: SingleProduct;
  tenantId: string;
}

export async function OverviewTab({product, tenantId}: OverviewTabProps) {
  const images = (product.portalImageList || []).filter(img => img.picture?.id);

  return (
    <div className="space-y-8">
      {/* Screenshots */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Screenshots</h2>
          <div className="grid grid-cols-3 gap-4">
            {images.map(
              image =>
                image.picture?.id && (
                  <div
                    key={image.picture.id}
                    className="aspect-video bg-muted rounded-lg border border-border overflow-hidden">
                    <Image
                      src={`/api/tenant/${tenantId}/product/image/${image.picture.id}`}
                      alt="Product screenshot"
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
      <div className="bg-card rounded-lg border border-border p-8 space-y-4">
        <h2 className="text-xl font-bold text-foreground">About this plugin</h2>
        <p className="text-muted-foreground leading-relaxed">
          {product.description}
        </p>

        <div className="mt-6">
          <h3 className="font-semibold text-foreground mb-3">Key features:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Natural language to BPMN conversion</li>
            <li>• Auto-detection of existing models and entities</li>
            <li>• Validation against Axelor process engine</li>
            <li>• Template library for common patterns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
