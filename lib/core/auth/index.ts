import {getServerSession} from 'next-auth';
import type {NextAuthOptions} from 'next-auth';

// ---- CORE IMPORTS ---- //
import {findGooveeUserByEmail} from '@/orm/partner';
import {type Tenant} from '@/tenant';

import google from './(ee)/google';
import keycloak from './(ee)/keycloak';
import credentials from './credentials';

export const authOptions: NextAuthOptions = {
  providers: [credentials, google, keycloak],
  callbacks: {
    async session({session, token}) {
      if (token.provider) {
        (session as any).provider = token.provider;
      }

      const user =
        session?.user?.email &&
        (await findGooveeUserByEmail(
          session.user.email,
          token?.tenantId as Tenant['id'],
        ));

      if (user) {
        const {
          id,
          emailAddress,
          fullName: name = '',
          simpleFullName = '',
          isContact,
          mainPartner,
          localization,
        } = user;

        session.user = {
          id,
          name,
          email: emailAddress?.address,
          isContact,
          simpleFullName,
          mainPartnerId: isContact ? mainPartner?.id : undefined,
          tenantId: token?.tenantId as Tenant['id'],
          locale: localization?.code,
        };
      }

      return session;
    },
    async jwt({user, token, trigger, session, account}: any) {
      if (account) {
        token.provider = account.provider;
      }

      if (
        trigger === 'update' &&
        session?.email &&
        session?.id &&
        session?.tenantId
      ) {
        /**
         * Updating session after registering with Google Oauth
         */

        const partner = await findGooveeUserByEmail(
          session.email,
          session.tenantId,
        );

        if (partner) {
          const {
            id,
            name,
            isContact,
            mainPartner,
            localization,
            simpleFullName,
          } = partner;

          token.id = id;
          token.name = name;
          token.simpleFullName = simpleFullName;
          token.email = session.email;
          token.isContact = isContact;
          token.tenantId = session.tenantId;
          token.mainPartnerId = isContact ? mainPartner?.id : undefined;
          token.locale = localization?.code;
        }
      }

      if (user?.tenantId) {
        token.tenantId = user.tenantId;
      }

      return token;
    },
  },
};

export async function getSession(...args: any[]) {
  return getServerSession(...([...args, authOptions] as any));
}
