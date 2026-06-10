import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/ui/components/form';
import {Progress} from '@/ui/components/progress/progress';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {getFileSizeText} from '@/utils/files';
import {ChevronLeft, ChevronRight, Plus, Star, X} from 'lucide-react';
import Image from 'next/image';
import {useMemo, useRef, useState} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import type {MyProductForEdit} from '../../../../orm';
import {getProductScreenshotURL} from '../../../../utils/images';
import {FormMessageSpace} from '../../shared/form-message-space';
import {useScreenshotStaging} from '../product-edit/screenshot-staging-context';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES,
  MAX_IMAGE_SIZE,
  type ProductFormValues,
  type ProductImage,
} from './validator';

/** A screenshot still uploading (or failed) — rendered after the committed
 *  tiles, with progress, until its token commits to the form. */
type InFlightTile = {
  id: string;
  fileName: string;
  progress: number;
  status: 'queued' | 'uploading' | 'error';
  src: string | null;
};

type ScreenshotsFieldProps = {
  /** The ordered committed value; array position is the persisted `sequence`. */
  images: ProductImage[];
  /** Resolves the preview URL for a committed image (existing or new). Returns
   *  null for an unknown one (renders a placeholder slot). */
  getImgSrc: (image: ProductImage) => string | null;
  /** Files still uploading — shown after the committed tiles, not reorderable. */
  inFlight: InFlightTile[];
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  /** Abort + drop an in-flight (or failed) upload. */
  onCancelUpload: (id: string) => void;
  onAddFiles: (files: FileList | null) => void;
  /** How many more images (committed + in-flight) the user can still add. */
  remaining: number;
};

/* Ordered multi-image manager. Owns everything about *presenting* the
 * screenshots — the committed thumbnails (existing pictures + staged new ones),
 * the in-flight upload tiles with progress, the move/remove/add controls, and
 * the native file-drop dropzone. Knows nothing about react-hook-form or the
 * upload hook; the caller owns the ordered `images` value, the in-flight list,
 * and the mutation callbacks.
 *   - Committed thumbnails render 1:1 with `images`, in order; the first is the
 *     cover. Each has move-left / make-cover / move-right / remove controls.
 *   - In-flight tiles follow, each with a progress bar and a cancel control.
 *   - "Add or drop images" appends via onAddFiles (picker or file-drop). */
