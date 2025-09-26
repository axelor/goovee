import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial13Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import FigureImage from '@/subapps/website/common/components/reuseable/FigureImage';

export function Testimonial13(props: TemplateProps<Testimonial13Data>) {
  const {data} = props;
  const {
    testimonial13Caption: caption,
    testimonial13Image,
    testimonial13SlidesPerView: slidesPerView,
    testimonial13Navigation: navigation,
    testimonial13Testimonials: testimonials = [],
    testimonial13WrapperClassName: wrapperClassName,
    testimonial13ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: testimonial13Image,
    path: 'testimonial13Image',
    ...props,
  });

  return (
    <section
      className={wrapperClassName}
      style={{backgroundImage: `url(${image})`}}>
      <div className={containerClassName}>
        <h2 className="display-4 mb-5 text-white text-center">{caption}</h2>

        <div className="row">
          <div className="col-md-10 col-lg-8 mx-auto">
            <div className="swiper-container dots-light dots-closer text-center mb-6">
              <Carousel
                slidesPerView={slidesPerView || 1}
                navigation={navigation || false}
                grabCursor>
                {testimonials?.map(({id, attrs: item}, i) => (
                  <blockquote className="border-0 fs-lg mb-0" key={id}>
                    <p>“{item.review}”</p>
                    <div className="blockquote-details justify-content-center">
                      <FigureImage
                        width={100}
                        height={100}
                        src={getMetaFileURL({
                          metaFile: item.image,
                          path: `testimonial13Testimonials[${i}].attrs.image`,
                          ...props,
                        })}
                        className="rounded-circle w-12 overflow-hidden"
                      />
                      <div className="info">
                        <h6 className="mb-1 text-white">{item.name}</h6>
                        <p className="mb-0">{item.designation}</p>
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
