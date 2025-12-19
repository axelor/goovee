import type {ReactNode} from 'react';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {Website} from '@/types';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {NotFound} from '@/subapps/website/common/components/blocks/not-found';
import {
  layoutMountTypes,
  MOUNT_TYPE,
  NAVIGATION_POSITION,
} from '@/subapps/website/common/constants';
import {
  findAllMainWebsiteLanguages,
  findWebsiteBySlug,
  findWebsiteSeoBySlug,
} from '@/subapps/website/common/orm/website';
import {Template} from './client-wrapper';
import {LanguageSelection} from './language-selection';
import {TemplateRoot} from './template-root';

export async function generateMetadata(
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      websiteSlug: string;
    }>;
  }
) {
  const params = await props.params;
  const {workspaceURL} = workspacePathname(params);
  const {tenant, websiteSlug} = params;

  const session = await getSession();
  const user = session?.user;

  const website = await findWebsiteSeoBySlug({
    websiteSlug,
    workspaceURL,
    user,
    tenantId: tenant,
  });

  if (!website) {
    return null;
  }

  return {
    title: {
      template: `%s | ${website.name}`,
      default: 'Page  ',
    },
  };
}

export default async function Layout(
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      websiteSlug: Website['slug'];
    }>;
    children: ReactNode;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const session = await getSession();
  const user = session?.user;

  const {tenant, websiteSlug} = params;
  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const website = await findWebsiteBySlug({
    websiteSlug,
    workspaceURL,
    user,
    tenantId: tenant,
    mountTypes: layoutMountTypes,
  });

  if (!website) {
    return <NotFound homePageUrl={`${workspaceURI}/${SUBAPP_CODES.website}`} />;
  }

  const mainWebsiteLanguages = await findAllMainWebsiteLanguages({
    mainWebsiteId: website?.mainWebsite?.id,
    workspaceURL,
    user,
    tenantId: tenant,
  });

  const navPosition = website.menu?.component?.typeSelect ?? 1;
  const isSideNav = navPosition === NAVIGATION_POSITION.LEFT_RIGHT_MENU;

  const menu = website?.menu?.component && (
    <Template
      menu={clone(website.menu)}
      workspaceURI={workspaceURI}
      websiteSlug={websiteSlug}
      code={website.menu.component.code}
      mountType={MOUNT_TYPE.MENU}
    />
  );

  return (
    <>
      <LanguageSelection
        languageList={mainWebsiteLanguages}
        active={websiteSlug}
      />
      <TemplateRoot>
        {!isSideNav && menu}
        <div className={`flex ${isSideNav ? 'flex-col lg:flex-row' : ''}`}>
          {isSideNav && menu}
          <div className="flex-1 min-w-0">
            {website.header?.component && (
              <Template
                workspaceURI={workspaceURI}
                websiteSlug={websiteSlug}
                data={clone(website.header.attrs)}
                code={website.header.component.code}
                contentId={website.header.id}
                contentVersion={website.header.version}
                mountType={MOUNT_TYPE.HEADER}
              />
            )}
            {children}
          </div>
        </div>
        {website.footer?.component && (
          <Template
            workspaceURI={workspaceURI}
            websiteSlug={websiteSlug}
            data={clone(website.footer.attrs)}
            code={website.footer.component.code}
            contentId={website.footer.id}
            contentVersion={website.footer.version}
            mountType={MOUNT_TYPE.FOOTER}
          />
        )}
      </TemplateRoot>
    </>
  );
}
