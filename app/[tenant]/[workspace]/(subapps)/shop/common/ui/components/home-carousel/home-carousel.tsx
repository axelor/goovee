'use client';

import {Swiper, SwiperSlide} from 'swiper/react';
import {Pagination} from 'swiper/modules';

import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {Button} from '@/ui/components/button';
import {i18n} from '@/locale';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import type {ShopConfig} from '@/subapps/shop/common/orm/config';

export function HomeCarousel({
  images,
}: {
  images: NonNullable<ShopConfig['carouselList']> | null | undefined;
}) {
  const {workspaceURI} = useWorkspace();

  return images?.length ? (
    <Swiper
      modules={[Pagination]}
      pagination={{
        type: 'bullets',
        clickable: true,
        bulletActiveClass: '[&>div]:bg-black',
        horizontalClass: '!bottom-[4.375rem]',
        renderBullet: (index, className) =>
          `<div class="${className} h-3 w-3 rounded-full bg-transparent border border-black inline-flex items-center justify-center">
            <div class="h-2 w-2 rounded-full"></div>
          </div>`,
      }}>
      {images.map((item, i) => {
        return (
          <SwiperSlide key={i} className="max-w-full">
            <div
              className="flex items-center relative bg-center bg-no-repeat bg-cover h-[750px] p-4 md:p-20"
              style={{
                backgroundImage: `url("${withBasePath(
                  `${workspaceURI}/${SUBAPP_CODES.shop}/api/carousel/${item.id}/image`,
                )}")`,
              }}>
              <div className="absolute top-0 left-0 w-full h-full bg-black/[.15]" />
              <div className="space-y-10 md:w-1/2 z-20">
                <h2 className="font-medium text-4xl">{item.title}</h2>
                <p className="text-xl">{item.subTitle}</p>
                <Button className="relative z-10" asChild>
                  <a
                    href={item.href || '#'}
                    target="_blank"
                    rel="noopener noreferrer">
                    {i18n.t(
                      (item as {buttonLabel?: string})?.buttonLabel ||
                        'Shop products',
                    )}
                  </a>
                </Button>
              </div>
              <div className="absolute left-0 top-0 right-0 bottom-0 z-10 bg-[linear-gradient(90deg,_#FFF_14.57%,_rgba(255,255,255,0.00)_98.91%)]"></div>
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  ) : null;
}

export default HomeCarousel;
