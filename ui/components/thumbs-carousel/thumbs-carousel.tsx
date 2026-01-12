'use client';

import {useState} from 'react';
import Swiper from 'swiper';
import {FreeMode, Navigation, Thumbs} from 'swiper/modules';
import {Swiper as SwiperCarousel, SwiperSlide} from 'swiper/react';
import {FaChevronLeft, FaChevronRight} from 'react-icons/fa';

// ---- CORE IMPORTS ---- //
import {Button} from '@/ui/components';

export const ThumbsCarousel = ({
  images = [],
}: {
  images?: Array<{url: string; id: string | number}>;
}) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<Swiper>();
  const [prevEl, setPrevEl] = useState<HTMLElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLElement | null>(null);

  if (!images?.length) return null;

  return (
    <div className="relative rounded-lg p-2 border">
      <SwiperCarousel
        spaceBetween={10}
        pagination={false}
        navigation={{prevEl, nextEl}}
        modules={[FreeMode, Navigation, Thumbs]}
        thumbs={{
          swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
        }}>
        {images?.map(({url, id}) => (
          <SwiperSlide key={id}>
            <div
              className="mb-4 bg-center bg-cover rounded-lg w-full"
              style={{
                backgroundImage: `url(${url})`,
                backgroundSize: 'cover',
                width: '23.75rem',
                height: '23.75rem',
              }}></div>
          </SwiperSlide>
        ))}
      </SwiperCarousel>
      <div
        className="absolute h-full w-full"
        style={{top: 0, left: 0, zIndex: 1}}>
        <div>
          <Button
            ref={(node: any) => {
              setPrevEl(node);
            }}
            className="absolute"
            style={{top: '40%', left: '1rem'}}>
            <div className="flex">
              <FaChevronLeft className="text-primary-foreground" />
            </div>
          </Button>
          <Button
            ref={(node: any) => {
              setNextEl(node);
            }}
            className="absolute right-4"
            style={{top: '40%'}}>
            <div className="flex">
              <FaChevronRight className="text-primary-foreground" />
            </div>
          </Button>
        </div>
      </div>
      <SwiperCarousel
        freeMode
        threshold={2}
        spaceBetween={10}
        slidesPerView={5}
        watchSlidesProgress
        onSwiper={setThumbsSwiper}
        modules={[FreeMode, Navigation, Thumbs]}>
        {images?.map(({url, id}) => (
          <SwiperSlide key={id}>
            <div
              className="bg-center bg-cover bg-no-repeat rounded-lg"
              style={{
                backgroundImage: `url(${url})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                width: '4.25rem',
                height: '4.25rem',
              }}
            />
          </SwiperSlide>
        ))}
      </SwiperCarousel>
    </div>
  );
};

export default ThumbsCarousel;
