'use client';
import {authClient} from '@/lib/auth-client';
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
import type {PortalWorkspace} from '@/types';
import {HeroSearch, Search} from '@/ui/components';
import {useToast} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import {getAllEvents} from '@/subapps/events/common/actions/actions';
import {SearchItem} from '@/subapps/events/common/ui/components';

export const Hero = ({workspace}: {workspace: PortalWorkspace}) => {
  const {data: session} = authClient.useSession();
  const {user} = session || {};
  const {workspaceURI} = useWorkspace();
  const router = useRouter();
  const {toast} = useToast();

  const handlClick = (slug: string | number) => {
    router.push(`${workspaceURI}/${SUBAPP_CODES.events}/${slug}`);
  };

  const renderSearch = () => (
    <Search
      findQuery={async ({query}: any) => {
        try {
          const response: any = await getAllEvents({
            workspace,
            user,
            search: query,
          });
          if (response?.error) {
            toast({
              variant: 'destructive',
              description: i18n.t(
                response.error || 'Something went wrong while searching!',
              ),
            });
            return [];
          }

          return response.events || [];
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

  const imageURL = workspace?.config?.eventHeroBgImage?.id
    ? `${workspaceURI}/${SUBAPP_CODES.events}/api/hero/background`
    : IMAGE_URL;
  return (
    <HeroSearch
      title={workspace?.config?.eventHeroTitle || i18n.t(BANNER_TITLES.events)}
      description={
        workspace?.config?.eventHeroDescription || i18n.t(BANNER_DESCRIPTION)
      }
      image={imageURL}
      background={workspace?.config?.eventHeroOverlayColorSelect || 'default'}
      blendMode={
        workspace?.config?.eventHeroOverlayColorSelect ? 'overlay' : 'normal'
      }
      renderSearch={renderSearch}
    />
  );
};

export default Hero;
