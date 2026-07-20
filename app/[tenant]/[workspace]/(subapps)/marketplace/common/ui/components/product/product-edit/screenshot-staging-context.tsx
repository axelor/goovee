'use client';

import {createContext, useContext, type RefObject} from 'react';

// ---- CORE IMPORTS ---- //
import type {UseStagedUpload} from '@/lib/core/upload/use-staged-upload';

/**
 * Screenshot staging shared down to `ScreenshotsFormField`. The upload hook and
 * the object-URL preview maps are created once in `useProductEditForm` (the
 * editor session) and handed down through this context, so in-flight uploads
 * and their previews survive the dialog's product-collapse — which unmounts
 * `ScreenshotsFormField` — and any other leaf remount.
 */
export type ScreenshotStaging = {
  upload: UseStagedUpload;
  /** token → object URL, for committed new screenshots (`kind:'new'`). */
  previewByToken: RefObject<Map<string, string>>;
  /** upload item id → object URL, for in-flight / errored tiles (pre-token). */
  previewByItem: RefObject<Map<string, string>>;
};

const ScreenshotStagingContext = createContext<ScreenshotStaging | null>(null);

export function ScreenshotStagingProvider({
  value,
  children,
}: {
  value: ScreenshotStaging;
  children: React.ReactNode;
}) {
  return (
    <ScreenshotStagingContext.Provider value={value}>
      {children}
    </ScreenshotStagingContext.Provider>
  );
}

export function useScreenshotStaging(): ScreenshotStaging {
  const context = useContext(ScreenshotStagingContext);
  if (!context) {
    throw new Error(
      'useScreenshotStaging must be used within a ScreenshotStagingProvider',
    );
  }
  return context;
}
