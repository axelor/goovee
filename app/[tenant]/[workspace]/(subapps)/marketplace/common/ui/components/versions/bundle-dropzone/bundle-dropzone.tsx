import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {ProgressFill} from '@/ui/components';
import {cn} from '@/utils/css';
import {getFileSizeText} from '@/utils/files';
import {
  CheckCircle2,
  FileArchive,
  Pause,
  Play,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import {useRef, useState} from 'react';

/** A bundle being staged this session — progress while transferring, then the
 *  state it stopped in. Drives the dropzone's current-file display. */
export type StagedBundle = {
  fileName: string;
  /** 0–100, and where the fill stops once it is paused or has failed. */
  progress: number;
  status: 'queued' | 'uploading' | 'success' | 'error' | 'paused';
  /** Why it failed, already translated. Always set when status is `error` —
   *  the failure row renders it unguarded. */
  error?: string;
};

type BundleDropzoneProps = {
  /** The bundle staged this session — queued, uploading, paused, failed or
   *  done. Takes precedence over the existing-bundle display. */
  staged?: StagedBundle | null;
  /** Details of the already-uploaded bundle (when editing an existing version). */
  existingFileName?: string | null;
  existingFileSizeText?: string | null;
  downloadHref?: string;
  /** Max accepted size in bytes. */
  maxSize: number;
  onFile: (file: File) => void;
  /** Called with a ready-to-display message when a drop/pick is rejected. */
  onError: (message: string) => void;
  /** Drop the staged bundle (giving up what the server holds) and revert to the
   *  existing / empty state. */
  onClear?: () => void;
  /** Stop the transfer, keeping what the server already holds so it can carry
   *  on from there. Omit to leave the control out. */
  onPause?: () => void;
  /** Carry on a paused or failed transfer, sending only what is missing. */
  onResume?: () => void;
};

/**
 * Click-or-drag zone for a single .zip bundle. Owns its drag state and runs
 * .zip/size validation, emitting the accepted file via `onFile` or a localized
 * reason via `onError`. The caller stages the file and feeds back live progress
 * via `staged`; the zone renders the upload progress / ready / error state.
 */
export function BundleDropzone({
  staged,
  existingFileName,
  existingFileSizeText,
  downloadHref,
  maxSize,
  onFile,
  onError,
  onClear,
  onPause,
  onResume,
}: BundleDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  /* Depth counter: dragenter/dragleave also fire when crossing child element
   * boundaries, so a boolean alone flickers. We only un-highlight at depth 0. */
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const accept = (candidate: File | undefined | null) => {
    if (!candidate) return;
    const isZip =
      candidate.type === 'application/zip' ||
      candidate.type === 'application/x-zip-compressed' ||
      candidate.name.toLowerCase().endsWith('.zip');
    if (!isZip) {
      onError(i18n.t('Only .zip bundles are accepted'));
      return;
    }
    if (candidate.size > maxSize) {
      onError(i18n.t('Bundle must be {0} or less', getFileSizeText(maxSize)));
      return;
    }
    onFile(candidate);
  };

  const handlePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    accept(event.target.files?.[0]);
    // Allow re-picking the same file (change won't fire otherwise).
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    const {files} = event.dataTransfer;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      onError(i18n.t('Please drop a single .zip bundle'));
      return;
    }
    accept(files[0]);
  };

  const browse = () => fileInputRef.current?.click();

  const isUploading =
    staged?.status === 'queued' || staged?.status === 'uploading';
  const isPaused = staged?.status === 'paused';
  const isFailed = staged?.status === 'error';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={browse}
      onKeyDown={e => {
        /* Only the zone itself opens the picker. The controls nested inside it
           are activated by the same keys, and without this their activation is
           cancelled here and the picker opens instead. */
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          browse();
        }
      }}
      onDragEnter={e => {
        e.preventDefault();
        dragDepth.current += 1;
        setIsDragging(true);
      }}
      onDragOver={e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={e => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed bg-ink-50/30 p-8 transition-colors',
        isDragging
          ? 'border-royal bg-royal/5'
          : 'border-ink-100 hover:border-royal/40',
      )}>
      <FileArchive className="h-10 w-10 shrink-0 text-ink-500" />
      <div className="min-w-0 flex-1">
        {staged ? (
          <>
            {isUploading || isPaused || isFailed ? (
              <ProgressFill
                value={staged.progress}
                tone={isFailed ? 'error' : isPaused ? 'paused' : 'active'}
                label={i18n.t('Uploading {0}', staged.fileName)}
                showValue
                className="rounded-md px-2 py-1">
                <p className="truncate text-sm text-ink-900">
                  {staged.fileName}
                </p>
              </ProgressFill>
            ) : (
              <p className="truncate text-sm text-ink-900">{staged.fileName}</p>
            )}
            {staged.status === 'success' && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-palette-green" />
                {i18n.t('Ready to save')}
              </p>
            )}
            {(isPaused || isFailed) && (
              <p
                className={cn(
                  'mt-0.5 line-clamp-2 text-xs',
                  isFailed ? 'text-destructive' : 'text-status-pending-fg',
                )}>
                {isPaused ? i18n.t('Upload paused') : staged.error}
              </p>
            )}
          </>
        ) : existingFileName && downloadHref ? (
          <>
            <a
              href={downloadHref}
              download
              onClick={e => e.stopPropagation()}
              className="truncate text-sm font-medium text-royal hover:underline">
              {existingFileName}
            </a>
            {existingFileSizeText && (
              <p className="text-xs text-ink-500">{existingFileSizeText}</p>
            )}
          </>
        ) : (
          <>
            <p className="truncate text-sm text-ink-500">
              {i18n.t('No file selected')}
            </p>
            <p className="text-xs text-ink-500">
              {i18n.t('Drag and drop a .zip here, or click to browse')}
            </p>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        className="hidden"
        onChange={handlePick}
      />
      {isUploading && onPause && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={i18n.t('Pause')}
          title={i18n.t('Pause')}
          onClick={e => {
            e.stopPropagation();
            onPause();
          }}>
          <Pause className="mr-1 h-4 w-4" />
          {i18n.t('Pause')}
        </Button>
      )}
      {(isPaused || isFailed) && onResume && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={isPaused ? i18n.t('Resume') : i18n.t('Retry')}
          title={isPaused ? i18n.t('Resume') : i18n.t('Retry')}
          className={isFailed ? 'text-destructive' : 'text-status-pending-fg'}
          onClick={e => {
            e.stopPropagation();
            onResume();
          }}>
          {isPaused ? (
            <Play className="mr-1 h-4 w-4" />
          ) : (
            <RotateCcw className="mr-1 h-4 w-4" />
          )}
          {isPaused ? i18n.t('Resume') : i18n.t('Retry')}
        </Button>
      )}
      {staged && onClear && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={e => {
            e.stopPropagation();
            onClear();
          }}>
          <X className="mr-1 h-4 w-4" />
          {i18n.t('Remove')}
        </Button>
      )}
      <Button
        type="button"
        variant="ink-outline"
        size="sm"
        onClick={e => {
          e.stopPropagation();
          browse();
        }}>
        <Upload className="mr-1 h-4 w-4" />
        {staged || existingFileName ? i18n.t('Replace') : i18n.t('Upload')}
      </Button>
    </div>
  );
}
