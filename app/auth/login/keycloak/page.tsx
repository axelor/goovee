export const dynamic = 'force-dynamic';

import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {getTranslation} from '@/locale/server';
import {findGooveeUserByEmail, registerPartner} from '@/orm/partner';
import {findWorkspaceByURL} from '@/orm/workspace';
import {l10n} from '@/locale/server/l10n';
import {findRegistrationLocalization} from '@/orm/localizations';
import {UserType} from '@/auth/types';

// ---- LOCAL IMPORTS ---- //
import {extractSearchParams, isExistingUser} from '../../register/common/utils';
import Content from './content';

function Description({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="container space-y-6 mt-8">
      <h1 className="text-[2rem] font-bold">{title}</h1>
      <div className="bg-white py-4 px-6">
        <p>{description}</p>
      </div>
    </div>
  );
}

const createUserOnLogin = process.env.KEYCLOAK_CREATE_USER_ON_LOGIN === 'true';

export default async function Page({
  searchParams,
}: {
  searchParams: {
    workspaceURI?: string;
    tenant: string;
    callbackurl: string;
  };
}) {
  const {workspaceURI, tenantId, workspaceURL} = extractSearchParams({
    searchParams,
  });

  if (!(workspaceURI && tenantId)) {
    return notFound();
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return (
      <Description
        title={await getTranslation({tenant: tenantId}, 'Log In')}
        description={await getTranslation(
          {tenant: tenantId},
          'Login with your keycloak account to continue.',
        )}
      />
    );
  }

  let partner = await findGooveeUserByEmail(user.email, tenantId);

  if (!partner) {
    if (createUserOnLogin) {
      try {
        const workspace = await findWorkspaceByURL({
          url: workspaceURL,
          tenantId,
        });

        if (!workspace) {
          return (
            <Description
              title={await getTranslation({tenant: tenantId}, 'Log In')}
              description={await getTranslation(
                {tenant: tenantId},
                'Invalid Workspace',
              )}
            />
          );
        }

        const existingUser = await findGooveeUserByEmail(user.email, tenantId);

        if (existingUser) {
          partner = existingUser;
        } else {
          const locale = (await l10n()).getLocale();

          const localization = await findRegistrationLocalization({
            locale,
            tenantId,
          });

          await registerPartner({
            type: UserType.individual,
            email: user.email,
            name: user.name || user.email,
            workspaceURL,
            tenantId,
            localizationId: localization?.id,
          });

          partner = await findGooveeUserByEmail(user.email, tenantId);

          console.log(partner);

          if (!partner) {
            throw new Error();
          }
        }
      } catch (err) {
        return (
          <Description
            title={await getTranslation({tenant: tenantId}, 'Log In')}
            description={await getTranslation(
              {tenant: tenantId},
              'We cannot find your record.',
            )}
          />
        );
      }
    } else {
      return (
        <Description
          title={await getTranslation({tenant: tenantId}, 'Log In')}
          description={await getTranslation(
            {tenant: tenantId},
            'We cannot find your record.',
          )}
        />
      );
    }
  }

  const existing = await isExistingUser({
    workspaceURL,
    tenantId,
    user: {
      isContact: partner.isContact,
      id: partner.id,
      mainPartnerId: partner.isContact ? partner.mainPartner?.id : undefined,
      email: user.email,
    },
  });

  if (!existing) {
    return (
      <Description
        title={await getTranslation({tenant: tenantId}, 'Log In')}
        description={await getTranslation(
          {tenant: tenantId},
          'You are not a member of this workspace.',
        )}
      />
    );
  }

  return <Content partner={partner} />;
}
