import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/ui/components/form';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {ChevronLeft, ChevronRight, Plus, Star, X} from 'lucide-react';
import Image from 'next/image';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import type {MyProductForEdit} from '../../../../orm';
import {getProductScreenshotURL} from '../../../../utils/images';
import {FormMessageSpace} from '../../shared/form-message-space';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES,
  MAX_IMAGE_SIZE,
  type ProductFormValues,
  type ProductImage,
} from './validator';

type ScreenshotsFieldProps = {
  /** The ordered form value; array position is the persisted `sequence`. */
  images: ProductImage[];
  /** Resolves the thumbnail URL for an existing picture (per-product route).
   *  Returns null for an unknown id (renders a placeholder slot). */
  getImgSrc: (id: string) => string | null;
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onAddFiles: (files: FileList | null) => void;
  /** Max number of images (existing + new) the user can keep. */
  maxImages: number;
};

/* Ordered multi-image manager. Owns everything about *presenting* the
 * screenshots — object-URL previews for new files, stable thumbnail keys,
 * the move/remove/add controls, and the native file-drop dropzone. Knows
 * nothing about react-hook-form; the caller owns the ordered `images` value
 * and the mutation callbacks.
 *   - Renders thumbnails 1:1 with `images`, in order; the first is the cover.
 *   - Each has move-left / make-cover / move-right / remove controls.
 *   - "Add or drop images" appends via onAddFiles (picker or file-drop).
 *     Reordering is button-based, so it never collides with the file drop. */
function ScreenshotsField({
  images,
  getImgSrc,
  onReorder,
  onRemove,
  onAddFiles,
  maxImages,
}: ScreenshotsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  /* Depth counter so the highlight doesn't flicker as the cursor crosses
   * child thumbnails (dragenter/dragleave fire per element boundary). */
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const remaining = maxImages - images.length;

  /* Stable React keys for new files: File refs persist across reorders, so a
   * WeakMap keyed by File gives each one a key that survives array moves
   * (preventing preview <Image> remounts / flicker). */
  const keyMap = useRef(new WeakMap<File, string>());
  const keySeq = useRef(0);
  const keyForFile = (file: File) => {
    let key = keyMap.current.get(file);
    if (!key) {
      key = `new-${++keySeq.current}`;
      keyMap.current.set(file, key);
    }
    return key;
  };

  /* Object URLs for the not-yet-uploaded files, held in state (so render
   * reflects them) and cached per File so a URL is minted once and survives
   * reorders without flicker. The effect mints URLs for newly-seen files and
   * revokes ones whose file left the list. `urlsRef` mirrors the live set so
   * the unmount cleanup can revoke whatever's outstanding. */
  const [objectUrls, setObjectUrls] = useState<Map<File, string>>(
    () => new Map(),
  );
  const urlsRef = useRef(objectUrls);
  useEffect(() => {
    const previous = urlsRef.current;
    const wanted = new Set(
      images.flatMap(image => (image.kind === 'new' ? [image.file] : [])),
    );
    const next = new Map(previous);
    let changed = false;
    for (const [file, url] of previous) {
      if (!wanted.has(file)) {
        URL.revokeObjectURL(url);
        next.delete(file);
        changed = true;
      }
    }
    for (const file of wanted) {
      if (!next.has(file)) {
        next.set(file, URL.createObjectURL(file));
        changed = true;
      }
    }
    if (changed) {
      urlsRef.current = next;
      setObjectUrls(next);
    }
  }, [images]);
  useEffect(
    () => () => {
      urlsRef.current.forEach(url => URL.revokeObjectURL(url));
      urlsRef.current = new Map();
    },
    [],
  );

  // TODO: per-file upload progress indicator.
  // Server Actions don't expose upload progress; would need to either
  // switch this to an XHR-backed route handler (universal — boring but
  // proven) or to `fetch` + ReadableStream body (no Firefox support yet,
  // HTTP/2 + HTTPS only, `duplex: 'half'`). For now we lean on the
  // submit button's pending spinner; revisit if users complain.
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
          image.kind === 'existing' ? image.id : keyForFile(image.file);
        const src =
          image.kind === 'existing'
            ? getImgSrc(image.id)
            : (objectUrls.get(image.file) ?? null);
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

/* Thin RHF adapter: watches the single ordered `images` field, supplies the
 * existing-image URL resolver + mutation callbacks, and renders the
 * FormField scaffold. All presentation/preview concerns live in
 * ScreenshotsField. Separate subcomponent so the useWatch subscription
 * doesn't re-render the whole form. Shared by the full-page editor and the
 * dialog. */
export function ScreenshotsFormField({
  initial,
}: {
  initial?: Cloned<MyProductForEdit>;
}) {
  const {workspaceURI} = useWorkspace();
  const {toast} = useToast();
  const {control, setValue} = useFormContext<ProductFormValues>();
  const images = useWatch({control, name: 'images'});
  const productId = initial?.id ?? '';

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

  const getImgSrc = (id: string) => {
    const fileId = initialImageMap.get(id);
    return fileId
      ? getProductScreenshotURL({workspaceURI, productId, fileId})
      : null;
  };

  const commit = (next: ProductImage[]) =>
    setValue('images', next, {shouldValidate: true, shouldDirty: true});

  const onReorder = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  };

  const onRemove = (index: number) =>
    commit(images.filter((_, i) => i !== index));

  const onAddFiles = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files);
    const remaining = MAX_IMAGES - images.length;
    const valid = picked.filter(
      file =>
        (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type) &&
        file.size <= MAX_IMAGE_SIZE,
    );
    const accepted = valid.slice(0, Math.max(0, remaining));
    if (accepted.length) {
      commit([
        ...images,
        ...accepted.map(file => ({kind: 'new' as const, file})),
      ]);
    }
    /* Tell the user when files were dropped on the floor — otherwise an
     * oversize/unsupported image, or one past the cap, just silently
     * vanishes (it never enters `images`, so Zod can't flag it either). */
    const skipped = picked.length - accepted.length;
    if (skipped > 0) {
      toast({
        variant: 'destructive',
        title: i18n.t(
          '{0} image(s) skipped — unsupported type, over 5 MB, or past the {1}-image limit.',
          String(skipped),
          String(MAX_IMAGES),
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
                '({0}/{1}, up to 5 MB each)',
                String(images.length),
                String(MAX_IMAGES),
              )}
            </span>
          </FormLabel>
          <FormControl>
            <ScreenshotsField
              images={images}
              getImgSrc={getImgSrc}
              onReorder={onReorder}
              onRemove={onRemove}
              onAddFiles={onAddFiles}
              maxImages={MAX_IMAGES}
            />
          </FormControl>
          <FormMessageSpace />
          <p className="text-xs text-muted-foreground">
            {i18n.t(
              'Any image format. Max 5 MB per image, up to {0} per product. The first image is the cover.',
              String(MAX_IMAGES),
            )}
          </p>
        </FormItem>
      )}
    />
  );
}
