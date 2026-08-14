'use client';

import {MdClose, MdPause, MdPlayArrow, MdRefresh} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import type {StagedUploadStatus} from '@/lib/core/upload/use-staged-upload';

const BUTTON_CLASS =
  'grid place-items-center rounded-full bg-white/90 transition-colors hover:bg-white';

interface PictureUploadActionProps {
  status: StagedUploadStatus;
  onPause: () => void;
  onResume: () => void;
}

/**
 * The control at the centre of a picture's upload ring: hold a transfer that is
 * running, or carry on one that stopped.
 *
 * Only ever one button, because the ring is smaller than the picture it sits on
 * and a second would not fit inside it. Giving up on the upload lives in
 * `PictureUploadCancel`, out at the corner where there is room.
 */
export function PictureUploadAction({
  status,
  onPause,
  onResume,
}: PictureUploadActionProps) {
  if (status === 'queued' || status === 'uploading') {
    return (
      <button
        type="button"
        onClick={onPause}
        aria-label={i18n.t('Pause')}
        title={i18n.t('Pause')}
        className={`${BUTTON_CLASS} size-7 text-ink-700`}>
        <MdPause className="size-4" />
      </button>
    );
  }

  if (status === 'paused' || status === 'error') {
    const isPaused = status === 'paused';
    return (
      <button
        type="button"
        onClick={onResume}
        aria-label={isPaused ? i18n.t('Resume') : i18n.t('Retry')}
        title={isPaused ? i18n.t('Resume') : i18n.t('Retry')}
        className={`${BUTTON_CLASS} size-7 text-ink-700`}>
        {isPaused ? (
          <MdPlayArrow className="size-4" />
        ) : (
          <MdRefresh className="size-4" />
        )}
      </button>
    );
  }

  return null;
}

/** Gives up on the upload, pinned to the corner of the picture it belongs to. */
export function PictureUploadCancel({onCancel}: {onCancel: () => void}) {
  return (
    <button
      type="button"
      onClick={onCancel}
      aria-label={i18n.t('Cancel')}
      title={i18n.t('Cancel')}
      className={`${BUTTON_CLASS} absolute -right-1.5 -top-1.5 size-5 text-destructive shadow-sm`}>
      <MdClose className="size-3.5" />
    </button>
  );
}
