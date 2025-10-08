import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero12Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import {slideInDownAnimate} from '@/subapps/website/common/utils/animation';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import Image from 'next/image';

export function Hero12(props: TemplateProps<Hero12Data>) {
  const {data} = props;
  const {
    hero12Title: title,
    hero12Description: description,
    hero12ButtonLabel1: buttonLabel1,
    hero12ButtonLabel2: buttonLabel2,
    hero12ButtonLink1: buttonLink1,
    hero12ButtonLink2: buttonLink2,
    hero12Image,
    hero12WrapperClassName: wrapperClassName,
    hero12ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: hero12Image,
    path: 'hero12Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 mb-5 align-items-center">
          <div className="col-md-10 offset-md-1 offset-lg-0 col-lg-5 text-center text-lg-start order-2 order-lg-0">
            <h1
              className="display-1 mb-5 mx-md-n5 mx-lg-0"
              style={slideInDownAnimate('600ms')}>
              {title}
            </h1>

            <p className="lead fs-lg mb-7" style={slideInDownAnimate('900ms')}>
              {description}
            </p>

            <div className="d-flex justify-content-center justify-content-lg-start">
              <span style={slideInDownAnimate('1200ms')}>
                <NextLink
                  href={buttonLink1}
                  title={buttonLabel1}
                  className="btn btn-primary rounded me-2"
                />
              </span>

              <span style={slideInDownAnimate('1500ms')}>
                <NextLink
                  href={buttonLink2}
                  title={buttonLabel2}
                  className="btn btn-yellow rounded"
                />
              </span>
            </div>
          </div>

          <div className="col-lg-7" style={slideInDownAnimate('0ms')}>
            <figure>
              <Image
                className="w-auto"
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
              />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
