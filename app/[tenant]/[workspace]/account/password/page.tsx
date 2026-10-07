import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/access/ensure-access';
import {getSignInMethods} from '@/auth/sign-in-methods';
import {t} from '@/locale/server';
import {findGooveeUserByEmail} from '@/orm/partner';

// ---- LOCAL IMPORTS ---- //
import PasswordForm from './form';
import SetPasswordForm from './set-password-form';
import {SectionHeader} from '../common/ui/components';

export default async function Page() {
  const access = await ensureAccess();
  if (!access.ok) return notFound();

  const {user, tenant} = access;

  if (!getSignInMethods(tenant.config).password) return notFound();

  const partner = await findGooveeUserByEmail(user.email, tenant.client);
  if (!partner) return notFound();

  /* An account created through Google or Keycloak has no password. It is given
   * a first one rather than asked for an old one it never had. */
  const hasPassword = Boolean(partner.password);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow={await t('Security')}
        title={await t('Password')}
        description={
          hasPassword
            ? await t('Use a unique password of at least 12 characters.')
            : await t(
                'Your account has no password yet. Set one to also sign in with your email and a password.',
              )
        }
      />
      <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-6">
        {hasPassword ? <PasswordForm /> : <SetPasswordForm />}
      </div>
    </div>
  );
}
