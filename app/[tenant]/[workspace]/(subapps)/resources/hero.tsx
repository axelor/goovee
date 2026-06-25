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
import type {PortalAppConfig} from '@/orm/workspace';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import Search from './search';

export const Hero = ({
  config,
  workspaceURI,
  workspaceURL,
}: {
  config: PortalAppConfig | Cloned<PortalAppConfig>;
  workspaceURI: string;
  workspaceURL: string;
}) => {
  const renderSearch = () => <Search workspaceURL={workspaceURL} />;

  const imageURL = config.resourcesHeroBgImage?.id
    ? withBasePath(
        `${workspaceURI}/${SUBAPP_CODES.resources}/api/hero/background`,
      )
    : withBasePath(IMAGE_URL);

  return (
    <>
      <HeroSearch
        title={config.resourcesHeroTitle || i18n.t(BANNER_TITLES.resources)}
        description={
          config.resourcesHeroDescription || i18n.t(BANNER_DESCRIPTION)
        }
        image={imageURL}
        background={
          (config.resourcesHeroOverlayColorSelect as OverlayColor) || 'default'
        }
        blendMode={
          config.resourcesHeroOverlayColorSelect ? 'overlay' : 'normal'
        }
        renderSearch={renderSearch}
      />
    </>
  );
};

export default Hero;
