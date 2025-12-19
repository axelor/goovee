'use client';
import Image from 'next/image';
import {Fragment, useState} from 'react';
import type Swiper from 'swiper';
import {FreeMode, Navigation, Thumbs} from 'swiper/modules';
import {Swiper as SwiperCarousel, SwiperSlide} from 'swiper/react';
import type {ImageType} from '../../types/templates';

function Carousel2(props: {
  slides: {
    image?: ImageType;
    thumb?: ImageType;
  }[];
}) {
  const {slides} = props;
  const [thumbsSwiper, setThumbsSwiper] = useState<Swiper>();
  const [prevEl, setPrevEl] = useState<HTMLElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLElement | null>(null);

  return (
    <Fragment>
      <SwiperCarousel
        spaceBetween={10}
        pagination={false}
        navigation={{prevEl, nextEl}}
        modules={[FreeMode, Navigation, Thumbs]}
        thumbs={{
          swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
        }}>
        {slides.map(({image, thumb}, i) => (
          <SwiperSlide key={i} className="position-relative">
            {image?.url && (
              <Image
                src={image.url}
                alt={image.alt || 'Carousel image'}
                fill
                className="object-cover"
              />
            )}
            <div
              className="position-absolute w-100 h-100 top-0 start-0 "
              style={{background: 'rgba(30, 34, 40, .4)'}}></div>
          </SwiperSlide>
        ))}
      </SwiperCarousel>
      {/* custom navigations */}
      <div className="swiper-controls">
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
      </div>
      <SwiperCarousel
        freeMode
        threshold={2}
        spaceBetween={10}
        slidesPerView={5}
        watchSlidesProgress
        onSwiper={setThumbsSwiper}
        modules={[FreeMode, Navigation, Thumbs]}>
        {slides.map(({thumb, image}, i) => (
          <SwiperSlide key={i}>
            {thumb?.url && (
              <Image
                src={thumb.url}
                alt={thumb.alt}
                width={thumb.width}
                height={thumb.height}
              />
            )}
          </SwiperSlide>
        ))}
      </SwiperCarousel>
    </Fragment>
  );
}

export default Carousel2;
