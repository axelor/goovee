import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero17Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import {slideInDownAnimate} from '@/subapps/website/common/utils/animation';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import Image from 'next/image';

export function Hero17(props: TemplateProps<Hero17Data>) {
  const {data} = props;
  const {
    hero17Title: title,
    hero17Caption: caption,
    hero17ButtonLabel1: buttonLabel1,
    hero17ButtonLabel2: buttonLabel2,
    hero17ButtonLink1: buttonLink1,
    hero17ButtonLink2: buttonLink2,
    hero17Image,
    hero17WrapperClassName: wrapperClassName,
    hero17ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: hero17Image,
    path: 'hero17Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row">
          <div className="col-lg-8 col-xxl-7 mx-auto text-center">
            <h2
              className="fs-16 text-uppercase ls-xl text-dark mb-4"
              style={slideInDownAnimate('600ms')}>
              {caption}
            </h2>

            <h1
              className="display-1 fs-55 mb-7"
              style={slideInDownAnimate('900ms')}>
              {title}
            </h1>

            <div className="d-flex justify-content-center mb-5 mb-md-0">
              <span style={slideInDownAnimate('1200ms')}>
                <NextLink
                  title={buttonLabel1}
                  href={buttonLink1}
                  className="btn btn-lg btn-primary rounded-pill me-2"
                />
              </span>

              <span style={slideInDownAnimate('1500ms')}>
                <NextLink
                  title={buttonLabel2}
                  href={buttonLink2}
                  className="btn btn-lg btn-outline-primary rounded-pill"
                />
              </span>
            </div>
          </div>
        </div>
      </div>

      <figure
        className="position-absoute"
        style={{bottom: 0, left: 0, zIndex: 2}}>
        <Image
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
        />
      </figure>
    </section>
  );
}
