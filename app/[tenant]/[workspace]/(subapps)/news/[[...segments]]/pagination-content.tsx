'use client';

// ---- CORE IMPORTS ---- //
import {useSearchParams} from '@/ui/hooks';
import {Pagination} from '@/ui/components';
import {DEFAULT_PAGE, URL_PARAMS} from '@/constants';
import type {PageInfo} from '@/types';

export function PaginationContent({
  pageInfo: {page, pages, hasPrev, hasNext} = {} as PageInfo,
}: {
  pageInfo: PageInfo;
}) {
  const {update} = useSearchParams();

  const handlePreviousPage = () => {
    if (!hasPrev) return;
    update([{key: URL_PARAMS.page, value: Math.max(Number(page) - 1, 1)}]);
  };

  const handleNextPage = () => {
    if (!hasNext) return;
    update([{key: URL_PARAMS.page, value: Number(page) + 1}]);
  };

  const handlePage = (page: string | number) => {
    update([{key: URL_PARAMS.page, value: page}]);
  };

  return (
    pages > DEFAULT_PAGE && (
      <Pagination
        page={page}
        pages={pages}
        disablePrev={!hasPrev}
        disableNext={!hasNext}
        onPrev={handlePreviousPage}
        onNext={handleNextPage}
        onPage={handlePage}
      />
    )
  );
}

export default PaginationContent;
