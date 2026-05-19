'use server';

import Link from 'next/link';
import {ChevronLeft, ChevronRight, Download} from 'lucide-react';
import {SUBAPP_CODES} from '@/constants';
import {cn} from '@/utils/css';
import {Badge, Button} from '@/ui/components';
import {getSkip, getPaginationButtons, getTotal} from '@/utils/pagination';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/pagination';
import {
  findProductVersions,
  type SingleProduct,
  type ListProductVersion,
} from '../../../orm/orm';
import {t} from '@/locale/server';
import type {Client} from '@/goovee/.generated/client';

interface VersionsTabProps {
  product: SingleProduct;
  workspaceURI: string;
  client: Client;
  versionPage: number;
  currentVersionId?: string;
}

export async function VersionsTab({
  product,
  workspaceURI,
  client,
  versionPage,
  currentVersionId,
}: VersionsTabProps) {
  const VERSIONS_PAGE_SIZE = 8;

  const versionsResult = await findProductVersions({
    productId: product.id,
    client,
    take: VERSIONS_PAGE_SIZE,
    skip: getSkip(VERSIONS_PAGE_SIZE, versionPage),
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
  ] = await Promise.all([
    t('No versions available'),
    t('Latest'),
    t('Compatible:'),
    t('No compatible versions specified'),
    t('Download'),
    t('Previous'),
    t('Next'),
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
                  {version.versionNumber}
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
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=versions${versionPage > 1 ? `&versionPage=${versionPage - 1}` : ''}`}
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
                    <Link
                      scroll={false}
                      href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=versions&versionPage=${value}`}>
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
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=versions${versionPage < totalVersionPages ? `&versionPage=${versionPage + 1}` : ''}`}
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
