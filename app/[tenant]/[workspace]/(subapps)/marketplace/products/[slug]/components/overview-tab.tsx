import type {SingleProduct} from '../../../common/orm/orm';

interface OverviewTabProps {
  product: SingleProduct;
}

export async function OverviewTab({product}: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Screenshots */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Screenshots</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="aspect-video bg-muted rounded-lg border border-border"></div>
          <div className="aspect-video bg-muted rounded-lg border border-border"></div>
          <div className="aspect-video bg-muted rounded-lg border border-border"></div>
        </div>
      </div>

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
