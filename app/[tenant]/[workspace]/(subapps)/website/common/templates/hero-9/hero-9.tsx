import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero9Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {Typewriter} from '@/subapps/website/common/components/reuseable/typewriter';
import {
  slideInDownAnimate,
  zoomInAnimate,
} from '@/subapps/website/common/utils/animation';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Hero9(props: TemplateProps<Hero9Data>) {
  const {data} = props;
  const {
    hero9Title: title,
    hero9Description: description,
    hero9ButtonLabel1: buttonLabel1,
    hero9ButtonLabel2: buttonLabel2,
    hero9ButtonLink1: buttonLink1,
    hero9ButtonLink2: buttonLink2,
    hero9Image,
    hero9Typewriter: typewriter,
    hero9WrapperClassName: wrapperClassName,
    hero9ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: hero9Image,
    path: 'hero9Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-md-10 offset-md-1 offset-lg-0 col-lg-5 mt-lg-n2 text-center text-lg-start order-2 order-lg-0">
            <h1
              className="display-1 mb-5 mx-md-10 mx-lg-0"
              style={slideInDownAnimate('600ms')}>
              {title} <br />
              <span className="typer text-primary text-nowrap">
                <Typewriter
                  options={{
                    loop: true,
                    autoStart: true,
                    strings: typewriter?.map(item => item.attrs.text) ?? [],
                  }}
                />
              </span>
            </h1>

            <p className="lead fs-lg mb-7" style={slideInDownAnimate('900ms')}>
              {description}
            </p>

            <div className="d-flex justify-content-center justify-content-lg-start">
              <span style={slideInDownAnimate('1200ms')}>
                <NextLink
                  title={buttonLabel1}
                  href={buttonLink1}
                  className="btn btn-lg btn-primary rounded me-2"
                />
              </span>

              <span style={slideInDownAnimate('1500ms')}>
                <NextLink
                  title={buttonLabel2}
                  href={buttonLink2}
                  className="btn btn-lg btn-green rounded"
                />
              </span>
            </div>
          </div>

          <div className="col-lg-7">
            <img
              className="w-100 img-fluid"
              src={image}
              alt="demo"
              style={zoomInAnimate('0ms')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
