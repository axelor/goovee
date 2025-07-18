'use client';

import {ReactElement, CSSProperties, ReactNode} from 'react';

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
  const url = src || defaultSrc;

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
