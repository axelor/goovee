import {Link} from '@/ui/components/link';
import {MdArrowForward, MdStar} from 'react-icons/md';

import {SUBAPP_CODES} from '@/constants';
import {formatDateTime} from '@/lib/core/locale/formatters';
import {cn} from '@/utils/css';

import {FolderLogoIcon} from '../folder-logo-icon';
import type {PinnedFolder} from '@/subapps/resources/common/types';

export interface DocsHomeViewLabels {
  pinnedTitle: string;
  pinnedSubtitle: string;
  pinnedEmptyTitle: string;
  pinnedEmptySubtitle: string;
  documentsLabel: string;
  documentsLabelOne: string;
  updatedLabel: string;
}

export function DocsHomeView({
  pinnedFolders,
  workspaceURI,
  labels,
}: {
  pinnedFolders: PinnedFolder[];
  workspaceURI: string;
  labels: DocsHomeViewLabels;
}) {
  return (
    <div className="px-6 md:px-9 py-8 max-w-[1280px] mx-auto">
      {/* Pinned folders */}
      <section className="mb-9">
        <header className="flex items-center gap-2 mb-4">
          <span className="inline-grid place-items-center w-7 h-7 rounded-lg bg-palette-orange-light text-palette-orange-dark">
            <MdStar className="text-base" />
          </span>
          <h2 className="m-0 text-lg font-bold text-ink-900 tracking-[-0.015em]">
            {labels.pinnedTitle}
          </h2>
          {pinnedFolders.length > 0 && (
            <span className="text-xs font-semibold text-ink-500 tabular-nums">
              · {pinnedFolders.length}
            </span>
          )}
        </header>

        {pinnedFolders.length === 0 ? (
          <div className="bg-white border border-ink-100 rounded-2xl px-6 py-10 text-center">
            <p className="text-[15px] font-semibold text-ink-700">
              {labels.pinnedEmptyTitle}
            </p>
            <p className="mt-1 text-[13px] text-ink-500">
              {labels.pinnedEmptySubtitle}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pinnedFolders.map(folder => (
              <PinnedFolderCard
                key={folder.id}
                folder={folder}
                workspaceURI={workspaceURI}
                labels={labels}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PinnedFolderCard({
  folder,
  workspaceURI,
  labels,
}: {
  folder: PinnedFolder;
  workspaceURI: string;
  labels: DocsHomeViewLabels;
}) {
  const parentName = folder.parent?.fileName;
  const itemCount: number = folder.itemCount ?? 0;
  const updatedOn = folder.updatedOn;

  return (
    <Link
      href={`${workspaceURI}/${SUBAPP_CODES.resources}/folder/${folder.id}`}
      className={cn(
        'group bg-white border border-ink-100 rounded-2xl p-5 shadow-xs',
        'flex flex-col gap-3.5 transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-soft-md',
      )}>
      <div className="flex items-start gap-3">
        <FolderLogoIcon
          logoSelect={folder.logoSelect}
          colorSelect={folder.colorSelect}
          size={44}
        />
        <div className="flex-1 min-w-0">
          {parentName && (
            <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-ink-500 mb-1 truncate">
              {parentName}
            </div>
          )}
          <h3 className="m-0 text-base font-bold text-ink-900 tracking-[-0.01em] line-clamp-2 leading-snug">
            {folder.fileName}
          </h3>
        </div>
        <MdArrowForward className="text-ink-300 text-sm shrink-0 group-hover:text-royal transition-colors mt-1" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-ink-100 text-[12px] text-ink-500">
        <span className="tabular-nums">
          {itemCount}{' '}
          {itemCount === 1 ? labels.documentsLabelOne : labels.documentsLabel}
        </span>
        {updatedOn && (
          <span>
            {labels.updatedLabel}{' '}
            {formatDateTime(updatedOn, {dateFormat: 'MMM D'})}
          </span>
        )}
      </div>
    </Link>
  );
}
