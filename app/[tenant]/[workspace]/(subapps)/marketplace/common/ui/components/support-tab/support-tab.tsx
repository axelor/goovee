import Link from 'next/link';
import {FileText, ExternalLink, User, AlertCircle} from 'lucide-react';
import {Button} from '@/ui/components';
import {t} from '@/locale/server';
import type {SingleProduct} from '../../../orm/orm';

interface SupportTabProps {
  product: SingleProduct;
}

export async function SupportTab({product}: SupportTabProps) {
  const hasAnyLink =
    product.documentationUrl ||
    product.supportIssuesUrl ||
    product.supportContactUrl;

  const [
    noSupportLabel,
    needHelpLabel,
    needHelpDescLabel,
    readDocsLabel,
    openIssuesLabel,
    contactAuthorLabel,
    reportProblemLabel,
  ] = await Promise.all([
    t('No support links available'),
    t('Need help?'),
    t('Get in touch with the maintainer or browse the documentation.'),
    t('Read documentation'),
    t('Open issues on Git'),
    t('Contact author'),
    t('Report a problem'),
  ]);

  if (!hasAnyLink) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">{noSupportLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-4 md:p-8 space-y-6">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-foreground">
            {needHelpLabel}
          </h3>
          <p className="text-sm text-muted-foreground">{needHelpDescLabel}</p>
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
                {readDocsLabel}
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
                {openIssuesLabel}
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
                {contactAuthorLabel}
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
                {reportProblemLabel}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
