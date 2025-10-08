import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial18Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';

export function Testimonial18(props: TemplateProps<Testimonial18Data>) {
  const {data} = props;
  const {
    testimonial18Image,
    testimonial18SlidesPerView: slidesPerView,
    testimonial18Navigation: navigation,
    testimonial18Testimonials: testimonials = [],
    testimonial18WrapperClassName: wrapperClassName,
    testimonial18ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: testimonial18Image,
    path: 'testimonial18Image',
    ...props,
  });

  return (
    <section
      className={wrapperClassName}
      data-code={props.code}
      style={{backgroundImage: `url(${image.url})`}}>
      <div className={containerClassName}>
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
