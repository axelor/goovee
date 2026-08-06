// ---- LOCAL IMPORTS ---- //
import {ForumNotifSettingsSkeleton} from '@/subapps/forum/common/ui/components';

export default function Loading() {
  return (
    <div className="bg-ink-25 min-h-full">
      <div className="max-w-[900px] mx-auto px-4 pt-7 pb-14">
        <ForumNotifSettingsSkeleton />
      </div>
    </div>
  );
}
