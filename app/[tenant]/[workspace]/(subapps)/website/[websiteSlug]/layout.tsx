import type {ReactNode} from 'react';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {Website} from '@/types';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {manager} from '@/tenant';

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
import {Metadata} from 'next';

export async function generateMetadata(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    websiteSlug: string;
  }>;
}): Promise<Metadata | null> {
  const params = await props.params;
  const {workspaceURL} = workspacePathname(params);
  const {tenant: tenantId, websiteSlug} = params;

  const session = await getSession();
  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return null;
  const {client} = tenant;

  const website = await findWebsiteSeoBySlug({
    websiteSlug,
    workspaceURL,
    user,
    client,
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

export default async function Layout(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    websiteSlug: Website['slug'];
  }>;
  children: ReactNode;
}) {
  const params = await props.params;

  const {children} = props;

  const session = await getSession();
  const user = session?.user;

  const {tenant: tenantId, websiteSlug} = params;
  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return <NotFound homePageUrl={`${workspaceURI}/${SUBAPP_CODES.website}`} />;
  }
  const {client, config} = tenant;

  const website = await findWebsiteBySlug({
    websiteSlug,
    workspaceURL,
    workspaceURI,
    user,
    client,
    config,
    mountTypes: layoutMountTypes,
  });

  if (!website) {
    return <NotFound homePageUrl={`${workspaceURI}/${SUBAPP_CODES.website}`} />;
  }

  const mainWebsiteLanguages = await findAllMainWebsiteLanguages({
    mainWebsiteId: website?.mainWebsite?.id,
    workspaceURL,
    user,
    client,
  });

  const navPosition = website.menu?.component?.typeSelect ?? 1;
  const isSideNav = navPosition === NAVIGATION_POSITION.LEFT_RIGHT_MENU;

  const menu = website?.menu?.component && (
    <Template
      menu={clone(website.menu)}
      workspaceURI={workspaceURI}
      websiteSlug={websiteSlug as string}
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
                websiteSlug={websiteSlug as string}
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
            websiteSlug={websiteSlug as string}
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
