import Image from 'next/image';
import Link from 'next/link';

import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {InnerHTML} from '@/ui/components';

import {Cloned, Maybe} from '@/types/util';
import type {Entry, ListEntry} from '../../../types';

import '@/ui/components/rich-text-editor/rich-text-editor.css';
import {getPartnerImageURL} from '@/utils/files';
import {Tenant} from '@/lib/core/tenant';

export type CardProps = {
  item: ListEntry | Entry | Cloned<Entry> | Cloned<ListEntry>;
  url?: string;
  small?: boolean;
  tenant: Tenant['id'];
};

const stripImages = (htmlContent: Maybe<string>) =>
  htmlContent?.replace(/<img\b[^>]*>/gi, '');

export function Card(props: CardProps) {
  const {item, url, small, tenant} = props;

  const Wrapper = url ? Link : 'div';
  return (
    <Wrapper
      href={{pathname: url}}
      className="flex bg-card rounded-lg gap-1 justify-between hover:bg-slate-100 hover:shadow-md transition-all duration-300">
      <div className="p-3 space-y-2 grow">
        <h4 className="font-semibold line-clamp-1">{item.portalCompanyName}</h4>
        <p className="text-success text-sm line-clamp-3">
          {item.mainAddress?.formattedFullName}
        </p>
        {!small && (
          <div className="DraftEditor-editorContainer">
            <InnerHTML
              content={stripImages(item.directoryCompanyDescription)}
              className="public-DraftEditor-content text-xs line-clamp-3"
            />
          </div>
        )}
      </div>
      {!small && (
        <div className="rounded-r-lg w-[150px] shrink-0 relative">
          <Image
            fill
            sizes="150px"
            className="rounded-r-lg w-[150px] object-cover shrink-0"
            src={getPartnerImageURL(item.picture?.id, tenant, {
              noimage: true,
              noimageSrc: NO_IMAGE_URL,
            })}
            alt="image"
          />
        </div>
      )}
    </Wrapper>
  );
}
