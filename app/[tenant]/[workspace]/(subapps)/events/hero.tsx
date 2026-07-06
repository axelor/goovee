'use client';

import type {Cloned} from '@/types/util';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {
  BANNER_DESCRIPTION,
  BANNER_TITLES,
  IMAGE_URL,
  SUBAPP_CODES,
} from '@/constants';
import {i18n} from '@/lib/core/locale';
import type {EventsConfig} from '@/subapps/events/common/orm/config';
import {HeroSearch, Search} from '@/ui/components';
import type {OverlayColor} from '@/types';
import {useToast} from '@/ui/hooks';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {getAllEvents} from '@/subapps/events/common/actions/actions';
import {SearchItem} from '@/subapps/events/common/ui/components';

export const Hero = ({
  config,
}: {
  config: EventsConfig | Cloned<EventsConfig>;
}) => {
  const {workspaceURI, workspaceURL} = useWorkspace();
  const router = useRouter();
  const {toast} = useToast();

  const handlClick = (slug: string | number) => {
    router.push(`${workspaceURI}/${SUBAPP_CODES.events}/${slug}`);
  };

  const renderSearch = () => (
    <Search
      findQuery={async ({query}: {query: string}) => {
        try {
          const {error, message, data} = await getAllEvents({
            workspaceURL,
            search: query,
          });
          if (error) {
            toast({
              variant: 'destructive',
              description: i18n.t(
                message || 'Something went wrong while searching!',
              ),
            });
            return [];
          }

          return data.events || [];
        } catch (error) {
          toast({
            variant: 'destructive',
            description: i18n.t('Something went wrong while searching!'),
          });
          return [];
        }
      }}
      renderItem={SearchItem}
      searchKey="eventTitle"
      onItemClick={handlClick}
    />
  );

  const imageURL = config.eventHeroBgImage?.id
    ? withBasePath(`${workspaceURI}/${SUBAPP_CODES.events}/api/hero/background`)
    : withBasePath(IMAGE_URL);
  return (
    <HeroSearch
      title={config.eventHeroTitle || i18n.t(BANNER_TITLES.events)}
      description={config.eventHeroDescription || i18n.t(BANNER_DESCRIPTION)}
      image={imageURL}
      background={
        (config.eventHeroOverlayColorSelect as OverlayColor) || 'default'
      }
      blendMode={config.eventHeroOverlayColorSelect ? 'overlay' : 'normal'}
      renderSearch={renderSearch}
    />
  );
};

export default Hero;
