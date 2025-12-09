import {DEFAULT_LOGO_URL, IMAGE_URL} from '@/constants';
import {t} from '@/lib/core/locale/server';
import {PortalWorkspace} from '@/types';
import {HeroSearch} from '@/ui/components/hero-search';

export async function Home({
  workspace,
  workspaceURI,
}: {
  workspace: PortalWorkspace;
  workspaceURI: string;
}) {
  const imageURL = workspace.config?.homepageHeroBgImage?.id
    ? `${workspaceURI}/api/home/hero/background`
    : IMAGE_URL;

  const logoId = workspace.logo?.id || workspace.config?.company?.logo?.id;
  const logoURL = logoId
    ? `${workspaceURI}/api/workspace/logo/image`
    : DEFAULT_LOGO_URL;

  return (
    <HeroSearch
      title={workspace.config?.homepageHeroTitle || (await t('app-home'))}
      description={
        workspace.config?.homepageHeroDescription ||
        (await t(
          'Mi eget leo viverra cras pharetra enim viverra. Ac at non pretium etiam viverra. Ac at non pretium etiam',
        ))
      }
      background={workspace.config?.homepageHeroOverlayColorSelect || 'default'}
      blendMode={
        workspace.config?.homepageHeroOverlayColorSelect ? 'overlay' : 'normal'
      }
      groupImg={logoURL}
      image={imageURL}
    />
  );
}
