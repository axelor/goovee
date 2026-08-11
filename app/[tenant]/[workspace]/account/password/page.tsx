// ---- CORE IMPORTS ---- //
import {t} from '@/lib/core/locale/server';

// ---- LOCAL IMPORTS ---- //
import PasswordForm from './form';
import {SectionHeader} from '../common/ui/components';

export default async function Page() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow={await t('Security')}
        title={await t('Password')}
        description={await t(
          'Use a unique password of at least 12 characters.',
        )}
      />
      <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-6">
        <PasswordForm />
      </div>
    </div>
  );
}
