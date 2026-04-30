import {MdDownload} from 'react-icons/md';
import {HiOutlineCheckCircle} from 'react-icons/hi';

import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import type {MarketplaceProductVersion} from '../../../types';

type VersionListProps = {
  versions: MarketplaceProductVersion[];
  productId: string;
  hasPurchased?: boolean;
};

export function VersionList({
  versions,
  productId,
  hasPurchased = false,
}: VersionListProps) {
  if (!versions.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {i18n.t('No versions available.')}
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y">
      {versions.map(v => (
        <div key={v.id} className="py-4 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-semibold">
                {v.version}
              </span>
              {v.isLatest && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                  <HiOutlineCheckCircle className="text-sm" />
                  {i18n.t('Latest')}
                </span>
              )}
              {v.releaseDate && (
                <span className="text-xs text-muted-foreground">
                  {new Date(v.releaseDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
            {v.releaseNotes && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                {v.releaseNotes}
              </p>
            )}
          </div>

          <div className="shrink-0">
            {hasPurchased ? (
              <a
                href={`./api/download/${productId}/${v.id}`}
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg',
                  'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
                )}>
                <MdDownload className="text-base" />
                {i18n.t('Download')}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-muted text-muted-foreground cursor-not-allowed">
                <MdDownload className="text-base" />
                {i18n.t('Purchase to download')}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
