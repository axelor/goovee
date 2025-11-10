import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio10Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import ProjectCard3 from '@/subapps/website/common/components/reuseable/project-cards/ProjectCard3';
import {Fragment} from 'react';

export default function Portfolio10(props: TemplateProps<Portfolio10Data>) {
  const {data} = props;
  const {
    portfolio10Caption: caption,
    portfolio10Description: description,
    portfolio10Navigation: navigation,
    portfolio10PortfolioList: portfolioList = [],
    portfolio10WrapperClassName: wrapperClassName,
    portfolio10ContainerClassName: containerClassName,
  } = data || {};

  const carouselBreakpoints = {
    0: {slidesPerView: 1},
    768: {slidesPerView: 2},
    992: {slidesPerView: 3},
  };

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <div className="row mt-17">
            <div className="col-lg-10 col-xl-10 col-xxl-9 mx-auto text-center">
              <h2 className="fs-16 text-uppercase text-muted mb-3">
                {caption}
              </h2>
              <h3 className="display-3 mb-10">{description}</h3>
            </div>
          </div>

          <div className="swiper-container grid-view">
            <Carousel
              navigation={navigation}
              grabCursor
              breakpoints={carouselBreakpoints}>
              {portfolioList?.map(({id, attrs: item}, i) => (
                <ProjectCard3
                  key={id}
                  title={item.title}
                  category={item.category}
                  link={item.link}
                  image={getImage({
                    image: item.image,
                    path: `portfolio10PortfolioList[${i}].attrs.image`,
                    ...props,
                  })}
                  fullImage={getImage({
                    image: item.fullImage,
                    path: `portfolio10PortfolioList[${i}].attrs.fullImage`,
                    ...props,
                  })}
                />
              ))}
            </Carousel>
          </div>
        </Fragment>
      </div>
    </section>
  );
}
