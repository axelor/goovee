'use client';

import type {Cloned} from '@/types/util';
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
import type {OverlayColor} from '@/types';
import {PortalWorkspace} from '@/orm/workspace';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {SearchItem} from '@/subapps/news/common/ui/components';
import {findSearchNews} from '@/subapps/news/common/actions/action';

async function findNews({workspaceURL}: {workspaceURL: string}) {
  return findSearchNews({workspaceURL})
    .then(result => (Array.isArray(result) ? result : []))
    .catch(() => []);
}

export function Hero({
  workspace,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  const router = useRouter();

  const {workspaceURL, workspaceURI} = useWorkspace();
  const imageURL = workspace?.config?.newsHeroBgImage?.id
    ? withBasePath(`${workspaceURI}/${SUBAPP_CODES.news}/api/hero/background`)
    : withBasePath(IMAGE_URL);

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
      background={
        (workspace?.config?.newsHeroOverlayColorSelect as OverlayColor) ||
        'default'
      }
      blendMode={
        workspace?.config?.newsHeroOverlayColorSelect ? 'overlay' : 'normal'
      }
      renderSearch={renderSearch}
    />
  );
}

export default Hero;
