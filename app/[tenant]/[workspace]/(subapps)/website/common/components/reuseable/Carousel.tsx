'use client';
import {FC, Fragment, ReactElement, useState} from 'react';
import {Autoplay, Navigation, Pagination} from 'swiper/modules';
import {Swiper, SwiperProps, SwiperSlide} from 'swiper/react';

// ==================================================================
interface CarouselProps extends SwiperProps {
  pagination?: boolean;
  navigation?: boolean;
  spaceBetween?: number;
  slideClassName?: string;
  children: ReactElement<any>[];
  slidesPerView?: number | 'auto';
}
// ==================================================================

const Carousel: FC<CarouselProps> = ({
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
    <Fragment>
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
      <div className="swiper-controls">
        {/* custom navigation */}
        {navigation && (
          <div className="swiper-navigation">
            <div
              role="button"
              ref={node => {
                setPrevEl(node);
              }}
              className="swiper-button swiper-button-prev"
            />
            <div
              role="button"
              ref={node => {
                setNextEl(node);
              }}
              className="swiper-button swiper-button-next"
            />
          </div>
        )}

        {/* custom pagination */}
        {pagination && (
          <div
            className="swiper-pagination"
            ref={node => {
              setPaginationEl(node);
            }}
          />
        )}
      </div>
    </Fragment>
  );
};

export default Carousel;
