import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial6Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

export function Testimonial6(props: TemplateProps<Testimonial6Data>) {
  const {data} = props;
  const {
    testimonial6Name: name,
    testimonial6Designation: designation,
    testimonial6Review: review,
    testimonial6Rating: rating,
    testimonial6Image,
    testimonial6WrapperClassName: wrapperClassName = '',
    testimonial6ContainerClassName: containerClassName = '',
  } = data || {};

  const image = getMetaFileURL({
    metaFile: testimonial6Image,
    path: 'testimonial6Image',
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
    <section className={`wrapper ${wrapperClassName}`} data-code={props.code}>
      <div className={`container ${containerClassName}`}>
        <div className="card bg-soft-primary">
          <div className="card-body p-md-10 py-xxl-16 position-relative">
            <div
              className="position-absolute d-none d-lg-block"
              style={{bottom: 0, left: '5%', width: '32%', zIndex: 2}}>
              <figure>
                <img src={image} alt="coriss" />
              </figure>
            </div>

            <div className="row gx-md-0 gx-xl-12 text-center">
              <div className="col-lg-7 offset-lg-5 col-xl-6">
                {rating && ratingMap[rating] && (
                  <span className={`ratings ${ratingMap[rating]} mb-3`} />
                )}

                <blockquote className="border-0  mb-0">
                  <p>{review}</p>

                  <div className="blockquote-details justify-content-center text-center">
                    <div className="info p-0">
                      <h5 className="mb-1">{name}</h5>
                      <div className="meta mb-0">{designation}</div>
                    </div>
                  </div>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
