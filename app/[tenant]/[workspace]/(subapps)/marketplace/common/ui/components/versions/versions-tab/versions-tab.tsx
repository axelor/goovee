import {SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {t} from '@/locale/server';
import type {Cloned} from '@/types/util';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/pagination';
import {clone} from '@/utils';
import {cn} from '@/utils/css';
import {getPaginationButtons, getSkip, getTotal} from '@/utils/pagination';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Link} from '@/ui/components/link';
import {
  findProductVersions,
  type ListProductVersion,
  type SingleProduct,
} from '../../../../orm';
import {VersionCard} from '../version-card/version-card';

interface VersionsTabProps {
  product: SingleProduct;
  workspaceURI: string;
  client: Client;
  versionPage: number;
  currentVersionId?: string;
  /** Owner preview: download links rendered inert. */
  preview?: boolean;
  /** Returns the URL for a given page number (preserves other search params). */
  buildPageHref: (page: number) => string;
  canDownloadPromise: Promise<boolean>;
}

export async function VersionsTab({
  product,
  workspaceURI,
  client,
  versionPage,
  currentVersionId,
  preview = false,
  buildPageHref,
  canDownloadPromise,
}: VersionsTabProps) {
  const VERSIONS_PAGE_SIZE = 8;

  const canDownload = await canDownloadPromise;

  const versions = await findProductVersions({
    productId: product.id,
    client,
    take: VERSIONS_PAGE_SIZE,
    skip: getSkip(VERSIONS_PAGE_SIZE, versionPage),
    includeUnpublished: preview,
  });

  const totalVersionCount = getTotal(versions);
  const totalVersionPages = Math.ceil(totalVersionCount / VERSIONS_PAGE_SIZE);

  if (totalVersionCount === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">
          {await t('No versions available')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={cn({
              'border-b border-border': index < versions.length - 1,
            })}>
            <VersionCard
              version={clone(version)}
              isLatest={version.id === currentVersionId}
              preview={preview}
              canDownload={canDownload}
              downloadHref={`${workspaceURI}/${SUBAPP_CODES.marketplace}/api/products/${product.id}/versions/${version.id}/download`}
            />
          </div>
        ))}
      </div>

      {totalVersionPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious asChild>
                <Link
                  scroll={false}
                  replace
                  href={buildPageHref(Math.max(1, versionPage - 1))}
                  className={cn({
                    ['pointer-events-none opacity-50']: versionPage <= 1,
                  })}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">{await t('Previous')}</span>
                </Link>
              </PaginationPrevious>
            </PaginationItem>
            {getPaginationButtons({
              currentPage: versionPage,
              totalPages: totalVersionPages,
            }).map((value, i) => {
              if (typeof value === 'string') {
                return (
                  <PaginationItem key={i}>
                    <span className="px-2">...</span>
                  </PaginationItem>
                );
              }
              return (
                <PaginationItem key={value}>
                  <PaginationLink isActive={versionPage === value} asChild>
                    <Link scroll={false} replace href={buildPageHref(value)}>
                      {value}
                    </Link>
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext asChild>
                <Link
                  scroll={false}
                  replace
                  href={buildPageHref(
                    Math.min(totalVersionPages, versionPage + 1),
                  )}
                  className={cn({
                    ['pointer-events-none opacity-50']:
                      versionPage >= totalVersionPages,
                  })}>
                  <span className="sr-only">{await t('Next')}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
}
