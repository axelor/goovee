import {getSession} from '@/lib/core/auth';
import Content from './content';
import {t} from '@/locale/server';

export default async function Page() {
  const session = await getSession();
  if (session?.user) {
    return (
      <div className="container space-y-6 mt-8">
        <h1 className="text-[2rem] font-bold">{await t('Reset Password')}</h1>
        <div className="bg-white py-4 px-6">
          <p>
            {await t(
              'You are currently loggedin. Logout to reset your password.',
            )}
          </p>
        </div>
      </div>
    );
  }
  return <Content />;
}
