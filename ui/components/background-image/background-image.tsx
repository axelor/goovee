'use client';

import {CSSProperties, ReactNode} from 'react';

// ---- CORE IMPORTS ---- //
import {withBasePath} from '@/lib/core/path/base-path';

export type BackgroundImageProps = {
  src?: string;
  defaultSrc?: string;
  height?: string | number;
  width?: string | number;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
};

export function BackgroundImage({
  src,
  style,
  height,
  width,
  defaultSrc = '/images/no-image.png',
  className,
  children,
}: BackgroundImageProps) {
  const url = src || withBasePath(defaultSrc);

  return (
    <div
      className={`${className} bg-no-repeat bg-center`}
      style={{
        height,
        width,
        backgroundImage: `url(${url})`,
        ...style,
      }}>
      {children}
    </div>
  );
}

export default BackgroundImage;
