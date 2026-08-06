// ---- CORE IMPORTS ---- //
import {t} from '@/lib/core/locale/server';

// ---- LOCAL IMPORTS ---- //
import PreferencesForm from './form';
import {SectionHeader} from '../common/ui/components';

export default async function Page() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow={await t('Account')}
        title={await t('Preferences')}
        description={await t('Default behavior when you sign in.')}
      />
      <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-6">
        <PreferencesForm />
      </div>
    </div>
  );
}
