'use client';

import {MdOutlineCalendarMonth} from 'react-icons/md';
import {useEffect, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {Card} from '@/ui/components';
import {i18n} from '@/locale';
import {formatDateTime} from '@/locale/formatters';

// ---- LOCAL IMPORTS ---- //
import {EventDateCardProps} from '@/subapps/events/common/ui/components';

export const EventDateCard = ({
  startDate,
  endDate,
  eventAllDay = false,
}: EventDateCardProps) => {
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');

  useEffect(() => {
    if (startDate) {
      const startDateTime = formatDateTime(startDate, {
        dateFormat: 'LL -',
        timeFormat: 'HH:mm',
      });
      setStartDateTime(startDateTime);
    }

    if (endDate && !eventAllDay) {
      const endDateTime = formatDateTime(endDate!, {
        dateFormat: 'LL -',
        timeFormat: 'HH:mm',
      });
      setEndDateTime(endDateTime);
    }
  }, [startDate, endDate, eventAllDay]);

  return (
    <Card className="border-none shadow-none">
      <div className="flex items-center gap-x-2">
        <MdOutlineCalendarMonth className="w-6 h-6 text-success" />
        <div className="flex">
          <p className=" flex text-base gap-2 flex-row flex-wrap">
            <span className="font-semibold">{startDateTime}</span>
            {eventAllDay || !endDateTime ? ' ' : <span>{i18n.t('to')}</span>}
            <span className="font-semibold">{endDateTime}</span>
          </p>
        </div>
      </div>
    </Card>
  );
};
