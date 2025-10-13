import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero7Data} from './meta';
import {
  getImage,
  getPaddingBottom,
} from '@/subapps/website/common/utils/helper';
import {
  fadeInAnimate,
  slideInDownAnimate,
  zoomInAnimate,
} from '@/subapps/website/common/utils/animation';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import Image from 'next/image';

export default function Hero7(props: TemplateProps<Hero7Data>) {
  const {data} = props;
  const {
    hero7Title: title,
    hero7Description: description,
    hero7ButtonLabel1: buttonLabel1,
    hero7ButtonLabel2: buttonLabel2,
    hero7ButtonLink1: buttonLink1,
    hero7ButtonLink2: buttonLink2,
    hero7Image,
    hero7WrapperClassName: wrapperClassName,
    hero7ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: hero7Image,
    path: 'hero7Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row text-center">
          <div className="col-lg-9 col-xxl-8 mx-auto">
            <h2 className="display-1 mb-4" style={zoomInAnimate('0ms')}>
              {title}
            </h2>

            <p
              className="lead fs-24 lh-sm px-md-5 px-xl-15 px-xxl-10 mb-7"
              style={zoomInAnimate('500ms')}>
              {description}
            </p>
          </div>
        </div>

        <div className="d-flex justify-content-center">
          <span style={slideInDownAnimate('900ms')}>
            <NextLink
              href={buttonLink1}
              title={buttonLabel1}
              className="btn btn-lg btn-primary rounded-pill mx-1"
            />
          </span>

          <span style={slideInDownAnimate('1200ms')}>
            <NextLink
              href={buttonLink2}
              title={buttonLabel2}
              className="btn btn-lg btn-outline-primary rounded-pill mx-1"
            />
          </span>
        </div>

        <div className="row mt-12" style={fadeInAnimate('1600ms')}>
          <div className="col-lg-8 mx-auto">
            <figure
              className="position-relative"
              style={{paddingBottom: getPaddingBottom(image)}}>
              <Image
                alt={image.alt}
                className="img-fluid object-fit-cover"
                src={image.url}
                fill
              />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
