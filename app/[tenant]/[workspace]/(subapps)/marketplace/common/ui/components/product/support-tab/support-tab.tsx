import {t} from '@/locale/server';
import {Button} from '@/ui/components';
import {AlertCircle, ExternalLink, FileText, User} from 'lucide-react';
import {Link} from '@/ui/components/link';
import type {SingleProduct} from '../../../../orm';

interface SupportTabProps {
  product: SingleProduct;
}

export async function SupportTab({product}: SupportTabProps) {
  const hasAnyLink =
    product.documentationUrl ||
    product.supportIssuesUrl ||
    product.supportContactUrl;

  if (!hasAnyLink) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">
          {await t('No support links available')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-4 md:p-8 space-y-6">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-foreground">
            {await t('Need help?')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {await t(
              'Get in touch with the maintainer or browse the documentation.',
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {await t('Read documentation')}
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
                {await t('Open issues on Git')}
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
                {await t('Contact author')}
              </Link>
            </Button>
          )}

          {/* TODO: "Report problem" reuses `supportIssuesUrl` — the same
              URL the "Open issues" button above already links to. Either
              drop this button or back it by a dedicated product field
              (e.g. `bugReportUrl` or a `mailto:`-style contact). */}
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
                {await t('Report a problem')}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
