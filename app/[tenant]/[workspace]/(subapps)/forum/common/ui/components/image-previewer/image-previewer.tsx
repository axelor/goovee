'use client';

import React, {useEffect, useState} from 'react';
import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {formatNumber} from '@/locale/formatters';
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {MAX_IMAGES_BEFORE_OVERLAY} from '@/subapps/forum/common/constants';

interface ImageItem {
  file: File;
  altText: string;
}
interface ImagePreviewerProps {
  images: ImageItem[];
  /**
   * Drawn over the thumbnail at `index`, for state that belongs on the image
   * itself rather than beside it — an upload still in flight, say.
   */
  renderOverlay?: (index: number) => React.ReactNode;
}

export const ImagePreviewer: React.FC<ImagePreviewerProps> = ({
  images,
  renderOverlay,
}) => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = images.map(image => {
      if (image.file instanceof File) {
        const url = URL.createObjectURL(image.file);
        return url;
      }
      return '';
    });

    setImageUrls(urls);

    return () => {
      urls.forEach(url => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [images]);

  const showOverlay = images.length > MAX_IMAGES_BEFORE_OVERLAY;

  /* Columns follow the tiles actually drawn, not the images held, so the row
   * never leaves a gap where an image beyond the overlay would have gone. */
  const visibleCount = Math.min(images.length, MAX_IMAGES_BEFORE_OVERLAY);

  const gridCols =
    visibleCount >= 3
      ? 'grid-cols-3'
      : visibleCount === 2
        ? 'grid-cols-2'
        : 'grid-cols-1';

  return (
    <div className={`w-full grid ${gridCols} gap-6`}>
      {imageUrls.slice(0, MAX_IMAGES_BEFORE_OVERLAY).map((url, index) => {
        const overlay = renderOverlay?.(index);

        return (
          <div key={index} className="relative aspect-square">
            <Image
              fill
              src={url}
              alt={i18n.t('post image')}
              className="rounded-lg object-cover flex-shrink-0"
            />

            {index === MAX_IMAGES_BEFORE_OVERLAY - 1 && showOverlay && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-5xl font-semibold">
                +{formatNumber(images.length - MAX_IMAGES_BEFORE_OVERLAY)}
              </div>
            )}

            {/* Fills the tile, and raised, so the overlay is centred on the
                image and the count badge on the third tile cannot cover it.
                Only present when there is something to draw, so an empty layer
                never sits over the picture. */}
            {overlay && <div className="absolute inset-0 z-10">{overlay}</div>}
          </div>
        );
      })}
    </div>
  );
};
