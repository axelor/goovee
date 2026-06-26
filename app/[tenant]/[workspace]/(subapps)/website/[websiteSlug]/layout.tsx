import type {ReactNode} from 'react';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
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
import {Metadata} from 'next';

export async function generateMetadata(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    websiteSlug: string;
  }>;
}): Promise<Metadata | null> {
  const params = await props.params;
  const {websiteSlug} = params;
  const {workspaceURL, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.website,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  if (!access.ok) return null;

  const {user} = access;
  const {client} = access.tenant;

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

  const {websiteSlug} = params;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.website,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  /* Gate only to skip this layout's website queries for a visitor the page will
     deny; on denial pass children through untouched and let the page issue the
     actual redirect / unauthorized / notFound (same as the events/news/shop
     layouts — a layout must not redirect, as it does not re-run on client-side
     navigation between sibling pages). */
  if (!access.ok) return <>{children}</>;

  const {user} = access;
  const {client, config} = access.tenant;

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
