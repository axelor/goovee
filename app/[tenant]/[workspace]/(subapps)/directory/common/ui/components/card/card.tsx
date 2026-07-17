import Image from 'next/image';

import {NO_IMAGE_URL} from '@/constants';
import {InnerHTML} from '@/ui/components';
import {Link} from '@/ui/components/link';
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
            className="object-contain"
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
        'flex bg-white rounded-xl overflow-hidden shadow-xs border border-ink-100 transition-all duration-200 hover:shadow-soft-md hover:border-ink-200',
        className,
      )}>
      <div className="p-5 sm:p-6 flex-1 min-w-0">
        <h3 className="font-bold text-lg md:text-xl text-ink-900 leading-tight line-clamp-2">
          {item.portalCompanyName}
        </h3>
        {item.mainAddress?.formattedFullName && (
          <p className="mt-1.5 text-xs uppercase tracking-[0.06em] font-semibold text-ink-400 line-clamp-1">
            {item.mainAddress.formattedFullName}
          </p>
        )}
        <div className="mt-3 text-sm text-ink-500 leading-relaxed">
          <InnerHTML
            content={stripImages(item.directoryCompanyDescription)}
            className="line-clamp-3"
          />
        </div>
      </div>
      <div className="w-1/4 max-w-[160px] flex-shrink-0 relative bg-ink-50">
        <Image
          fill
          sizes="160px"
          className="object-contain p-3"
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
