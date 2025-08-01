import Image from 'next/image';
import Link from 'next/link';

import {cn} from '@/utils/css';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {InnerHTML} from '@/ui/components';

import {colors} from '../../../constants';
import type {Entry, ListEntry} from '../../../types';
import {Category} from '../pills';
import {Cloned} from '@/types/util';

export type CardProps = {
  item: ListEntry | Entry | Cloned<Entry> | Cloned<ListEntry>;
  url: string;
  small?: boolean;
  workspaceURI: string;
};

export function Card(props: CardProps) {
  const {item, url, small, workspaceURI} = props;

  return (
    <Link
      href={{pathname: url}}
      className="flex bg-card rounded-lg gap-1 justify-between hover:bg-slate-100 hover:shadow-md transition-all duration-300">
      <div className="p-3 space-y-2 grow">
        {!small && (
          <div className={cn('flex flex-wrap items-center gap-2 ')}>
            {item?.directoryEntryCategorySet?.map(item => (
              <Category
                name={item?.title}
                key={item.id}
                className={colors[item.color as keyof typeof colors] ?? ''}
              />
            ))}
          </div>
        )}
        <h4 className="font-semibold line-clamp-1">{item.title}</h4>
        <p className="text-success text-sm line-clamp-3">
          {item.address?.formattedFullName}
        </p>
        {!small && (
          <InnerHTML
            className="text-xs line-clamp-3"
            content={item.description}
          />
        )}
      </div>
      {!small && (
        <div className="rounded-r-lg w-[150px] shrink-0 relative">
          <Image
            fill
            sizes="150px"
            className="rounded-r-lg w-[150px] object-cover shrink-0"
            src={
              item.image?.id
                ? `${workspaceURI}/${SUBAPP_CODES.directory}/api/entry/${item.id}/image`
                : NO_IMAGE_URL
            }
            alt="image"
          />
        </div>
      )}
    </Link>
  );
}
