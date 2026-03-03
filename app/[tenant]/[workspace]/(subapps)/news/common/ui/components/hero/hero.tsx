'use client';

import React from 'react';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  BANNER_DESCRIPTION,
  BANNER_TITLES,
  IMAGE_URL,
  SUBAPP_CODES,
  SUBAPP_PAGE,
} from '@/constants';
import {HeroSearch, Search} from '@/ui/components';
import {PortalWorkspace} from '@/types';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {SearchItem} from '@/subapps/news/common/ui/components';
import {findSearchNews} from '@/subapps/news/common/actions/action';

async function findNews({workspaceURL}: {workspaceURL: string}) {
  return findSearchNews({workspaceURL})
    .then((result: any) => (result?.error ? [] : result))
    .catch(() => []);
}

export function Hero({workspace}: {workspace: PortalWorkspace}) {
  const router = useRouter();

  const {workspaceURL, workspaceURI} = useWorkspace();
  const imageURL = workspace?.config?.newsHeroBgImage?.id
    ? `${workspaceURI}/${SUBAPP_CODES.news}/api/hero/background`
    : IMAGE_URL;

  const handleClick = (slug: string) => {
    router.push(
      `${workspaceURI}/${SUBAPP_CODES.news}/${SUBAPP_PAGE.article}/${slug}`,
    );
  };

  const renderSearch = () => (
    <Search
      searchKey="title"
      findQuery={() => findNews({workspaceURL})}
      renderItem={SearchItem}
      onItemClick={handleClick}
    />
  );

  return (
    <HeroSearch
      title={workspace?.config?.newsHeroTitle || i18n.t(BANNER_TITLES.news)}
      description={
        workspace?.config?.newsHeroDescription || i18n.t(BANNER_DESCRIPTION)
      }
      image={imageURL}
      background={workspace?.config?.newsHeroOverlayColorSelect || 'default'}
      blendMode={
        workspace?.config?.newsHeroOverlayColorSelect ? 'overlay' : 'normal'
      }
      renderSearch={renderSearch}
    />
  );
}

export default Hero;
