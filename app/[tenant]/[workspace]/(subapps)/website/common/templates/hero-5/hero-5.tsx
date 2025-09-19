import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero5Data} from './meta';
import {slideInDownAnimate} from '@/subapps/website/common/utils/animation';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Hero5(props: TemplateProps<Hero5Data>) {
  const {data} = props;
  const {
    hero5Title: title,
    hero5Description: description,
    hero5ButtonLabel1: buttonLabel1,
    hero5ButtonLabel2: buttonLabel2,
    hero5ButtonLink1: buttonLink1,
    hero5ButtonLink2: buttonLink2,
  } = data || {};

  return (
    <section className="wrapper bg-soft-primary">
      <div className="container pt-10 pb-15 pt-md-14 pb-md-20 text-center">
        <div className="row">
          <div className="col-md-10 col-lg-8 col-xl-8 col-xxl-7 mx-auto mb-13">
            <h1 className="display-1 mb-4" style={slideInDownAnimate('0ms')}>
              {title}
            </h1>

            <p
              className="lead fs-lg px-xl-12 px-xxl-4 mb-7"
              style={slideInDownAnimate('300ms')}>
              {description}
            </p>

            <div
              className="d-flex justify-content-center"
              style={slideInDownAnimate('600ms')}>
              <span style={slideInDownAnimate('900ms')}>
                <NextLink
                  href={buttonLink1}
                  title={buttonLabel1}
                  className="btn btn-primary rounded mx-1"
                />
              </span>

              <span style={slideInDownAnimate('1200ms')}>
                <NextLink
                  href={buttonLink2}
                  title={buttonLabel2}
                  className="btn btn-green rounded mx-1"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
