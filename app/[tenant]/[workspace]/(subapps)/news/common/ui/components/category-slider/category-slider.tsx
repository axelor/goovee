'use client';

import React from 'react';
import {Swiper, SwiperSlide} from 'swiper/react';
import {Pagination} from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import {usePathname} from 'next/navigation';
import Link from 'next/link';

// ---- CORE IMPORTS ---- //
import {Button} from '@/ui/components/button';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {Skeleton} from '@/ui/components';

//---- LOCAL IMPORTS ---- //
import type {RawNewsCategory} from '@/subapps/news/common/types';
import styles from '@/subapps/news/common/ui/styles/news.module.scss';
import Image from 'next/image';
import {withBasePath} from '@/lib/core/path/base-path';

export const CategorySlider = ({
  title = '',
  showButton = false,
  buttonText = '',
  categories = [],
  buttonIcon: Icon,
  showTitle = true,
}: {
  title?: string;
  showButton?: boolean;
  buttonText?: string;
  categories: RawNewsCategory[];
  buttonIcon?: React.ComponentType<{className?: string}>;
  showTitle?: boolean;
}) => {
  const pathname = usePathname();
  const {workspaceURI} = useWorkspace();

  if (!showTitle) {
    return null;
  }
  return (
    <div className="flex flex-col gap-6 mt-6">
      <div className="flex justify-between">
        <span className="font-semibold text-xl">{title}</span>
        {showButton && Icon && (
          <Button
            variant="success"
            className="flex gap-2 text-white px-3 py-[6px] rounded-md hover:bg-success-dark">
            <Icon className="w-6 h-6" />
            <span className="text-base font-medium"> {buttonText}</span>
          </Button>
        )}
      </div>

      {categories?.length ? (
        <div>
          <Swiper
            pagination={{
              clickable: true,
            }}
            modules={[Pagination]}
            wrapperClass={styles.wrapper}
            breakpoints={{
              320: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              640: {
                slidesPerView: 4,
                spaceBetween: 20,
              },

              1024: {
                slidesPerView: 6,
                spaceBetween: 20,
              },
              1280: {
                slidesPerView: 8,
                spaceBetween: 20,
              },
            }}>
            {categories?.map(({id, image, name, slug}) => (
              <SwiperSlide
                key={id}
                style={{
                  width: '154px',
                  marginRight: 20,
                }}>
                <Link
                  className="relative flex w-full items-end justify-center cursor-pointer"
                  href={`${pathname}/${slug}`}>
                  <div className="h-[120px] w-full relative rounded-md flex items-end justify-center">
                    <Image
                      fill
                      src={
                        image?.id
                          ? withBasePath(
                              `${workspaceURI}/${SUBAPP_CODES.news}/api/category/${slug}/image`,
                            )
                          : withBasePath(NO_IMAGE_URL)
                      }
                      alt={'Category image'}
                      className="rounded-md object-cover"
                      sizes="(min-width: 1024px) 130px, (min-width: 768px) 233px, (min-width: 320px) 190px, 100vw"
                    />
                    <div className="pb-4 text-center text-white font-semibold text-xs z-10">
                      {name}
                    </div>
                  </div>
                  <div
                    className="absolute inset-0 rounded-md"
                    style={{
                      background:
                        'linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%)',
                    }}></div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export function CategoriesSkeleton() {
  return (
    <div className="flex flex-col gap-6 mt-6">
      <Skeleton className="h-6 w-32" />
      <div className="flex gap-4">
        <div className="w-[8.125rem] h-[7.5rem] rounded-md relative overflow-hidden">
          <Skeleton className="w-full h-full rounded-md" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-3">
            <Skeleton className="h-3 w-full rounded bg-white" />
          </div>
        </div>
        <div className="w-[8.125rem] h-[7.5rem] rounded-md relative overflow-hidden">
          <Skeleton className="w-full h-full rounded-md" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-3">
            <Skeleton className="h-3 w-full rounded bg-white" />
          </div>
        </div>
        <div className="w-[8.125rem] h-[7.5rem] rounded-md relative overflow-hidden">
          <Skeleton className="w-full h-full rounded-md" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-3">
            <Skeleton className="h-3 w-full rounded bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategorySlider;
