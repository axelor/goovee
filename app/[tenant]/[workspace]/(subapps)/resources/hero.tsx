'use client';

// ---- CORE IMPORTS ---- //
import {HeroSearch} from '@/ui/components';
import type {OverlayColor} from '@/types';
import type {Cloned} from '@/types/util';
import {i18n} from '@/locale';
import {
  BANNER_DESCRIPTION,
  BANNER_TITLES,
  IMAGE_URL,
  SUBAPP_CODES,
} from '@/constants';
import type {PortalWorkspace} from '@/orm/workspace';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import Search from './search';

export const Hero = ({
  workspace,
  workspaceURI,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  workspaceURI: string;
}) => {
  const renderSearch = () => <Search workspaceURL={workspace.url} />;

  const imageURL = workspace?.config?.resourcesHeroBgImage?.id
    ? withBasePath(
        `${workspaceURI}/${SUBAPP_CODES.resources}/api/hero/background`,
      )
    : withBasePath(IMAGE_URL);

  return (
    <>
      <HeroSearch
        title={
          workspace?.config?.resourcesHeroTitle ||
          i18n.t(BANNER_TITLES.resources)
        }
        description={
          workspace?.config?.resourcesHeroDescription ||
          i18n.t(BANNER_DESCRIPTION)
        }
        image={imageURL}
        background={
          (workspace?.config
            ?.resourcesHeroOverlayColorSelect as OverlayColor) || 'default'
        }
        blendMode={
          workspace?.config?.resourcesHeroOverlayColorSelect
            ? 'overlay'
            : 'normal'
        }
        renderSearch={renderSearch}
      />
    </>
  );
};

export default Hero;
