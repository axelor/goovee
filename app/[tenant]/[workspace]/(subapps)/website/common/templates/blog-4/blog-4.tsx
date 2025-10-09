import type {TemplateProps} from '@/subapps/website/common/types';
import {type Blog4Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import {BlogCard1} from '@/subapps/website/common/components/reuseable/blog-cards';
import carouselBreakpoints from '@/subapps/website/common/utils/carouselBreakpoints';

export function Blog4(props: TemplateProps<Blog4Data>) {
  const {data} = props;
  const {
    blog4Title: title,
    blog4Caption: caption,
    blog4Navigation: navigation,
    blog4BlogList: blogList = [],
    blog4WrapperClassName: wrapperClassName,
    blog4ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row text-center">
          <div className="col-lg-9 col-xxl-8 mx-auto">
            <h2 className="fs-16 text-uppercase text-gradient gradient-1 mb-3">
              {caption}
            </h2>
            <h3 className="display-4 mb-9 me-lg-n5">{title}</h3>
          </div>
        </div>

        <div className="swiper-container blog grid-view">
          <Carousel
            grabCursor
            navigation={navigation}
            breakpoints={carouselBreakpoints}>
            {blogList?.map(({id, attrs: item}, i) => (
              <BlogCard1
                key={id}
                {...item}
                image={getMetaFileURL({
                  metaFile: item.image,
                  path: `blog4BlogList[${i}].attrs.image`,
                  ...props,
                })}
              />
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
