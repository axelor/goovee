'use client';

import {Link} from '@/ui/components/link';
import {MdArrowBack, MdChevronRight, MdDownload} from 'react-icons/md';

import {SUBAPP_CODES} from '@/constants';
import {formatDateTime} from '@/lib/core/locale/formatters';
import {cn} from '@/utils/css';

import {DocFileIcon} from '../doc-file-icon';
import type {DmsFile} from '@/subapps/resources/common/types';

export interface DocsViewerShellLabels {
  backLabel: string;
  newBadge: string;
  downloadLabel: string;
  detailsTitle: string;
  authorLabel: string;
  categoryLabel: string;
  folderLabel: string;
  formatLabel: string;
  sizeLabel: string;
  publishedLabel: string;
  sameFolderTitle: string;
  sameFolderEmpty: string;
}

export function DocsViewerShell({
  file,
  workspaceURI,
  backHref,
  downloadHref,
  siblings,
  isNew,
  labels,
  children,
}: {
  file: DmsFile;
  workspaceURI: string;
  backHref: string;
  downloadHref: string | null;
  siblings: DmsFile[];
  isNew: boolean;
  labels: DocsViewerShellLabels;
  children: React.ReactNode;
}) {
  const author = file.createdBy?.fullName ?? file.createdBy?.name ?? '—';
  const folder = file.parent;
  const category = folder?.parent;
  const fileType = file.metaFile?.fileType ?? file.contentType ?? '';
  const fileSize = file.metaFile?.sizeText ?? '—';
  const publishedOn = file.metaFile?.createdOn ?? file.createdOn;

  const formatLabel = (fileType.split('/').pop() ?? '—').toUpperCase();

  return (
    <div className="bg-ink-25 min-h-full flex flex-col">
      <TopBar
        file={file}
        backHref={backHref}
        downloadHref={downloadHref}
        labels={labels}
        fresh={isNew}
      />

      <div className="flex-1 min-h-0 px-6 md:px-7 py-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
          {/* Viewer dark frame */}
          <section
            className="rounded-[14px] overflow-hidden border border-ink-200 shadow-soft-md min-w-0"
            style={{background: '#3a4a63'}}>
            <ViewerToolbar fileName={file.fileName ?? ''} />
            <div className="bg-white">{children}</div>
          </section>

          {/* Sticky sidebar */}
          <aside className="lg:sticky lg:top-5 flex flex-col gap-3.5">
            <DetailsCard
              author={author}
              category={category?.fileName}
              folder={folder?.fileName}
              format={formatLabel}
              size={fileSize}
              publishedOn={publishedOn}
              labels={labels}
            />
            <SameFolderCard
              siblings={siblings}
              currentId={file.id}
              workspaceURI={workspaceURI}
              labels={labels}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

function TopBar({
  file,
  backHref,
  downloadHref,
  labels,
  fresh,
}: {
  file: DmsFile;
  backHref: string;
  downloadHref: string | null;
  labels: DocsViewerShellLabels;
  fresh: boolean;
}) {
  const folder = file.parent;
  const category = folder?.parent;
  return (
    <header className="bg-white border-b border-ink-100 px-5 md:px-7 py-3.5">
      <div className="max-w-[1400px] mx-auto flex items-center gap-4">
        <Link
          href={backHref}
          aria-label={labels.backLabel}
          className="w-9 h-9 rounded-full bg-ink-50 grid place-items-center text-ink-700 hover:bg-ink-100 transition-colors shrink-0">
          <MdArrowBack className="text-base" />
        </Link>

        <DocFileIcon
          fileType={file.metaFile?.fileType ?? file.contentType}
          fileName={file.fileName}
          size={44}
          rounded="lg"
        />

        <div className="flex-1 min-w-0">
          {(category?.fileName || folder?.fileName) && (
            <nav className="flex items-center gap-1 text-[12px] text-ink-500 truncate">
              {category?.fileName && (
                <span className="truncate">{category.fileName}</span>
              )}
              {category?.fileName && folder?.fileName && (
                <MdChevronRight className="text-ink-300 text-xs shrink-0" />
              )}
              {folder?.fileName && (
                <span className="truncate">{folder.fileName}</span>
              )}
            </nav>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="m-0 text-[17px] font-bold text-ink-900 tracking-[-0.01em] truncate">
              {file.fileName}
            </h1>
            {fresh && (
              <span className="inline-flex items-center px-1.5 py-px rounded bg-mint-50 text-mint-700 text-[10px] font-extrabold uppercase tracking-[0.06em] shrink-0">
                {labels.newBadge}
              </span>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          {downloadHref && (
            <a
              href={downloadHref}
              download
              className={cn(
                'inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-royal text-white text-sm font-bold',
                'hover:bg-royal-dark transition-colors',
              )}
              style={{
                boxShadow:
                  '0 1px 2px rgba(21,84,181,0.3), 0 4px 10px rgba(21,84,181,0.18)',
              }}>
              <MdDownload className="text-base" />
              {labels.downloadLabel}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

function ViewerToolbar({fileName}: {fileName: string}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-white text-[12px]"
      style={{background: '#2d343f'}}>
      <span className="font-mono truncate">{fileName}</span>
    </div>
  );
}

function DetailsCard({
  author,
  category,
  folder,
  format,
  size,
  publishedOn,
  labels,
}: {
  author: string;
  category?: string | null;
  folder?: string | null;
  format: string;
  size: string;
  publishedOn?: string | Date | null;
  labels: DocsViewerShellLabels;
}) {
  return (
    <section className="bg-white rounded-2xl border border-ink-100 shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-ink-100 text-[11px] font-extrabold uppercase tracking-[0.06em] text-ink-500">
        {labels.detailsTitle}
      </div>
      <dl className="divide-y divide-ink-100 text-[12.5px]">
        <Row label={labels.authorLabel} value={author} />
        {category && <Row label={labels.categoryLabel} value={category} />}
        {folder && <Row label={labels.folderLabel} value={folder} />}
        <Row label={labels.formatLabel} value={format} mono />
        <Row label={labels.sizeLabel} value={size} mono />
        {publishedOn && (
          <Row
            label={labels.publishedLabel}
            value={formatDateTime(publishedOn, {dateFormat: 'DD/MM/YYYY'})}
            mono
          />
        )}
      </dl>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <dt className="text-ink-500 font-medium shrink-0 pr-3">{label}</dt>
      <dd
        className={cn(
          'text-ink-800 font-semibold text-right truncate',
          mono && 'tabular-nums',
        )}>
        {value}
      </dd>
    </div>
  );
}

function SameFolderCard({
  siblings,
  currentId,
  workspaceURI,
  labels,
}: {
  siblings: DmsFile[];
  currentId: string;
  workspaceURI: string;
  labels: DocsViewerShellLabels;
}) {
  const others = siblings.filter(s => s.id !== currentId);
  return (
    <section className="bg-white rounded-2xl border border-ink-100 shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-ink-100 text-[11px] font-extrabold uppercase tracking-[0.06em] text-ink-500">
        {labels.sameFolderTitle}
      </div>
      {others.length === 0 ? (
        <div className="px-4 py-6 text-center text-[12.5px] text-ink-500">
          {labels.sameFolderEmpty}
        </div>
      ) : (
        <ul className="divide-y divide-ink-100 max-h-[280px] overflow-y-auto">
          {others.slice(0, 8).map(sibling => (
            <li key={sibling.id}>
              <Link
                href={`${workspaceURI}/${SUBAPP_CODES.resources}/${sibling.id}`}
                className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-ink-25 transition-colors">
                <DocFileIcon
                  fileType={sibling.metaFile?.fileType}
                  fileName={sibling.fileName}
                  size={26}
                  rounded="sm"
                />
                <span className="text-[12.5px] font-semibold text-ink-800 truncate flex-1">
                  {sibling.fileName}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
