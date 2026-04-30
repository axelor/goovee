'use client';

import {useRouter, usePathname, useSearchParams} from 'next/navigation';
import {BiSearch} from 'react-icons/bi';
import {MdGridView, MdOutlineList} from 'react-icons/md';

import {cn} from '@/utils/css';

export function ProductSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const view = searchParams.get('view') ?? 'grid';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    value ? params.set(key, value) : params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    updateParam('search', (data.get('search') as string) ?? '');
  };

  return (
    <div className="flex items-center justify-between bg-card border-b px-4 py-2 gap-4">
      <form onSubmit={handleSearch} className="relative w-full max-w-sm">
        <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg" />
        <input
          name="search"
          defaultValue={searchParams.get('search') ?? ''}
          placeholder="Search software..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-full border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </form>
      <div className="flex items-center gap-2 text-muted-foreground">
        <button onClick={() => updateParam('view', 'grid')}>
          <MdGridView className={cn('text-xl', {'text-primary': view === 'grid'})} />
        </button>
        <button onClick={() => updateParam('view', 'list')}>
          <MdOutlineList className={cn('text-xl', {'text-primary': view === 'list'})} />
        </button>
      </div>
    </div>
  );
}

export default ProductSearch;
