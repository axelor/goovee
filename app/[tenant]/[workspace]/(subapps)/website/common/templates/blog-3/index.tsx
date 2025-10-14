import type {TemplateProps} from '@/subapps/website/common/types';
import {type Blog3Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import BlogCard1 from '@/subapps/website/common/components/reuseable/blog-cards/BlogCard1';
import carouselBreakpoints from '@/subapps/website/common/utils/carouselBreakpoints';

export default function Blog3(props: TemplateProps<Blog3Data>) {
  const {data} = props;
  const {
    blog3Title: title,
    blog3Caption: caption,
    blog3Navigation: navigation,
    blog3BlogList: blogList = [],
    blog3WrapperClassName: wrapperClassName,
    blog3ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row text-center">
          <div className="col-xxl-9 mx-auto">
            <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-9">{title}</h3>
          </div>
        </div>

        <div className="swiper-container blog grid-view mb-18">
          <Carousel
            grabCursor
            navigation={navigation}
            breakpoints={carouselBreakpoints}>
            {blogList?.map(({id, attrs: item}, i) => (
              <BlogCard1
                key={id}
                {...item}
                image={getImage({
                  image: item.image,
                  path: `blog3BlogList[${i}].attrs.image`,
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
