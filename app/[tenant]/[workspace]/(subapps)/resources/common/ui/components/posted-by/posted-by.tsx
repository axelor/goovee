'use client';

import {i18n} from '@/lib/core/locale';
import {formatDate} from '@/lib/core/locale/formatters';

export function PostedBy({date, author}: any) {
  return (
    <p className="grow">
      {i18n.t('Posted on')} {formatDate(date)} {i18n.t('by')} {author}
    </p>
  );
}

export default PostedBy;
