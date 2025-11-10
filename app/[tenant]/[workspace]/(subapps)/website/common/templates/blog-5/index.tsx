import type {TemplateProps} from '@/subapps/website/common/types';
import {type Blog5Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import BlogCard5 from '@/subapps/website/common/components/reuseable/blog-cards/BlogCard5';
import carouselBreakpoints from '@/subapps/website/common/utils/carouselBreakpoints';

export default function Blog5(props: TemplateProps<Blog5Data>) {
  const {data} = props;
  const {
    blog5Title: title,
    blog5Pagination: pagination,
    blog5BlogList: blogList = [],
    blog5WrapperClassName: wrapperClassName,
    blog5ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className="overflow-hidden">
        <div className={containerClassName}>
          <div className="row">
            <div className="col-xl-7 col-xxl-6 mx-auto text-center">
              <i className="icn-flower text-leaf fs-30 opacity-25"></i>
              <h2 className="display-5 text-center mt-2 mb-10">{title}</h2>
            </div>
          </div>

          <div className="swiper-container nav-bottom nav-color mb-14 swiper-container-3">
            <Carousel
              grabCursor
              pagination={pagination}
              className="overflow-visible pb-2"
              breakpoints={carouselBreakpoints}>
              {blogList?.map(({id, attrs: item}, i) => (
                <article key={id}>
                  <BlogCard5
                    {...item}
                    image={getImage({
                      image: item.image,
                      path: `blog5BlogList[${i}].attrs.image`,
                      ...props,
                    })}
                  />
                </article>
              ))}
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
