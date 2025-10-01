import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial19Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import carouselBreakpoints from '@/subapps/website/common/utils/carouselBreakpoints';

export function Testimonial19(props: TemplateProps<Testimonial19Data>) {
  const {data} = props;
  const {
    testimonial19Image,
    testimonial19Caption: caption,
    testimonial19Navigation: navigation,
    testimonial19SpaceBetween: spaceBetween,
    testimonial19Testimonials: testimonials = [],
    testimonial19WrapperClassName: wrapperClassName,
    testimonial19ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: testimonial19Image,
    path: 'testimonial19Image',
    ...props,
  });

  const ratingMap: {[key: number]: string} = {
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
  };

  return (
    <section
      className={wrapperClassName}
      style={{backgroundImage: `url(${image})`}}>
      <div className={containerClassName}>
        <h2 className="display-5 mb-4 text-center text-white">{caption}</h2>

        <div className="swiper-container dots-closer dots-light dots-light-75">
          <Carousel
            grabCursor
            spaceBetween={spaceBetween || 0}
            navigation={navigation}
            breakpoints={carouselBreakpoints}>
            {testimonials?.map(({id, attrs: item}) => (
              <div className="item-inner" key={id}>
                <div className="card border-0 bg-white-900">
                  <div className="card-body">
                    {item.rating && ratingMap[item.rating] && (
                      <span
                        className={`ratings ${ratingMap[item.rating]} mb-3`}
                      />
                    )}
                    <blockquote className="border-0 mb-0">
                      <p>“{item.review}”</p>
                      <div className="blockquote-details">
                        <div className="info p-0">
                          <h5 className="mb-0">{item.name}</h5>
                          <p className="mb-0">{item.designation}</p>
                        </div>
                      </div>
                    </blockquote>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
