'use client';
import {ArrowLeft, ArrowRight} from 'lucide-react';
import {FC, ReactElement, useState} from 'react';
import {Autoplay, Navigation, Pagination} from 'swiper/modules';
import {Swiper, SwiperProps, SwiperSlide} from 'swiper/react';
import {Button} from '@/ui/components/button/button';

// ==================================================================
export interface CarouselProps extends SwiperProps {
  pagination?: boolean;
  navigation?: boolean;
  spaceBetween?: number;
  slideClassName?: string;
  children: ReactElement[];
  slidesPerView?: number | 'auto';
}
// ==================================================================

export const Carousel: FC<CarouselProps> = ({
  children,
  slideClassName,
  spaceBetween = 30,
  slidesPerView = 3,
  pagination = true,
  navigation = true,
  ...others
}) => {
  const [prevEl, setPrevEl] = useState<HTMLElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLElement | null>(null);
  const [paginationEl, setPaginationEl] = useState<HTMLElement | null>(null);

  return (
    <div className="relative !mb-28 text-center">
      <Swiper
        spaceBetween={spaceBetween}
        slidesPerView={slidesPerView}
        modules={[Pagination, Navigation, Autoplay]}
        navigation={navigation ? {prevEl, nextEl} : false}
        pagination={pagination ? {clickable: true, el: paginationEl} : false}
        {...others}>
        {children.map((slide, i) => (
          <SwiperSlide className={slideClassName} key={i}>
            {slide}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Controls container - absolute positioning now relative to the new outer div */}
      <div className="absolute top-0 left-0 z-10 h-full w-full pointer-events-none">
        {/* custom navigation */}
        {navigation && (
          <div className="flex flex-row justify-center absolute -bottom-16 left-0 w-full pointer-events-auto">
            <Button
              role="button"
              ref={node => setPrevEl(node)}
              variant="default"
              size="icon"
              className="relative h-11 w-11 rounded-full shadow-sm mx-1 bg-primary/90 text-white hover:bg-primary [&.swiper-button-disabled]:cursor-not-allowed [&.swiper-button-disabled]:opacity-50 [&.swiper-button-disabled]:bg-primary/70">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              role="button"
              ref={node => setNextEl(node)}
              variant="default"
              size="icon"
              className="relative h-11 w-11 rounded-full shadow-sm mx-1 bg-primary/90 text-white hover:bg-primary [&.swiper-button-disabled]:cursor-not-allowed [&.swiper-button-disabled]:opacity-50 [&.swiper-button-disabled]:bg-primary/70">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* custom pagination */}
        {pagination && (
          <div
            className="absolute -bottom-[6.5rem] left-0 flex w-full justify-center pointer-events-auto [&_.swiper-pagination-bullet]:mx-1.5 [&_.swiper-pagination-bullet]:h-2.5 [&_.swiper-pagination-bullet]:w-2.5 [&_.swiper-pagination-bullet]:cursor-pointer [&_.swiper-pagination-bullet]:rounded-full [&_.swiper-pagination-bullet]:border-[3px] [&_.swiper-pagination-bullet]:border-transparent [&_.swiper-pagination-bullet]:bg-secondary [&_.swiper-pagination-bullet]:opacity-50 [&_.swiper-pagination-bullet]:transition-all [&_.swiper-pagination-bullet]:scale-60 hover:[&_.swiper-pagination-bullet]:scale-100 [&_.swiper-pagination-bullet-active]:scale-100 [&_.swiper-pagination-bullet-active]:border-secondary [&_.swiper-pagination-bullet-active]:bg-transparent [&_.swiper-pagination-bullet-active]:opacity-100"
            ref={node => setPaginationEl(node)}
          />
        )}
      </div>
    </div>
  );
};
