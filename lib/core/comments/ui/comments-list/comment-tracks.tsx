import {MdArrowRightAlt} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';

import type {TrackObject} from '../../types';

type CommentTracksProps = {
  data: TrackObject;
  variant?: 'default' | 'conversation';
};

export function CommentTracks({data, variant = 'default'}: CommentTracksProps) {
  const {title, tracks} = data;
  const isConversation = variant === 'conversation';
  return (
    <div className={cn('text-xs mb-1', !isConversation && 'px-4')}>
      {title && (
        <div className={cn('font-semibold mb-1', !isConversation && '-ml-9')}>
          {i18n.t(title)}
        </div>
      )}
      <ul className={cn('list-disc', isConversation && 'pl-5')}>
        {tracks?.map(({title, oldValue, value}, index) => {
          if (title === 'comment.note') return;
          return (
            <li key={index} className="mb-1">
              <div className="flex items-center">
                <span className="font-semibold flex-shrink-0">
                  {i18n.t(title)}:
                </span>
                <span className="flex items-center ml-2">
                  {oldValue ? (
                    <>
                      {i18n.t(oldValue)}
                      <MdArrowRightAlt className="mx-2" />
                      {i18n.t(value)}
                    </>
                  ) : (
                    ` ${i18n.t(value)}`
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
