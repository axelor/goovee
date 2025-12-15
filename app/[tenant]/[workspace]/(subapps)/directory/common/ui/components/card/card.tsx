import Image from 'next/image';
import Link from 'next/link';

import {NO_IMAGE_URL} from '@/constants';
import {InnerHTML} from '@/ui/components';

import {Cloned, Maybe} from '@/types/util';
import type {Entry, ListEntry} from '../../../types';

import {getPartnerImageURL} from '@/utils/files';
import {Tenant} from '@/lib/core/tenant';
import {cn} from '@/utils/css';

export type CardProps = {
  item: ListEntry | Entry | Cloned<Entry> | Cloned<ListEntry>;
  url?: string;
  compact?: boolean;
  tenant: Tenant['id'];
  className?: string;
};

const stripImages = (htmlContent: Maybe<string>) =>
  htmlContent?.replace(/<img\b[^>]*>/gi, '');

export function Card(props: CardProps) {
  const {item, url, compact, tenant, className} = props;

  const Wrapper = url ? Link : 'div';

  if (compact) {
    const addressText = item.mainAddress?.formattedFullName;
    return (
      <Wrapper
        href={{pathname: url}}
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg w-full',
          className,
        )}>
        <div className="w-10 h-10 flex-shrink-0 relative rounded-md overflow-hidden">
          <Image
            fill
            sizes="40px"
            className="object-cover"
            src={getPartnerImageURL(item.picture?.id, tenant, {
              noimage: true,
              noimageSrc: NO_IMAGE_URL,
            })}
            alt={item.portalCompanyName ?? 'Company image'}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className="font-semibold text-sm truncate">
            {item.portalCompanyName}
          </h4>
          {addressText && (
            <p className="text-xs text-muted-foreground truncate !m-0">
              {addressText}
            </p>
          )}
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      href={{pathname: url}}
      className={cn(
        'flex bg-card rounded-lg overflow-hidden shadow-md border border-border/20 transition-all duration-300 hover:shadow-xl hover:border-primary/10',
        className,
      )}>
      <div className="p-4 sm:p-5 flex-1">
        <h3 className="font-bold text-lg md:text-xl text-foreground line-clamp-2">
          {item.portalCompanyName}
        </h3>
        {item.mainAddress?.formattedFullName && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
            {item.mainAddress.formattedFullName}
          </p>
        )}
        <div className="mt-3 text-sm text-muted-foreground">
          <InnerHTML
            content={stripImages(item.directoryCompanyDescription)}
            className="line-clamp-3"
          />
        </div>
      </div>
      <div className="w-1/4 max-w-[150px] flex-shrink-0 relative">
        <Image
          fill
          sizes="150px"
          className="object-cover"
          src={getPartnerImageURL(item.picture?.id, tenant, {
            noimage: true,
            noimageSrc: NO_IMAGE_URL,
          })}
          alt={item.portalCompanyName ?? 'Company image'}
        />
      </div>
    </Wrapper>
  );
}
