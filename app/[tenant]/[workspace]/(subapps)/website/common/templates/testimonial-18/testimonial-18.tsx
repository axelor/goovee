import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial18Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';

export function Testimonial18(props: TemplateProps<Testimonial18Data>) {
  const {data} = props;
  const {
    testimonial18Image,
    testimonial18SlidesPerView: slidesPerView,
    testimonial18Navigation: navigation,
    testimonial18Testimonials: testimonials = [],
  } = data || {};

  const image = getMetaFileURL({
    metaFile: testimonial18Image,
    path: 'testimonial18Image',
    ...props,
  });

  return (
    <section
      className="wrapper image-wrapper bg-image bg-overlay text-white"
      style={{backgroundImage: `url(${image})`}}>
      <div className="container py-14 py-md-17 text-center">
        <i className="icn-flower text-white fs-30 opacity-50" />
        <div className="row mt-3">
          <div className="col-xl-9 col-xxl-8 mx-auto">
            <div className="swiper-container dots-light dots-closer mb-6">
              <Carousel
                grabCursor
                navigation={navigation || false}
                slidesPerView={slidesPerView || 1}>
                {testimonials?.map(({id, attrs: item}) => (
                  <blockquote className="border-0 fs-24 mb-0" key={id}>
                    <p>“{item.review}”</p>
                    <div className="blockquote-details justify-content-center">
                      <div className="info p-0">
                        <h6 className="mb-0 text-white">{item.name}</h6>
                      </div>
                    </div>
                  </blockquote>
                ))}
              </Carousel>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
