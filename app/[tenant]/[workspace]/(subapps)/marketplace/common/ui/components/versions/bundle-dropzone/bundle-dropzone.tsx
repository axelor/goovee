import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {Progress} from '@/ui/components/progress/progress';
import {cn} from '@/utils/css';
import {CheckCircle2, FileArchive, Upload, X} from 'lucide-react';
import {useRef, useState} from 'react';

/** A bundle being staged this session — progress while uploading, then the
 *  terminal state. Drives the dropzone's current-file display. */
export type StagedBundle = {
  fileName: string;
  /** 0–100 while uploading. */
  progress: number;
  status: 'queued' | 'uploading' | 'success' | 'error';
  error?: string;
};

type BundleDropzoneProps = {
  /** The staged upload for this version's bundle (uploading / done / failed
   *  this session). Takes precedence over the existing-bundle display. */
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
  /** Drop the staged bundle (aborting it if still uploading) and revert to the
   *  existing / empty state. */
  onClear?: () => void;
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
      onError(i18n.t('Bundle must be 20 MB or less'));
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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={browse}
      onKeyDown={e => {
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
        'flex cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed bg-muted/30 p-8 transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-foreground/40',
      )}>
      <FileArchive className="h-10 w-10 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        {staged ? (
          <>
            <p className="truncate text-sm text-foreground">
              {staged.fileName}
            </p>
            {isUploading && (
              <div className="mt-1.5 flex items-center gap-2">
                <Progress value={staged.progress} className="h-1.5 flex-1" />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {staged.progress}%
                </span>
              </div>
            )}
            {staged.status === 'success' && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-palette-green" />
                {i18n.t('Ready to save')}
              </p>
            )}
            {staged.status === 'error' && (
              <p className="mt-0.5 text-xs text-destructive">
                {staged.error ?? i18n.t('Upload failed. Try again.')}
              </p>
            )}
          </>
        ) : existingFileName && downloadHref ? (
          <>
            <a
              href={downloadHref}
              download
              onClick={e => e.stopPropagation()}
              className="truncate text-sm font-medium text-primary hover:underline">
              {existingFileName}
            </a>
            {existingFileSizeText && (
              <p className="text-xs text-muted-foreground">
                {existingFileSizeText}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="truncate text-sm text-muted-foreground">
              {i18n.t('No file selected')}
            </p>
            <p className="text-xs text-muted-foreground">
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
        variant="outline"
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
