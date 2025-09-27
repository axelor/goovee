import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio3Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Image from 'next/image';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {Fragment} from 'react';

export function Portfolio3(props: TemplateProps<Portfolio3Data>) {
  const {data} = props;
  const {
    portfolio3Caption: caption,
    portfolio3Description: description,
    portfolio3SlidesPerView: slidesPerView,
    portfolio3Pagination: pagination,
    portfolio3PortfolioList: portfolioList = [],
  } = data || {};

  return (
    <div className="overflow-hidden">
      <div className="container pt-12 pt-lg-7 pb-14 pb-md-16">
        <div className="row">
          <div className="col-lg-10 col-xl-9 col-xxl-8 mx-auto text-center">
            <h2 className="fs-16 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-3 mb-10">{description}</h3>
          </div>
        </div>

        <div className="swiper-container grid-view nav-bottom nav-color mb-14">
          <Carousel
            grabCursor
            slidesPerView={slidesPerView}
            pagination={pagination}
            className="overflow-visible"
            breakpoints={{768: {slidesPerView: 2}, 0: {slidesPerView: 1}}}>
            {portfolioList?.map(({id, attrs: item}, i) => (
              <Fragment key={id}>
                <figure className="rounded mb-7">
                  <img
                    src={getMetaFileURL({
                      metaFile: item.image,
                      path: `portfolio3PortfolioList[${i}].attrs.image`,
                      ...props,
                    })}
                    alt=""
                  />
                </figure>

                <div className="project-details d-flex justify-content-center flex-column">
                  <div className="post-header">
                    <h2 className="post-title h3">
                      <NextLink
                        title={item.title}
                        className="link-dark"
                        href={item.url}
                      />
                    </h2>
                    <div className="post-category text-ash">
                      {item.category}
                    </div>
                  </div>
                </div>
              </Fragment>
            ))}
          </Carousel>
        </div>
      </div>

      <div className="divider text-soft-primary mx-n2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
          <path
            fill="currentColor"
            d="M1260,1.65c-60-5.07-119.82,2.47-179.83,10.13s-120,11.48-180,9.57-120-7.66-180-6.42c-60,1.63-120,11.21-180,16a1129.52,1129.52,0,0,1-180,0c-60-4.78-120-14.36-180-19.14S60,7,30,7H0v93H1440V30.89C1380.07,23.2,1319.93,6.15,1260,1.65Z"
          />
        </svg>
      </div>
    </div>
  );
}