function ScreenshotsField({
  images,
  getImgSrc,
  inFlight,
  onReorder,
  onRemove,
  onCancelUpload,
  onAddFiles,
  remaining,
}: ScreenshotsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  /* Depth counter so the highlight doesn't flicker as the cursor crosses
   * child thumbnails (dragenter/dragleave fire per element boundary). */
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handlePick = (files: FileList | null) => {
    onAddFiles(files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (remaining <= 0) return;
    handlePick(event.dataTransfer.files);
  };

  return (
    <div
      onDragEnter={event => {
        event.preventDefault();
        dragDepth.current += 1;
        if (remaining > 0) setIsDragging(true);
      }}
      onDragOver={event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = remaining > 0 ? 'copy' : 'none';
      }}
      onDragLeave={event => {
        event.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
      className={cn(
        'flex flex-wrap gap-3 rounded-lg border-2 border-dashed p-3 transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-transparent',
      )}>
      {images.map((image, index) => {
        const isFirst = index === 0;
        const isLast = index === images.length - 1;
        /* Resolve preview inline so the thumbnail list stays 1:1 with
         * `images` — the index below indexes the form array directly. A
         * not-yet-ready URL just renders an empty (muted) slot for a frame. */
        const key =
          image.kind === 'existing'
            ? `existing-${image.id}`
            : `new-${image.token}`;
        const src = getImgSrc(image);
        return (
          <div
            key={key}
            className="group relative aspect-video w-32 overflow-hidden rounded-lg border border-border bg-muted">
            {src && (
              <Image
                src={src}
                alt={i18n.t('Product screenshot {0}', String(index + 1))}
                width={256}
                height={144}
                unoptimized={image.kind === 'new'}
                className="h-full w-full object-cover"
              />
            )}
            {isFirst && (
              <span className="absolute left-1 top-1 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-medium text-background">
                {i18n.t('Cover')}
              </span>
            )}
            <button
              type="button"
              aria-label={i18n.t('Remove image')}
              onClick={() => onRemove(index)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground">
              <X size={12} />
            </button>
            {/* Move controls — shown on hover/focus. Reordering rewrites the
                ordered `images` array; array position becomes `sequence`. */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-foreground/70 py-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                aria-label={i18n.t('Move left')}
                disabled={isFirst}
                onClick={() => onReorder(index, index - 1)}
                className="flex h-5 w-5 items-center justify-center rounded text-background hover:bg-background/20 disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              {!isFirst && (
                <button
                  type="button"
                  aria-label={i18n.t('Make cover image')}
                  onClick={() => onReorder(index, 0)}
                  className="flex h-5 w-5 items-center justify-center rounded text-background hover:bg-background/20">
                  <Star size={12} />
                </button>
              )}
              <button
                type="button"
                aria-label={i18n.t('Move right')}
                disabled={isLast}
                onClick={() => onReorder(index, index + 1)}
                className="flex h-5 w-5 items-center justify-center rounded text-background hover:bg-background/20 disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        );
      })}
      {inFlight.map(tile => (
        <div
          key={tile.id}
          className="relative aspect-video w-32 overflow-hidden rounded-lg border border-border bg-muted">
          {tile.src && (
            <Image
              src={tile.src}
              alt={tile.fileName}
              width={256}
              height={144}
              unoptimized
              className="h-full w-full object-cover opacity-50"
            />
          )}
          <button
            type="button"
            aria-label={i18n.t('Cancel upload')}
            onClick={() => onCancelUpload(tile.id)}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground">
            <X size={12} />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-1.5">
            {tile.status === 'error' ? (
              <span className="block truncate rounded bg-destructive/90 px-1.5 py-0.5 text-[10px] font-medium text-background">
                {i18n.t('Upload failed')}
              </span>
            ) : (
              <Progress value={tile.progress} className="h-1.5" />
            )}
          </div>
        </div>
      ))}
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-video w-32 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
          <Plus size={20} />
          <span className="text-xs">{i18n.t('Add or drop images')}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        hidden
        onChange={event => handlePick(event.target.files)}
      />
    </div>
  );
}

/* Thin RHF adapter + staging bridge: watches the ordered `images` field,
 * stages newly-picked files via the session upload hook (real per-file
 * progress), and commits each one to `images` as `{kind:'new', token}` once it
 * finishes. Preview URLs and the upload hook come from the staging context
 * (created in useProductEditForm), so an in-flight upload survives this field
 * unmounting on the dialog's product-collapse. Separate subcomponent so the
 * useWatch subscription doesn't re-render the whole form. Shared by the
 * full-page editor and the dialog. */
export function ScreenshotsFormField({
  initial,
}: {
  initial?: Cloned<MyProductForEdit>;
}) {
  const {workspaceURI} = useWorkspace();
  const {toast} = useToast();
  const {control, setValue, getValues} = useFormContext<ProductFormValues>();
  const images = useWatch({control, name: 'images'});
  const productId = initial?.id ?? '';
  const {
    upload: screenshotUpload,
    previewByToken,
    previewByItem,
  } = useScreenshotStaging();

  // Map existing AOSMarketplaceProductPicture rowId -> AOSMetaFile id (for URL).
  const initialImageMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of initial?.pictureList ?? []) {
      if (row?.id && row?.picture?.id) {
        map.set(row.id, row.picture.id);
      }
    }
    return map;
  }, [initial?.pictureList]);

  const getImgSrc = (image: ProductImage) => {
    if (image.kind === 'existing') {
      const fileId = initialImageMap.get(image.id);
      return fileId
        ? getProductScreenshotURL({workspaceURI, productId, fileId})
        : null;
    }
    return previewByToken.current.get(image.token) ?? null;
  };

  /* Uploads not yet committed to the form (queued / in-flight / failed).
   * Succeeded uploads are dropped from the hook the moment their token lands in
   * `images`, so they never appear here. */
  const inFlight: InFlightTile[] = screenshotUpload.uploads
    .filter(
      item =>
        item.status === 'queued' ||
        item.status === 'uploading' ||
        item.status === 'error',
    )
    .map(item => ({
      id: item.id,
      fileName: item.fileName,
      progress: item.progress,
      status: item.status as InFlightTile['status'],
      src: previewByItem.current.get(item.id) ?? null,
    }));

  const commit = (next: ProductImage[]) =>
    setValue('images', next, {shouldValidate: true, shouldDirty: true});

  const onReorder = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  };

  const onRemove = (index: number) => {
    const image = images[index];
    if (image?.kind === 'new') {
      const url = previewByToken.current.get(image.token);
      if (url) {
        URL.revokeObjectURL(url);
        previewByToken.current.delete(image.token);
      }
    }
    commit(images.filter((_, i) => i !== index));
  };

  const onCancelUpload = (id: string) => {
    const url = previewByItem.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      previewByItem.current.delete(id);
    }
    screenshotUpload.remove(id);
  };

  const onAddFiles = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files);
    /* The cap counts committed images plus uploads already in flight. */
    const remaining = MAX_IMAGES - images.length - inFlight.length;
    const valid = picked.filter(
      file =>
        (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type) &&
        file.size <= MAX_IMAGE_SIZE,
    );
    const accepted = valid.slice(0, Math.max(0, remaining));

    /* Stage each accepted file independently (1:1 token↔preview; ≤9 small
     * files, so uncapped concurrency is fine). The returned id is available
     * synchronously, so we key its preview before any progress arrives; on
     * success we move the preview to a token key, append to `images`, and drop
     * the now-committed item from the hook. */
    for (const file of accepted) {
      const objectUrl = URL.createObjectURL(file);
      const {ids, done} = screenshotUpload.upload([file], {
        purpose: 'marketplace:screenshot',
      });
      const itemId = ids[0];
      previewByItem.current.set(itemId, objectUrl);
      done.then(([result]) => {
        if (!result) return; // failed/aborted — error tile stays for cancel
        previewByItem.current.delete(itemId);
        previewByToken.current.set(result.token, objectUrl);
        /* Read the live value at resolve time (not the stale useWatch
         * snapshot) so concurrent resolutions don't clobber each other. */
        const current = getValues('images');
        const alreadyIn = current.some(
          image => image.kind === 'new' && image.token === result.token,
        );
        if (!alreadyIn) {
          commit([...current, {kind: 'new', token: result.token}]);
        }
        screenshotUpload.remove(itemId);
      });
    }

    /* Tell the user when files were dropped on the floor — otherwise an
     * oversize/unsupported image, or one past the cap, just silently
     * vanishes (it never enters the upload flow, so nothing flags it). */
    const skipped = picked.length - accepted.length;
    if (skipped > 0) {
      toast({
        variant: 'destructive',
        title: i18n.t(
          '{0} image(s) skipped — unsupported type, over {2}, or past the {1}-image limit.',
          String(skipped),
          String(MAX_IMAGES),
          getFileSizeText(MAX_IMAGE_SIZE),
        ),
      });
    }
  };

  return (
    <FormField
      control={control}
      name="images"
      render={() => (
        <FormItem>
          <FormLabel>
            {i18n.t('Screenshots')}{' '}
            <span className="text-xs text-muted-foreground">
              {i18n.t(
                '({0}/{1}, up to {2})',
                String(images.length + inFlight.length),
                String(MAX_IMAGES),
                getFileSizeText(MAX_IMAGE_SIZE),
              )}
            </span>
          </FormLabel>
          <FormControl>
            <ScreenshotsField
              images={images}
              getImgSrc={getImgSrc}
              inFlight={inFlight}
              onReorder={onReorder}
              onRemove={onRemove}
              onCancelUpload={onCancelUpload}
              onAddFiles={onAddFiles}
              remaining={MAX_IMAGES - images.length - inFlight.length}
            />
          </FormControl>
          <FormMessageSpace />
          <p className="text-xs text-muted-foreground">
            {i18n.t(
              'Any image format. Max {1} per image, up to {0} per product. The first image is the cover.',
              String(MAX_IMAGES),
              getFileSizeText(MAX_IMAGE_SIZE),
            )}
          </p>
        </FormItem>
      )}
    />
  );
}
