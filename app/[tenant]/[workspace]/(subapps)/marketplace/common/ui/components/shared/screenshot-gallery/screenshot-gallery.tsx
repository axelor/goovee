'use client';

import type GLightboxType from 'glightbox';
import Image, {getImageProps} from 'next/image';
import {useCallback, useEffect, useRef} from 'react';

export interface ScreenshotGalleryImage {
  id: string;
  src: string;
}

export interface ScreenshotGalleryProps {
  images: ScreenshotGalleryImage[];
  alt: string;
}

export function ScreenshotGallery({images, alt}: ScreenshotGalleryProps) {
  const lightboxRef = useRef<ReturnType<typeof GLightboxType> | null>(null);

  const openAt = useCallback(
    async (idx: number) => {
      if (!lightboxRef.current) {
        const {GLightbox} = await import('./lightbox-loader');
        // Re-check after the await — that's the only point where a parallel
        // click could have instantiated the lightbox while we were suspended.
        // Without this guard we'd create (and leak) a second instance.
        const existing = lightboxRef.current as ReturnType<
          typeof GLightboxType
        > | null;
        if (existing) {
          existing.openAt(idx);
          return;
        }
        const lightbox = GLightbox({
          loop: false,
          touchNavigation: true,
          zoomable: true,
          moreLength: 0,
        });
        lightbox.setElements(
          images.map(img => {
            const {props} = getImageProps({
              src: img.src,
              alt,
              width: 1920,
              height: 1080,
              sizes: '90vw',
            });
            return {
              href: props.src,
              srcset: props.srcSet,
              sizes: props.sizes,
              type: 'image',
            };
          }),
        );
        lightboxRef.current = lightbox;
      }
      lightboxRef.current.openAt(idx);
    },
    [images, alt],
  );

  useEffect(() => {
    return () => {
      lightboxRef.current?.destroy();
      lightboxRef.current = null;
    };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((img, idx) => (
        <button
          key={img.id}
          type="button"
          onClick={() => openAt(idx)}
          className="aspect-video bg-muted rounded-lg border border-border overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Image
            src={img.src}
            alt={alt}
            width={600}
            height={400}
            className="w-full h-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}
