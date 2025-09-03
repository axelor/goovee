'use client';
import {FC, Fragment, useState} from 'react';
import type Swiper from 'swiper';
import {FreeMode, Navigation, Thumbs} from 'swiper/modules';
import {Swiper as SwiperCarousel, SwiperSlide} from 'swiper/react';

function Carousel2(props: {
  slides: {
    image?: string;
    thumb?: string;
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
          <SwiperSlide
            key={i}
            style={{backgroundImage: `url(${image})`}}
            className="bg-overlay bg-overlay-400 bg-dark bg-image"
          />
        ))}
      </SwiperCarousel>

      {/* custom navigations */}
      <div className="swiper-controls">
        <div className="swiper-navigation">
          <div
            role="button"
            ref={node => setPrevEl(node)}
            className="swiper-button swiper-button-prev"
          />
          <div
            role="button"
            ref={node => setNextEl(node)}
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
            <img src={thumb} alt="product" />
          </SwiperSlide>
        ))}
      </SwiperCarousel>
    </Fragment>
  );
}

export default Carousel2;
