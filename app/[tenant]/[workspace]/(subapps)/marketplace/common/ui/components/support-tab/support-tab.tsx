import Link from 'next/link';
import {FileText, ExternalLink, User, AlertCircle} from 'lucide-react';
import {Button} from '@/ui/components';
import type {SingleProduct} from '../../../orm/orm';

interface SupportTabProps {
  product: SingleProduct;
}

export function SupportTab({product}: SupportTabProps) {
  const hasAnyLink =
    product.documentationUrl ||
    product.supportIssuesUrl ||
    product.supportContactUrl;

  if (!hasAnyLink) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Support</h2>
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">No support links available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Support</h2>

      <div className="bg-card rounded-lg border border-border p-8 space-y-6">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-foreground">Need help?</h3>
          <p className="text-sm text-muted-foreground">
            Get in touch with the maintainer or browse the documentation.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {product.documentationUrl && (
            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-full h-11">
              <Link
                href={product.documentationUrl}
                target="_blank"
                rel="noopener noreferrer">
                <FileText size={16} />
                Read documentation
              </Link>
            </Button>
          )}

          {product.supportIssuesUrl && (
            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-full h-11">
              <Link
                href={product.supportIssuesUrl}
                target="_blank"
                rel="noopener noreferrer">
                <ExternalLink size={16} />
                Open issues on Git
              </Link>
            </Button>
          )}

          {product.supportContactUrl && (
            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-full h-11">
              <Link
                href={product.supportContactUrl}
                target="_blank"
                rel="noopener noreferrer">
                <User size={16} />
                Contact author
              </Link>
            </Button>
          )}

          {product.supportIssuesUrl && (
            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-full h-11">
              <Link
                href={product.supportIssuesUrl}
                target="_blank"
                rel="noopener noreferrer">
                <AlertCircle size={16} />
                Report a problem
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
