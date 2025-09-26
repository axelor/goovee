import type {TemplateProps} from '@/subapps/website/common/types';
import {type Blog2Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import {BlogCard4} from '@/subapps/website/common/components/reuseable/blog-cards';

export function Blog2(props: TemplateProps<Blog2Data>) {
  const {data} = props;
  const {
    blog2Title: title,
    blog2Caption: caption,
    blog2Navigation: navigation,
    blog2SpaceBetween: spaceBetween,
    blog2BlogList: blogList = [],
    blog2WrapperClassName: wrapperClassName,
    blog2ContainerClassName: containerClassName,
  } = data || {};

  const carouselBreakpoints = {
    0: {slidesPerView: 1},
    768: {slidesPerView: 2},
    992: {slidesPerView: 3},
  };

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row text-center">
          <div className="col-lg-9 col-xl-8 col-xxl-8 mx-auto">
            <h2 className="fs-15 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-4 mb-6">{title}</h3>
          </div>
        </div>

        <div className="position-relative">
          <div
            className="shape bg-dot primary rellax w-17 h-20"
            style={{top: 0, left: '-1.7rem'}}
          />

          <div className="swiper-container dots-closer blog grid-view mb-6">
            <Carousel
              grabCursor
              spaceBetween={spaceBetween}
              navigation={navigation}
              breakpoints={carouselBreakpoints}>
              {blogList?.map(({id, attrs: item}, i) => (
                <div className="item-inner" key={id}>
                  <BlogCard4
                    {...item}
                    image={getMetaFileURL({
                      metaFile: item.image,
                      path: `blog2BlogList[${i}].attrs.image`,
                      ...props,
                    })}
                  />
                </div>
              ))}
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
