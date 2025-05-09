'use client';

import React from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {cn} from '@/utils/css';

const bannerVariants = cva(
  'flex-col lg:w-auto w-full h-[300px] lg:h-[353px] flex items-center justify-center bg-no-repeat bg-cover',
  {
    variants: {
      blendMode: {
        normal: 'bg-blend-normal',
        multiply: 'bg-blend-multiply',
        screen: 'bg-blend-screen',
        overlay: 'bg-blend-overlay',
        darken: 'bg-blend-darken',
        lighten: 'bg-blend-lighten',
        dodge: 'bg-blend-color-dodge',
        burn: 'bg-blend-color-burn',
        hard: 'bg-blend-hard-light',
        soft: 'bg-blend-soft-light',
        difference: 'bg-blend-difference',
        exclusion: 'bg-blend-exclusion',
        hue: 'bg-blend-hue',
        saturation: 'bg-blend-saturation',
        color: 'bg-blend-color',
        luminosity: 'bg-blend-luminosity',
      },
      background: {
        default: 'bg-secondary',
        red: 'bg-red-500/50',
        pink: 'bg-pink-500/50',
        purple: 'bg-purple-500/50',
        deeppurple: 'bg-purple-900/50',
        indigo: 'bg-indigo-500/50',
        blue: 'bg-blue-500/50',
        lightblue: 'bg-sky-500/50',
        cyan: 'bg-cyan-500/50',
        teal: 'bg-teal-500/50',
        green: 'bg-green-500/50',
        lightgreen: 'bg-green-300/50',
        lime: 'bg-lime-500/50',
        yellow: 'bg-yellow-500/50',
        amber: 'bg-amber-500/50',
        orange: 'bg-orange-500/50',
        deeporange: 'bg-orange-600/50',
        brown: 'bg-amber-700/50', // Closest to brown
        grey: 'bg-gray-500/50',
        bluegrey: 'bg-slate-500/50', // Using slate as closest match for blue-grey
        black: 'bg-black/50',
        white: 'bg-white/50',
      },
    },
    defaultVariants: {
      blendMode: 'normal',
      background: 'default',
    },
  },
);

export type BannerVariants = typeof bannerVariants;

export const Banner = ({
  groupImg,
  title,
  description,
  image,
  renderSearch,
  className,
  blendMode,
  background,
}: {
  groupImg?: string;
  title: string;
  description: string;
  image?: any;
  renderSearch?: any;
  className?: string;
} & VariantProps<BannerVariants>) => {
  return (
    <div
      className={cn(
        'relative bg-transparent',
        className,
        bannerVariants({blendMode, background}),
      )}>
      <Image
        fill
        src={image}
        alt="background image"
        className={cn('object-cover z-0')}
        priority
      />
      <div className="px-4 flex text-white items-center flex-col justify-cente py-0.5 z-10">
        {groupImg && (
          <div className="w-20 h-20 overflow-hidden rounded-lg relative mb-4">
            <Image
              fill
              src={groupImg}
              alt={'Group Image'}
              className="rounded-lg"
              objectFit="cover"
            />
          </div>
        )}
        <h2 className="lg:text-[32px] text-2xl font-semibold mb-2">{title}</h2>
        <p className="lg:text-lg text-base font-medium md:max-w-screen-sm lg:max-w-screen-md text-center mb-4">
          {description}
        </p>
        {renderSearch && renderSearch()}
      </div>
    </div>
  );
};

export default Banner;
