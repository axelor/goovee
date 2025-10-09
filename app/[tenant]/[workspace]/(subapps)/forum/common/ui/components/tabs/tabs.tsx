'use client';

import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {TAB_TITLES} from '@/subapps/forum/common/constants';

export const Tab = ({
  tab,
  onClick,
  isActive,
}: {
  tab: any;
  isActive: boolean;
  onClick: (value: string) => void;
}) => {
  const Icon = tab.icon;
  const handleClick = () => {
    onClick(tab.key);
  };

  return (
    <div
      key={tab.id}
      className={`py-2 rounded cursor-pointer font-semibold text-base flex gap-2 items-center justify-center ${
        isActive ? 'bg-success-light text-success' : 'bg-white'
      }`}
      onClick={handleClick}>
      <Icon className="w-6 h-6" />
      {i18n.t(tab.title)}
    </div>
  );
};

export const Tabs = ({activeTab}: {activeTab: string}) => {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();

  const handleClick = (type: string) => {
    router.push(`${workspaceURI}/${SUBAPP_CODES.forum}?type=${type}`);
  };

  return (
    <>
      <div className="bg-white px-4 pb-4 pt-1 rounded-b-lg border-none hidden">
        <div className="grid grid-cols-2 gap-2 ">
          {TAB_TITLES.map(tab => (
            <Tab
              key={tab.id}
              tab={tab}
              onClick={handleClick}
              isActive={activeTab === tab.key}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Tabs;
