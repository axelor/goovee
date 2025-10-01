import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero4Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {slideInDownAnimate} from '@/subapps/website/common/utils/animation';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Hero4(props: TemplateProps<Hero4Data>) {
  const {data} = props;
  const {
    hero4Title: title,
    hero4Description: description,
    hero4ButtonLabel1: buttonLabel1,
    hero4ButtonLabel2: buttonLabel2,
    hero4ButtonLink1: buttonLink1,
    hero4ButtonLink2: buttonLink2,
    hero4Image,
    hero4WrapperClassName: wrapperClassName,
    hero4ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: hero4Image,
    path: 'hero4Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div
        style={{backgroundImage: `url(${image})`}}
        className="rounded-4-lg-start col-lg-6 order-lg-2 position-lg-absolute top-0 end-0 image-wrapper bg-image bg-cover h-100 min-vh-50"
      />

      <div className={containerClassName}>
        <div className="row">
          <div className="col-lg-6">
            <div className="mt-10 mt-md-11 mt-lg-n10 px-10 px-md-11 ps-lg-0 pe-lg-13 text-center text-lg-start">
              <h1
                className="display-2 mb-5"
                style={slideInDownAnimate('600ms')}>
                {title}
              </h1>
              <p
                className="lead fs-23 lh-sm mb-7 pe-md-10"
                style={slideInDownAnimate('900ms')}>
                {description}
              </p>

              <div
                className="d-flex justify-content-center justify-content-lg-start"
                style={slideInDownAnimate('900ms')}>
                <span style={slideInDownAnimate('1200ms')}>
                  <NextLink
                    href={buttonLink1}
                    title={buttonLabel1}
                    className="btn btn-lg btn-primary rounded-pill me-2"
                  />
                </span>

                <span style={slideInDownAnimate('1500ms')}>
                  <NextLink
                    href={buttonLink2}
                    title={buttonLabel2}
                    className="btn btn-lg btn-outline-primary rounded-pill"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
