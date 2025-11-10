'use client';
import {useCallback, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {HeroSearch, Search, Skeleton} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useSearchParams} from '@/ui/hooks';
import {
  BANNER_DESCRIPTION,
  BANNER_TITLES,
  DEFAULT_LIMIT,
  IMAGE_URL,
  SUBAPP_CODES,
  URL_PARAMS,
} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {useForum} from '@/subapps/forum/common/ui/context';
import {SearchItem} from '@/subapps/forum/common/ui/components';
import {fetchPosts} from '@/subapps/forum/common/action/action';

export function Hero() {
  const [forceClose, setForceClose] = useState(false);
  const [_searchValue, setSearchValue] = useState<string>('');

  const {selectedGroup, workspace} = useForum();
  const {workspaceURI, workspaceURL} = useWorkspace();
  const {update} = useSearchParams();

  const imageURL = workspace?.config?.forumHeroBgImage?.id
    ? `${workspaceURI}/${SUBAPP_CODES.forum}/api/hero/background`
    : IMAGE_URL;

  const handleSearch = (term: string) => {
    if (!term.length) {
      update(
        [
          {key: URL_PARAMS.searchid, value: null},
          {key: URL_PARAMS.search, value: null},
        ],
        {scroll: false},
      );
    } else {
      setSearchValue(term);
    }
  };

  const handleSearchItemClick = useCallback(
    (result: any) => {
      if (!result) return;
      update([{key: URL_PARAMS.searchid, value: result.id}], {scroll: false});
      setForceClose(true);
    },
    [update],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, term: string) => {
      if (e.key === 'Enter' && term.trim().length > 0) {
        update([{key: URL_PARAMS.search, value: term}], {scroll: false});
      }
    },
    [update],
  );

  const handleSearchFilter = (value: string, search: string) => {
    const regex = /^(.*?)(?==[^=]*$)/;
    if (value.match(regex)?.[0].includes(search.toLowerCase())) return 1;
    return 0;
  };

  const handleSearchFocus = () => {
    setForceClose(false);
  };
  const renderSearch = () => (
    <Search
      searchKey="label"
      forceClose={forceClose}
      findQuery={async ({query}: any) => {
        const response: any = await fetchPosts({
          workspaceURL,
          search: query,
          limit: DEFAULT_LIMIT,
        });
        if (response) {
          const {posts} = response;
          return posts.map((p: any) => ({
            ...p,
            label: `${p.title.toLowerCase()}=${p.id}`,
          }));
        }
        return [];
      }}
      renderItem={SearchItem}
      onSearch={handleSearch}
      onItemClick={handleSearchItemClick}
      onFilter={handleSearchFilter}
      onFocus={handleSearchFocus}
      onKeyDown={handleSearchKeyDown}
    />
  );

  return (
    <HeroSearch
      title={
        selectedGroup?.name ??
        (workspace?.config?.forumHeroTitle || i18n.t(BANNER_TITLES.forum))
      }
      description={
        selectedGroup?.description ??
        (workspace?.config?.forumHeroDescription || i18n.t(BANNER_DESCRIPTION))
      }
      image={imageURL}
      groupImg={
        selectedGroup?.image?.id &&
        `${workspaceURL}/${SUBAPP_CODES.forum}/api/group/${selectedGroup?.id}/image`
      }
      background={workspace?.config?.forumHeroOverlayColorSelect || 'default'}
      blendMode={
        workspace?.config?.forumHeroOverlayColorSelect ? 'overlay' : 'normal'
      }
      renderSearch={!selectedGroup && renderSearch}
    />
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden flex-col lg:w-auto w-full h-[300px] lg:h-[353px] flex items-center justify-center bg-white mt-4">
      <div className="flex flex-col gap-4 w-full items-center ">
        <Skeleton className="w-20 h-20" />
        <Skeleton className="w-96 h-8" />
        <div className="flex flex-col gap-2 w-full items-center justify-center md:max-w-screen-sm lg:max-w-screen-md">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-5/6 h-4" />
        </div>
        <Skeleton className="w-3/5 h-12 md:max-w-screen-sm lg:max-w-screen-md" />
      </div>
    </div>
  );
}
