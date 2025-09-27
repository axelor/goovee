import type {TemplateProps} from '@/subapps/website/common/types';
import {type Blog1Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import {BlogCard1} from '@/subapps/website/common/components/reuseable/blog-cards';
import carouselBreakpoints from '@/subapps/website/common/utils/carouselBreakpoints';

export function Blog1(props: TemplateProps<Blog1Data>) {
  const {data} = props;
  const {
    blog1Caption: caption,
    blog1Title: title,
    blog1BlogList: blogList,
  } = data || {};

  return (
    <section className="wrapper bg-light angled upper-end">
      <div className="container py-14 py-md-16">
        <div className="row">
          <div className="col-lg-9 col-xl-8">
            <h2 className="fs-16 text-uppercase text-line text-primary mb-3">
              {caption}
            </h2>
            <h3
              className="display-5 mb-9"
              dangerouslySetInnerHTML={{__html: title ?? ''}}
            />
          </div>
        </div>

        <div className="swiper-container blog grid-view mb-10">
          <Carousel
            grabCursor
            navigation={false}
            breakpoints={carouselBreakpoints}>
            {blogList?.map(({id, attrs: item}, i) => (
              <BlogCard1
                key={id}
                {...item}
                image={getMetaFileURL({
                  metaFile: item.image,
                  path: `blog1BlogList[${i}].attrs.image`,
                  ...props,
                })}
              />
            )) ?? []}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
