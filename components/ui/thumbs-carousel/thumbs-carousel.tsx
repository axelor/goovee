'use client';
import {useState} from 'react';
import Swiper, {FreeMode, Navigation, Thumbs} from 'swiper';
import {Swiper as SwiperCarousel, SwiperSlide} from 'swiper/react';
import {Button} from '@ui/components/button';
import {FaChevronLeft, FaChevronRight} from 'react-icons/fa';

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
              className="mb-4 bg-center bg-cover rounded-lg"
              style={{
                backgroundImage: `url(${url})`,
                backgroundSize: 'cover',
                width: '380px',
                height: '380px',
              }}></div>
          </SwiperSlide>
        ))}
      </SwiperCarousel>

      <div
        className="absolute h-full w-full"
        style={{top: 0, left: 0, zIndex: 1}}>
        <div>
          <Button
            ref={(node: any) => setPrevEl(node)}
            className="absolute"
            style={{top: '40%', left: '1rem'}}>
            <div className="flex">
              <FaChevronLeft color="white" />
            </div>
          </Button>
          <Button
            ref={(node: any) => setNextEl(node)}
            className="absolute right-4"
            style={{top: '40%'}}>
            <div className="flex">
              <FaChevronRight color="white" />
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
              className="rounded-lg bg-center bg-cover bg-no-repeat rounded-lg"
              style={{
                backgroundImage: `url(${url})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                width: '68px',
                height: '68px',
              }}
            />
          </SwiperSlide>
        ))}
      </SwiperCarousel>
    </div>
  );
};

export default ThumbsCarousel;
