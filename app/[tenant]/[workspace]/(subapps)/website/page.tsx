import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import Link from 'next/link';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {findAllMainWebsites} from '@/subapps/website/common/orm/website';
import {NotFound} from '@/subapps/website/common/components/blocks/not-found';
import {inverseTransformLocale} from '@/locale/utils';
import type {Website} from '@/types';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const access = await ensureAccess({
    code: SUBAPP_CODES.website,
    allowGuest: true,
  });

  if (!access.ok) return denyPage(access);

  const {user} = access;
  const {client} = access.tenant;

  const workspaceURL = access.workspace.url;

  let locale = user?.locale;

  if (!locale) {
    const acceptLanguage = (await headers()).get('Accept-Language')!;
    const acceptLanguageLocale = acceptLanguage?.split(',')?.[0];

    if (acceptLanguageLocale) {
      locale = inverseTransformLocale(acceptLanguageLocale);
    }
  }

  const mainWebsites = await findAllMainWebsites({
    workspaceURL,
    user,
    client,
    locale,
  });

  if (!mainWebsites?.length)
    return <NotFound homePageUrl={access.url.forRouter()} />;

  const getWebsiteURL = (website: Website) =>
    access.url.forRouter(`/${SUBAPP_CODES.website}/${website.slug}`);

  if (mainWebsites.length === 1) {
    return redirect(getWebsiteURL(mainWebsites?.[0]));
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mainWebsites.map(async website => (
          <Link
            key={website.slug}
            href={getWebsiteURL(website)}
            {...(user
              ? {}
              : {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                })}>
            <div className="bg-card p-6 rounded-lg">
              <p className="text-[1rem] font-semibold text-ellipsis whitespace-nowrap overflow-hidden">
                {website.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
