'use client';

import {Fragment, useState} from 'react';
import {Swiper, SwiperSlide} from 'swiper/react';
import {Pagination} from 'swiper/modules';
import {FreeMode, Navigation, Thumbs} from 'swiper/modules';

import {Skeleton} from '@/ui/components/skeleton';
import {Separator} from '@/ui/components/separator';

export function CategoriesSkeleton({count = 5}) {
  const categories = Array.from({length: count});

  return (
    <div className="flex items-center gap-4 p-4">
      {categories.map((c, i) => (
        <Skeleton key={i} className="h-4 w-32" />
      ))}
    </div>
  );
}

export function CarouselSkeleton({count = 5}) {
  const images = Array.from({length: count});

  return (
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
      {images.map((item: any, i: number) => {
        return (
          <SwiperSlide key={i} className="max-w-full">
            <div className="flex items-center relative bg-center bg-no-repeat bg-cover h-[750px] p-4 md:p-20">
              <div className="absolute top-0 left-0 w-full h-full bg-black/[.15]" />
              <div className="space-y-4 md:w-1/2 z-20">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-60" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="absolute left-0 top-0 right-0 bottom-0 z-10 bg-[linear-gradient(90deg,_#FFF_14.57%,_rgba(255,255,255,0.00)_98.91%)]"></div>
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}

export function FeaturedCategoriesSkeleton({
  categoryCount = 3,
  productCount = 4,
}) {
  const categories = Array.from({length: categoryCount});
  const products = Array.from({length: productCount});

  return categories?.map((c, i) => (
    <Fragment key={i}>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-44" />
        <div className="flex gap-2 px-3 py-4 cursor-pointer">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {products.map((p, j) => {
          return <ProductCardSkeleton key={j} />;
        })}
      </div>
    </Fragment>
  ));
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col justify-start cursor-pointer rounded-2xl bg-card text-card-foreground min-h-[25.625rem]">
      <div>
        <Skeleton className="rounded-t-lg bg-cover relative h-[14.5rem]">
          <div className="border shadow-lg absolute bg-card p-4 rounded-full flex items-center justify-center w-[3.75rem] h-[3.75rem] bottom-4 right-4">
            <Skeleton className="h-4 w-32 mb-0 text-xl font-bold" />
          </div>
        </Skeleton>
        <div className="flex flex-col py-4 px-6 gap-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-2 w-20" />
        </div>
      </div>
      <div className="flex items-start justify-between p-6 pt-0">
        <div></div>
        <Skeleton className="border shadow-lg p-4 rounded-full flex items-center justify-center w-[3.75rem] h-[3.75rem] bottom-4 right-4" />
      </div>
    </div>
  );
}

export function BreadcrumbsSkeleton() {
  const count = Array.from({length: 4});

  return (
    <div className="flex items-center p-2 gap-2">
      {count.map((c, i) => (
        <Skeleton key={i} className="h-4 w-32" />
      ))}
    </div>
  );
}

export function ProductListColorFilterSkeleton() {
  const filters = Array.from({length: 5});

  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-32" />
      <div className="flex flex-wrap gap-2">
        {filters.map((f, i) => (
          <div
            key={i}
            className="bg-[#F6F1FF] inline-flex items-center gap-4 px-2 py-1 border border-gray-200 rounded-full cursor-pointer">
            <span className="rounded-full w-4 h-4 min-w-4"></span>
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductListBrandFilterSkeleon() {
  const brands = Array.from({length: 5});

  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-6 w-32" />
      {brands.map((b, i) => (
        <Skeleton key={i} className="h-4 w-36" />
      ))}
    </div>
  );
}

export function ProductListSkeleton() {
  const products = Array.from({length: 9});
  return (
    <div>
      <div className="flex items-center justify-between bg-white relative">
        <div className="w-0 md:w-[80%] overflow-hidden">
          <CategoriesSkeleton />
        </div>
        <div className="w-full sm:!w-[18.75rem] px-4 py-2">
          <div className="relative !bg-none w-full">
            <Skeleton className="h-4 w-44 pl-12 rounded-full mb-0" />
          </div>
        </div>
      </div>
      <div className="container portal-container">
        <div className="my-10">
          <BreadcrumbsSkeleton />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32 flex-grow-0! basis-[25%]" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="bg-card text-card-foreground shadow mb-4 grid md:hidden grid-cols-2 gap-2 p-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[17.3125rem_1fr] grid-cols-1">
          <div className="flex flex-col gap-6">
            {/* <ProductListColorFilterSkeleton /> */}
            {/* <ProductListBrandFilterSkeleon /> */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {products.map((p, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="mt-6 mb-4 flex items-center justify-center">
          <div className="bg-white rounded-full flex items-center justify-center gap-2 px-4 py-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThumbsCarouselSkeleton() {
  const images = Array.from({length: 5});

  const [thumbsSwiper, setThumbsSwiper] = useState<any>();
  const [prevEl, setPrevEl] = useState<HTMLElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLElement | null>(null);

  return (
    <div className="relative rounded-lg p-2 border">
      <Swiper
        spaceBetween={10}
        pagination={false}
        navigation={{prevEl, nextEl}}
        modules={[FreeMode, Navigation, Thumbs]}
        thumbs={{
          swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
        }}>
        {images?.map((im, i) => (
          <SwiperSlide key={i}>
            <Skeleton
              className="mb-4 bg-center bg-cover rounded-lg"
              style={{
                backgroundSize: 'cover',
                width: '23.75rem',
                height: '23.75rem',
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <div
        className="absolute h-full w-full"
        style={{top: 0, left: 0, zIndex: 1}}>
        <div>
          <Skeleton
            ref={(node: any) => setPrevEl(node)}
            className="absolute h-4 w-20"
            style={{top: '40%', left: '1rem'}}
          />

          <Skeleton
            ref={(node: any) => setPrevEl(node)}
            className="absolute h-4 w-20"
            style={{top: '40%', left: '1rem'}}
          />
        </div>
      </div>

      <Swiper
        freeMode
        threshold={2}
        spaceBetween={10}
        slidesPerView={5}
        watchSlidesProgress
        onSwiper={setThumbsSwiper}
        modules={[FreeMode, Navigation, Thumbs]}>
        {images?.map((im, i) => (
          <SwiperSlide key={i} className="bg-white p-1">
            <Skeleton
              className=" bg-center bg-cover bg-no-repeat rounded-lg"
              style={{
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                width: '4.0rem',
                height: '4.0rem',
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export function ProductViewSkeleton() {
  return (
    <div>
      <div className="relative">
        <CategoriesSkeleton />
      </div>
      <div className="container py-2">
        <div className="my-10">
          <BreadcrumbsSkeleton />
        </div>
        <div className="grid md:grid-cols-[36%_1fr] grid-cols-1 gap-5">
          <div className="overflow-hidden rounded-lg">
            <ThumbsCarouselSkeleton />
          </div>
          <div className="rounded-lg border bg-card text-card-foreground p-4">
            <div className="flex flex-col gap-2 mb-6">
              <Skeleton className="h-4 w-44" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-2 w-20" />
            </div>
            <div className="mt-4 p-4 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
            <Skeleton className="h-8 w-full rounded-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartItemSkeleton() {
  return (
    <div className="flex-col md:flex-row flex items-start gap-6 bg-card text-card-foreground p-4 rounded-lg">
      <Skeleton
        className="rounded-lg h-[12.5rem] md:w-[12.5rem] w-full min-w-[12.5rem]"
        style={{backgroundSize: 'cover'}}
      />
      <div className="flex-col md:flex-row flex items-start justify-between w-full h-full">
        <div className="flex flex-col items-start justify-between py-2 h-full">
          <Skeleton className="h-6 w-44" />
          <div className="flex flex-col mt-auto gap-4">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end ml-auto py-2 h-full">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="w-6 h-4 p-0 ml-auto mt-auto" />
        </div>
      </div>
    </div>
  );
}

export function CartItemsSkeleton() {
  const items = Array.from({length: 5});

  return (
    <div className="flex flex-col gap-6">
      {items?.map((it: any, i) => <CartItemSkeleton key={i} />)}
    </div>
  );
}

export function CartSummarySkeleton() {
  return (
    <div className="p-4 bg-card text-card-foreground rounded-lg h-fit">
      <Skeleton className="h-6 mb-6" />
      <Separator className="mb-2" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Separator className="my-2" />
      <div className="flex flex-col gap-4 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-full rounded-full" />
        <Skeleton className="h-8 w-full rounded-full" />
      </div>
      <Separator className="mb-4" />
      <Skeleton className="h-8 w-full rounded-full" />
    </div>
  );
}

export function CartSkeleton() {
  return (
    <>
      <Skeleton className="h-4 w-32 mb-6" />
      <div className="grid mb-[5rem] lg:mb-0 lg:grid-cols-[1fr_25%] xl:grid-cols-[1fr_21%] grid-cols-1 gap-4">
        <CartItemsSkeleton />
        <CartSummarySkeleton />
      </div>
    </>
  );
}

export function CheckoutSummarySkeleton() {
  const items = Array.from({length: 3});
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg">
      <Skeleton className="h-6 w-32 mb-6" />
      <div className="flex flex-col gap-4 pt-4">
        {items.map((it, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="rounded-lg w-[5rem] h-[5rem]" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-44" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CheckoutTotalSkeleton() {
  return (
    <div className="rounded-lg p-4 bg-card text-card-foreground">
      <Skeleton className="h-6 w-32" />
      <Separator className="my-4" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-4 w-32" />
        <div>
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

export function CheckoutShippingSkeleton() {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg">
      <Skeleton className="h-6 w-32" />
      <Separator className="my-4" />
      <div className="border rounded-lg flex p-4 gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-40" />
        </div>

        <Skeleton className="h-4 w-32 ml-auto" />
      </div>

      <div className="border rounded-lg flex p-4 gap-4 mt-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <Skeleton className="h-4 w-32 ml-auto" />
      </div>
    </div>
  );
}

export function AddressSelectionSkeleton() {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg">
      <Skeleton className="h-6 w-32" />
      <Separator className="my-4" />

      <div className="space-y-2 divide-y">
        <div className="border p-4 rounded-lg space-y-2">
          <Skeleton className="h-6 w-32 mb-4" />
          <div>
            <Skeleton className="h-6 w-60 mb-4" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <>
      <Skeleton className="h-6 w-44 mb-6" />
      <div className="grid lg:grid-cols-[1fr_25%] xl:grid-cols-[1fr_21%] grid-cols-1 gap-4">
        <div>
          <div className="flex flex-col gap-6">
            <AddressSelectionSkeleton />
            <CheckoutShippingSkeleton />
          </div>
        </div>
        <div>
          <div className="flex flex-col gap-6">
            <CheckoutSummarySkeleton />
            <CheckoutTotalSkeleton />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full rounded-full" />
              <Skeleton className="h-8 w-full rounded-full" />
              <Skeleton className="h-8 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
