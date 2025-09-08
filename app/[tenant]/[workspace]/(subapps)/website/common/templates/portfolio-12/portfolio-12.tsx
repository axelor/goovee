import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio12Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import {ProjectCard3} from '@/subapps/website/common/components/reuseable/project-cards';
import {Fragment} from 'react';

export function Portfolio12(props: TemplateProps<Portfolio12Data>) {
  const {data} = props;
  const {
    portfolio12Caption: caption,
    portfolio12Description: description,
    portfolio12Navigation: navigation,
    portfolio12PortfolioList: portfolioList = [],
  } = data || {};

  const carouselBreakpoints = {
    0: {slidesPerView: 1},
    768: {slidesPerView: 2},
    992: {slidesPerView: 3},
  };

  return (
    <div className="container">
      <Fragment>
        <div className="row">
          <div className="col-lg-10 col-xl-8 mx-auto text-center">
            <h2 className="fs-16 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-10 px-xxl-10">{description}</h3>
          </div>
        </div>

        <div className="swiper-container grid-view mb-19">
          <Carousel
            navigation={navigation}
            grabCursor
            breakpoints={carouselBreakpoints}>
            {portfolioList?.map(({id, attrs: item}, i) => (
              <ProjectCard3
                key={id}
                link={item.link}
                title={item.title}
                category={item.category}
                image={getMetaFileURL({
                  metaFile: item.image,
                  path: `portfolio12PortfolioList[${i}].attrs.image`,
                  ...props,
                })}
                fullImage={getMetaFileURL({
                  metaFile: item.fullImage,
                  path: `portfolio12PortfolioList[${i}].attrs.fullImage`,
                  ...props,
                })}
              />
            ))}
          </Carousel>
        </div>
      </Fragment>
    </div>
  );
}
