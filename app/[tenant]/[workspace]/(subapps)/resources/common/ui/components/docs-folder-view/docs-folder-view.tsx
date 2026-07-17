'use client';

import {useMemo, useState} from 'react';
import {Link} from '@/ui/components/link';
import {
  MdChevronRight,
  MdDownload,
  MdGridView,
  MdViewList,
} from 'react-icons/md';

import {cn} from '@/utils/css';
import {SUBAPP_CODES} from '@/constants';
import {formatDateTime} from '@/lib/core/locale/formatters';

import {DocFileIcon} from '../doc-file-icon';

export interface DocsFolderViewLabels {
  rootCrumb: string;
  documentsLabel: string;
  documentsLabelOne: string;
  updatedLabel: string;
  columnDocument: string;
  columnAuthor: string;
  columnDate: string;
  columnSize: string;
  newBadge: string;
  newCutoffMs: number;
  emptyTitle: string;
  emptySubtitle: string;
}

export function DocsFolderView({
  folder,
  files,
  workspaceURI,
  labels,
}: {
  folder: {
    id: string;
    fileName: string;
    description?: string | null;
    updatedOn?: string | Date | null;
    parent?: {id: string; fileName: string} | null;
  };
  files: any[];
  workspaceURI: string;
  labels: DocsFolderViewLabels;
}) {
  const [view, setView] = useState<'list' | 'grid'>('list');

  const docsRoot = `${workspaceURI}/${SUBAPP_CODES.resources}`;
  const folderHref = (id: string) =>
    `${workspaceURI}/${SUBAPP_CODES.resources}/folder/${id}`;
  const viewHref = (id: string) =>
    `${workspaceURI}/${SUBAPP_CODES.resources}/${id}`;

  const lastUpdated = useMemo(() => {
    let max = folder.updatedOn ? new Date(folder.updatedOn).getTime() : 0;
    for (const f of files) {
      const ts = f.metaFile?.updatedOn ?? f.createdOn;
      if (ts) {
        const t = new Date(ts).getTime();
        if (!Number.isNaN(t) && t > max) max = t;
      }
    }
    return max > 0 ? new Date(max) : null;
  }, [folder.updatedOn, files]);

  return (
    <div className="px-6 md:px-9 py-7 max-w-[1280px]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-500 mb-3 flex-wrap">
        <Link href={docsRoot} className="hover:text-ink-700 transition-colors">
          {labels.rootCrumb}
        </Link>
        {folder.parent && (
          <>
            <MdChevronRight className="text-ink-300 text-xs" />
            <Link
              href={folderHref(folder.parent.id)}
              className="hover:text-ink-700 transition-colors truncate max-w-[200px]">
              {folder.parent.fileName}
            </Link>
          </>
        )}
        <MdChevronRight className="text-ink-300 text-xs" />
        <span className="text-ink-900 font-semibold truncate">
          {folder.fileName}
        </span>
      </nav>

      {/* Header */}
      <header className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div className="min-w-0">
          <h1 className="m-0 text-[26px] font-extrabold text-ink-900 tracking-[-0.025em] leading-tight">
            {folder.fileName}
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {files.length}{' '}
            {files.length === 1
              ? labels.documentsLabelOne
              : labels.documentsLabel}
            {lastUpdated && (
              <>
                {' · '}
                {labels.updatedLabel}{' '}
                {formatDateTime(lastUpdated, {dateFormat: 'DD/MM/YYYY'})}
              </>
            )}
          </p>
        </div>

        {/* List / Grid toggle */}
        <div className="inline-flex p-1 rounded-lg bg-white border border-ink-150">
          {(['list', 'grid'] as const).map(v => {
            const Icon = v === 'list' ? MdViewList : MdGridView;
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-label={v === 'list' ? 'List view' : 'Grid view'}
                className={cn(
                  'w-8 h-[30px] rounded-md grid place-items-center transition-colors',
                  active
                    ? 'bg-royal text-white'
                    : 'bg-transparent text-ink-600 hover:bg-ink-25',
                )}>
                <Icon className="text-sm" />
              </button>
            );
          })}
        </div>
      </header>

      {files.length === 0 ? (
        <div className="bg-white border border-ink-100 rounded-2xl px-6 py-14 text-center shadow-xs">
          <p className="text-[15px] font-semibold text-ink-700">
            {labels.emptyTitle}
          </p>
          <p className="mt-1 text-[13px] text-ink-500">
            {labels.emptySubtitle}
          </p>
        </div>
      ) : view === 'list' ? (
        <FileTable files={files} labels={labels} viewHref={viewHref} />
      ) : (
        <FileGrid files={files} labels={labels} viewHref={viewHref} />
      )}
    </div>
  );
}

