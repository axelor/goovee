'use server';

import {SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {t} from '@/locale/server';
import {Badge, Button} from '@/ui/components';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/pagination';
import {cn} from '@/utils/css';
import {getPaginationButtons, getSkip, getTotal} from '@/utils/pagination';
import {ChevronLeft, ChevronRight, Download} from 'lucide-react';
import Link from 'next/link';
import {
  findProductVersions,
  type ListProductVersion,
  type SingleProduct,
} from '../../../../orm';
import {formatVersionNumber} from '../../../../utils/version-number';

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

  const versionsResult = await findProductVersions({
    productId: product.id,
    client,
    take: VERSIONS_PAGE_SIZE,
    skip: getSkip(VERSIONS_PAGE_SIZE, versionPage),
    includeUnpublished: preview,
  });

  const totalVersionCount = getTotal(versionsResult);
  const totalVersionPages = Math.ceil(totalVersionCount / VERSIONS_PAGE_SIZE);

  const [
    noVersionsLabel,
    latestLabel,
    compatibleLabel,
    noCompatibleLabel,
    downloadLabel,
    previousLabel,
    nextLabel,
    inactiveLabel,
  ] = await Promise.all([
    t('No versions available'),
    t('Latest'),
    t('Compatible:'),
    t('No compatible versions specified'),
    t('Download'),
    t('Previous'),
    t('Next'),
    t('Inactive in preview'),
  ]);

  if (totalVersionCount === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">{noVersionsLabel}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {versionsResult.map((version: ListProductVersion, index) => (
          <div
            key={version.id}
            className={cn(
              'flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center p-4 sm:p-5',
              {
                'border-b border-border': index < versionsResult.length - 1,
              },
            )}>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-foreground">
                  v{formatVersionNumber(version)}
                </h3>
                {version.id === currentVersionId && (
                  <Badge variant="success">{latestLabel}</Badge>
                )}
              </div>
              {version.compatibilitySet &&
              version.compatibilitySet.length > 0 ? (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {compatibleLabel}
                  </span>
                  {version.compatibilitySet.map(axelorVersion => (
                    <Badge
                      key={axelorVersion.id}
                      variant="outline"
                      className="text-xs">
                      {axelorVersion.title}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  {noCompatibleLabel}
                </p>
              )}
            </div>
            {preview ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 flex-shrink-0 rounded-full"
                disabled
                title={inactiveLabel}>
                <Download size={16} />
                {downloadLabel}
              </Button>
            ) : canDownload ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 flex-shrink-0 rounded-full"
                asChild>
                <a
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/api/products/${product.id}/versions/${version.id}/download`}
                  download>
                  <Download size={16} />
                  {downloadLabel}
                </a>
              </Button>
            ) : null}
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
                  href={buildPageHref(Math.max(1, versionPage - 1))}
                  className={cn({
                    ['pointer-events-none opacity-50']: versionPage <= 1,
                  })}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">{previousLabel}</span>
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
                    <Link scroll={false} href={buildPageHref(value)}>
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
                  href={buildPageHref(
                    Math.min(totalVersionPages, versionPage + 1),
                  )}
                  className={cn({
                    ['pointer-events-none opacity-50']:
                      versionPage >= totalVersionPages,
                  })}>
                  <span className="sr-only">{nextLabel}</span>
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
