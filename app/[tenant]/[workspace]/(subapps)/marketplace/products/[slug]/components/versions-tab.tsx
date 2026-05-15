'use server';

import Link from 'next/link';
import {ChevronLeft, ChevronRight, Download} from 'lucide-react';
import {SUBAPP_CODES} from '@/constants';
import {cn} from '@/utils/css';
import {Badge, Button} from '@/ui/components';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/pagination';
import {getPaginationButtons} from '@/utils/pagination';
import {
  findProductVersions,
  type SingleProduct,
  type ListProductVersion,
} from '../../../common/orm/orm';
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
  const VERSIONS_PAGE_SIZE = 10;

  const versionsResult = await findProductVersions({
    productId: product.id,
    client,
    take: VERSIONS_PAGE_SIZE,
    skip: (versionPage - 1) * VERSIONS_PAGE_SIZE,
  });

  const totalVersionCount = Number(versionsResult?.[0]?._count ?? 0);
  const totalVersionPages = Math.ceil(totalVersionCount / VERSIONS_PAGE_SIZE);

  if (totalVersionCount === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Versions</h2>
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">No versions available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Versions</h2>

      <div className="space-y-4">
        {versionsResult.map((version: ListProductVersion) => (
          <div
            key={version.id}
            className="bg-card rounded-lg border border-border p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-foreground">
                    {version.versionNumber}
                  </h3>
                  {version.id === currentVersionId && (
                    <Badge variant="success">Latest</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {version.dateOfApproval
                    ? `Released ${new Date(version.dateOfApproval as unknown as string).toLocaleDateString()}`
                    : 'Not released yet'}
                </p>
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
                  Download
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {totalVersionPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious asChild>
                <Link
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=versions${versionPage > 1 ? `&versionPage=${versionPage - 1}` : ''}`}
                  className={cn({
                    ['pointer-events-none opacity-50']: versionPage <= 1,
                  })}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
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
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=versions${versionPage < totalVersionPages ? `&versionPage=${versionPage + 1}` : ''}`}
                  className={cn({
                    ['pointer-events-none opacity-50']:
                      versionPage >= totalVersionPages,
                  })}>
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
