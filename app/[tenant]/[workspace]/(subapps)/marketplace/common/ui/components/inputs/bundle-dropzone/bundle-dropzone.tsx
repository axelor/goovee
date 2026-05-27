import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {cn} from '@/utils/css';
import {FileArchive, Upload} from 'lucide-react';
import {useRef, useState} from 'react';

type BundleDropzoneProps = {
  /** The newly-picked file, if any. */
  file?: File | null;
  /** Details of the already-uploaded bundle (when editing an existing version). */
  existingFileName?: string | null;
  existingFileSizeText?: string | null;
  downloadHref?: string;
  /** Max accepted size in bytes. */
  maxSize: number;
  onFile: (file: File) => void;
  /** Called with a ready-to-display message when a drop/pick is rejected. */
  onError: (message: string) => void;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

/**
 * Click-or-drag zone for a single .zip bundle. Owns its drag state and runs
 * .zip/size validation, emitting the accepted file via `onFile` or a localized
 * reason via `onError`.
 */
export function BundleDropzone({
  file,
  existingFileName,
  existingFileSizeText,
  downloadHref,
  maxSize,
  onFile,
  onError,
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
        {file ? (
          <>
            <p className="truncate text-sm text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={e => {
          e.stopPropagation();
          browse();
        }}>
        <Upload className="mr-1 h-4 w-4" />
        {file || existingFileName ? i18n.t('Replace') : i18n.t('Upload')}
      </Button>
    </div>
  );
}
