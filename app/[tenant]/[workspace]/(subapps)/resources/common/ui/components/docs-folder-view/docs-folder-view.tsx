'use client';

import {useMemo, useState} from 'react';
import {Link} from '@/ui/components/link';
import {
  MdAdd,
  MdChevronRight,
  MdClose,
  MdCloudUpload,
  MdCreateNewFolder,
  MdDownload,
  MdGridView,
  MdViewList,
} from 'react-icons/md';

import {cn} from '@/utils/css';
import {SUBAPP_CODES} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';
import {formatDateTime} from '@/lib/core/locale/formatters';
import {i18n} from '@/locale';
import {Dialog, DialogContent, DialogTitle} from '@/ui/components';

import {DocFileIcon} from '../doc-file-icon';
import ResourceForm from '@/subapps/resources/create/form';
import CreateFolderForm from '@/subapps/resources/categories/create/form';
import {COLORS, ICONS} from '@/subapps/resources/common/constants';
import type {DmsFile, FolderWithParent} from '@/subapps/resources/common/types';

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
  addLabel: string;
  newFolderLabel: string;
}

export function DocsFolderView({
  folder,
  files,
  workspaceURI,
  labels,
  uploadParent,
  folderParent,
}: {
  folder: FolderWithParent;
  files: DmsFile[];
  workspaceURI: string;
  labels: DocsFolderViewLabels;
  // Each present only when the user may perform that action into this folder;
  // opens a modal instead of navigating to a separate create page.
  uploadParent?: {id: string; fileName?: string | null} | null;
  folderParent?: {id: string; fileName?: string | null} | null;
}) {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);

  const docsRoot = `${workspaceURI}/${SUBAPP_CODES.resources}`;
  const folderHref = (id: string) =>
    `${workspaceURI}/${SUBAPP_CODES.resources}/folder/${id}`;
  const viewHref = (id: string) =>
    `${workspaceURI}/${SUBAPP_CODES.resources}/${id}`;
  // Real download endpoint (streams the file), gated on the DMS file actually
  // having a metaFile — the row action used to just re-open the viewer.
  const downloadHref = (file: DmsFile) =>
    file.metaFile?.id
      ? withBasePath(
          `${workspaceURI}/${SUBAPP_CODES.resources}/api/file/${file.id}`,
        )
      : null;

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

        <div className="flex items-center gap-2.5">
          {folderParent && (
            <button
              type="button"
              onClick={() => setFolderOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] bg-white text-ink-700 border border-ink-150 text-[13.5px] font-bold hover:bg-ink-25 transition-colors">
              <MdCreateNewFolder className="size-4" />
              {labels.newFolderLabel}
            </button>
          )}
          {uploadParent && (
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] bg-royal text-white text-[13.5px] font-bold shadow-[0_1px_2px_rgba(13,30,75,0.15),0_4px_12px_rgba(13,30,75,0.12)] hover:bg-royal-dark transition-colors">
              <MdAdd className="size-4" />
              {labels.addLabel}
            </button>
          )}

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
        <FileTable
          files={files}
          labels={labels}
          viewHref={viewHref}
          downloadHref={downloadHref}
        />
      ) : (
        <FileGrid files={files} labels={labels} viewHref={viewHref} />
      )}

      {uploadParent && (
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogContent
            className="max-w-[560px] p-0 gap-0 overflow-hidden"
            hideClose>
            {/* Royal gradient header — matches the account/forum modals. */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-royal-dark to-royal px-6 py-[22px] text-white">
              <div
                className="pointer-events-none absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              />
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                aria-label={i18n.t('Close')}
                className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25">
                <MdClose className="size-4" />
              </button>
              <div className="relative flex items-center gap-3.5">
                <div className="grid size-11 shrink-0 place-items-center rounded-[11px] bg-white/[0.18]">
                  <MdCloudUpload className="size-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-[19px] font-extrabold tracking-[-0.015em] text-white">
                    {labels.addLabel}
                  </DialogTitle>
                  <p className="mt-0.5 truncate text-[13px] text-white/85">
                    {folder.fileName}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              <ResourceForm
                parent={uploadParent}
                onSuccess={() => setUploadOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {folderParent && (
        <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
          <DialogContent
            className="max-w-[560px] p-0 gap-0 overflow-hidden"
            hideClose>
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-royal-dark to-royal px-6 py-[22px] text-white">
              <div
                className="pointer-events-none absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              />
              <button
                type="button"
                onClick={() => setFolderOpen(false)}
                aria-label={i18n.t('Close')}
                className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25">
                <MdClose className="size-4" />
              </button>
              <div className="relative flex items-center gap-3.5">
                <div className="grid size-11 shrink-0 place-items-center rounded-[11px] bg-white/[0.18]">
                  <MdCreateNewFolder className="size-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-[19px] font-extrabold tracking-[-0.015em] text-white">
                    {labels.newFolderLabel}
                  </DialogTitle>
                  <p className="mt-0.5 truncate text-[13px] text-white/85">
                    {folder.fileName}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              <CreateFolderForm
                parent={folderParent}
                colors={COLORS}
                icons={ICONS}
                onSuccess={() => setFolderOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function isNew(file: DmsFile, newCutoffMs: number): boolean {
  const ts = file.createdOn ? new Date(file.createdOn).getTime() : NaN;
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < newCutoffMs;
}

function FileTable({
  files,
  labels,
  viewHref,
  downloadHref,
}: {
  files: DmsFile[];
  labels: DocsFolderViewLabels;
  viewHref: (id: string) => string;
  downloadHref: (file: DmsFile) => string | null;
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
                  {downloadHref(file) && (
                    <a
                      href={downloadHref(file)!}
                      download
                      aria-label="Download"
                      onClick={e => e.stopPropagation()}
                      className="inline-grid place-items-center w-[30px] h-[30px] rounded-md bg-royal-pale text-royal hover:bg-royal-border transition-colors">
                      <MdDownload className="text-sm" />
                    </a>
                  )}
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
  files: DmsFile[];
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
