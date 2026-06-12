'use client';

import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {Badge, Button} from '@/ui/components';
import {RichTextViewer} from '@/ui/components/rich-text-editor/rich-text-viewer';
import {cn} from '@/utils/css';
import {ChevronDown, Download} from 'lucide-react';
import {useState} from 'react';
import type {ListProductVersion} from '../../../../orm';
import {formatVersionNumber} from '../../../../utils/version-number';
import {TooltipDate} from '../../shared/tooltip-date/tooltip-date';

interface VersionCardProps {
  version: Cloned<ListProductVersion>;
  isLatest: boolean;
  preview: boolean;
  canDownload: boolean;
  downloadHref: string;
}

export function VersionCard({
  version,
  isLatest,
  preview,
  canDownload,
  downloadHref,
}: VersionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center p-4 sm:p-5">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-foreground">
              v{formatVersionNumber(version)}
            </h3>
            {isLatest && <Badge variant="success">{i18n.t('Latest')}</Badge>}

            {version.publishDateTime && (
              <TooltipDate
                date={version.publishDateTime}
                prefix={i18n.t('Released')}
                lowercase
                className="text-xs text-muted-foreground"
              />
            )}
          </div>
          {version.compatibilitySet && version.compatibilitySet.length > 0 ? (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {i18n.t('Compatible:')}
              </span>
              {version.compatibilitySet.map(axelorVersion => (
                <Badge
                  key={axelorVersion.id}
                  variant="outline"
                  className="text-xs">
                  {axelorVersion.title}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              {i18n.t('No compatible versions specified')}
            </p>
          )}
        </div>
        {preview ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0 rounded-full"
            disabled
            title={i18n.t('Inactive in preview')}>
            <Download size={16} />
            {i18n.t('Download')}
          </Button>
        ) : canDownload ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0 rounded-full"
            asChild>
            <a href={downloadHref} download>
              <Download size={16} />
              {i18n.t('Download')}
            </a>
          </Button>
        ) : null}
      </div>

      {version.changelog && (
        <>
          {expanded && (
            <div className="border-t border-border bg-muted/30 px-4 sm:px-5 py-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {i18n.t('Changelog')}
              </h4>
              <RichTextViewer content={version.changelog} className="text-sm" />
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded(prev => !prev)}
            aria-expanded={expanded}
            className="group flex items-center justify-center gap-1.5 w-full border-t border-border py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            {expanded ? i18n.t('Hide changelog') : i18n.t('View changelog')}
            <ChevronDown
              size={14}
              className={cn('transition-transform', {'rotate-180': expanded})}
            />
          </button>
        </>
      )}
    </div>
  );
}