function isNew(file: any, newCutoffMs: number): boolean {
  const ts = file.createdOn ? new Date(file.createdOn).getTime() : NaN;
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < newCutoffMs;
}

function FileTable({
  files,
  labels,
  viewHref,
}: {
  files: any[];
  labels: DocsFolderViewLabels;
  viewHref: (id: string) => string;
}) {
  return (
    <div className="bg-white border border-ink-100 rounded-2xl shadow-xs overflow-hidden">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr className="bg-ink-25">
            <th className="text-left px-[18px] py-3 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-ink-500 border-b border-ink-100 whitespace-nowrap">
              {labels.columnDocument}
            </th>
            <th className="text-left px-[18px] py-3 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-ink-500 border-b border-ink-100 whitespace-nowrap">
              {labels.columnAuthor}
            </th>
            <th className="text-right px-[18px] py-3 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-ink-500 border-b border-ink-100 whitespace-nowrap">
              {labels.columnDate}
            </th>
            <th className="text-right px-[18px] py-3 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-ink-500 border-b border-ink-100 whitespace-nowrap">
              {labels.columnSize}
            </th>
            <th className="w-[1px] border-b border-ink-100" />
          </tr>
        </thead>
        <tbody>
          {files.map((file, i) => {
            const fresh = isNew(file, labels.newCutoffMs);
            const dateValue = file.metaFile?.updatedOn ?? file.createdOn;
            const sizeValue = file.metaFile?.sizeText ?? '—';
            const author =
              file.createdBy?.fullName ?? file.createdBy?.name ?? '—';
            return (
              <tr
                key={file.id}
                className={cn(
                  'group transition-colors hover:bg-ink-25',
                  i !== files.length - 1 && 'border-b border-ink-100',
                )}>
                <td className="px-[18px] py-3">
                  <Link
                    href={viewHref(file.id)}
                    className="flex items-center gap-3 min-w-0">
                    <DocFileIcon
                      fileType={file.metaFile?.fileType}
                      fileName={file.fileName}
                      size={32}
                    />
                    <span className="font-semibold text-ink-900 truncate">
                      {file.fileName}
                    </span>
                    {fresh && (
                      <span className="inline-flex items-center px-1.5 py-px rounded bg-mint-50 text-mint-700 text-[9.5px] font-extrabold uppercase tracking-[0.06em] shrink-0">
                        {labels.newBadge}
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-[18px] py-3 text-ink-700">{author}</td>
                <td className="px-[18px] py-3 text-right text-ink-500 tabular-nums whitespace-nowrap">
                  {dateValue
                    ? formatDateTime(dateValue, {dateFormat: 'DD/MM/YYYY'})
                    : '—'}
                </td>
                <td className="px-[18px] py-3 text-right text-ink-700 font-semibold tabular-nums whitespace-nowrap">
                  {sizeValue}
                </td>
                <td className="px-[18px] py-3 text-right">
                  <Link
                    href={viewHref(file.id)}
                    aria-label="Download"
                    onClick={e => e.stopPropagation()}
                    className="inline-grid place-items-center w-[30px] h-[30px] rounded-md bg-royal-pale text-royal hover:bg-royal-border transition-colors">
                    <MdDownload className="text-sm" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FileGrid({
  files,
  labels,
  viewHref,
}: {
  files: any[];
  labels: DocsFolderViewLabels;
  viewHref: (id: string) => string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map(file => {
        const fresh = isNew(file, labels.newCutoffMs);
        const dateValue = file.metaFile?.updatedOn ?? file.createdOn;
        const author = file.createdBy?.fullName ?? file.createdBy?.name ?? '—';
        return (
          <Link
            key={file.id}
            href={viewHref(file.id)}
            className={cn(
              'group bg-white border border-ink-100 rounded-xl p-4',
              'flex flex-col gap-3 transition-all duration-150',
              'hover:-translate-y-0.5 hover:shadow-soft-md',
            )}>
            <div className="flex items-start gap-2.5">
              <DocFileIcon
                fileType={file.metaFile?.fileType}
                fileName={file.fileName}
                size={50}
                rounded="lg"
              />
              {fresh && (
                <span className="ml-auto inline-flex items-center px-1.5 py-px rounded bg-mint-50 text-mint-700 text-[9.5px] font-extrabold uppercase tracking-[0.06em]">
                  {labels.newBadge}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-bold text-ink-900 leading-snug line-clamp-2">
                {file.fileName}
              </div>
              <div className="mt-1 text-[11.5px] text-ink-500 tabular-nums truncate">
                {author} · {file.metaFile?.sizeText ?? '—'}
                {dateValue && (
                  <>
                    {' · '}
                    {formatDateTime(dateValue, {dateFormat: 'DD/MM/YYYY'})}
                  </>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
