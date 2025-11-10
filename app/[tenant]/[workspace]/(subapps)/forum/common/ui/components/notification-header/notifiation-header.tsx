'use client';
import React, {ReactNode} from 'react';

// ---- CORE IMPORTS ---- //

import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {GROUPS, NOTIFICATIONS_OPTIONS} from '@/subapps/forum/common/constants';

export const NotificationHeader = ({children}: {children: ReactNode}) => {
  return (
    <section className="py-6 px-4 lg:px-[6.25rem] w-full rounded-sm">
      <div className="bg-white px-4 py-4 mt-8 rounded-md">
        <div className="grid grid-cols-[1fr_4fr]  ">
          <h2 className="text-xl font-semibold">{i18n.t(GROUPS)}</h2>
          <div className="grid grid-cols-4 text-center text-sm font-normal">
            {NOTIFICATIONS_OPTIONS.map(item => (
              <span key={item.id}>{item.title}</span>
            ))}
          </div>
        </div>
        <div className="my-4">{children}</div>
      </div>
    </section>
  );
};

export default NotificationHeader;
