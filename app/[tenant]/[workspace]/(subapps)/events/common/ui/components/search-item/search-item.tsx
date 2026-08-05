'use client';

// ---- CORE IMPORTS ---- //
import {InnerHTML} from '@/ui/components/inner-html';
import {DATE_FORMATS} from '@/constants';
import {formatDate} from '@/locale/formatters';
import type {Cloned} from '@/types/util';

// ---- LOCAL IMPORTS ---- //
import type {ListEvent} from '@/subapps/events/common/types';

export const SearchItem = ({
  result,
  onClick,
}: {
  result: Cloned<ListEvent>;
  onClick: (slug: string | null) => void;
}) => {
  const {eventTitle, eventStartDateTime, eventDescription, slug} = result;
  const stripImages = (htmlContent: string = '') =>
    htmlContent?.replace(/<img[^>]*>/g, '');
  return (
    <>
      <div onClick={() => onClick(slug)} className="space-y-2 cursor-pointer">
        <div className="flex items-start justify-between">
          <p className="text-sm font-semibold text-main-black pr-2">
            {eventTitle}
          </p>
          <p className="text-sm font-normal text-main-black min-w-fit">
            {formatDate(eventStartDateTime ?? '', {
              dateFormat: DATE_FORMATS.full_month_day_year_12_hour,
            })}
          </p>
        </div>
        <InnerHTML
          className="overflow-hidden text-xs font-normal text-main-black line-clamp-1"
          content={eventDescription ? stripImages(eventDescription) : ''}
        />
      </div>
    </>
  );
};

export default SearchItem;
