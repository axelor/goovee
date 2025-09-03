'use client';
import {Swiper, SwiperSlide} from 'swiper/react';
import {FreeMode, Pagination} from 'swiper/modules';
import {ReactNode} from 'react';
import {cn} from '@/utils/css';
type SwipeProps = {
  items: ReactNode[];
  className?: string;
};
export function Swipe({items, className}: SwipeProps) {
  return (
    <Swiper
      slidesPerView="auto"
      spaceBetween={20}
      modules={[FreeMode, Pagination]}
      wrapperClass="flex items-center mb-6"
      pagination={{
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true,
      }}>
      {items.map((item, i) => (
        <SwiperSlide
          key={i}
          className={cn(
            'bg-card rounded-lg shrink-0 !w-[220px] !h-[120px] cursor-pointer',
            className,
          )}>
          {item}
        </SwiperSlide>
      ))}
      <div className="swiper-pagination !relative"></div>
    </Swiper>
  );
}

export default Swipe;
