import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial2Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import {TestimonialCard2} from '@/subapps/website/common/components/reuseable/testimonial-cards';

export function Testimonial2(props: TemplateProps<Testimonial2Data>) {
  const {data} = props;
  const {testimonial2Image, testimonial2Testimonials: testimonials = []} =
    data || {};

  const image = getMetaFileURL({
    metaFile: testimonial2Image,
    path: 'testimonial2Image',
    ...props,
  });
  return (
    <div className="container">
      <div className="position-relative mt-n18 mt-md-n23 mb-16 mb-md-18">
        <div
          className="shape rounded-circle bg-line primary rellax w-18 h-18"
          style={{zIndex: 0, top: '-2rem', right: '-2.7rem'}}
        />

        <div
          className="shape rounded-circle bg-soft-primary rellax w-18 h-18"
          style={{zIndex: 0, left: '-3rem', bottom: '-1rem'}}
        />

        <div className={`card shadow-lg`}>
          <div className="row gx-0">
            <div
              style={{backgroundImage: `url(${image}`}}
              className="col-lg-6 image-wrapper bg-image bg-cover rounded-top rounded-lg-start"
            />

            <div className="col-lg-6">
              <div className={'p-10 p-md-11 p-lg-13'}>
                <div className="swiper-container dots-closer mb-4">
                  <Carousel grabCursor slidesPerView={1} navigation={false}>
                    {testimonials.map(({id, attrs: item}) => (
                      <TestimonialCard2
                        key={id}
                        review={item.review}
                        designation={item.designation}
                        name={item.name}
                      />
                    ))}
                  </Carousel>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
