import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero8Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
import animation, {
  fadeInAnimate,
  slideInDownAnimate,
} from '@/subapps/website/common/utils/animation';
import IconBox from '@/subapps/website/common/components/reuseable/IconBox';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Hero8(props: TemplateProps<Hero8Data>) {
  const {data} = props;
  const {
    hero8Title: title,
    hero8Description: description,
    hero8ButtonLabel1: buttonLabel1,
    hero8ButtonLabel2: buttonLabel2,
    hero8ButtonLink1: buttonLink1,
    hero8ButtonLink2: buttonLink2,
    hero8Image,
    hero8CountUp: countUp,
    hero8Suffix: suffix,
    hero8Heading: heading,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: hero8Image,
    path: 'hero8Image',
    ...props,
  });

  return (
    <div className="card bg-soft-primary rounded-4 mt-2 mb-13 mb-md-17">
      <div className="card-body p-md-10 py-xl-11 px-xl-15">
        <div className="row gx-lg-8 gx-xl-0 gy-10 align-items-center">
          <div className="col-lg-6 order-lg-2 d-flex position-relative">
            <img
              alt="demo"
              src={image}
              className="img-fluid ms-auto mx-auto me-lg-8"
              style={fadeInAnimate('0ms')}
            />

            <div style={animation({name: 'slideInRight', delay: '600ms'})}>
              <div
                className="card shadow-lg position-absolute"
                style={{bottom: '10%', right: '-3%'}}>
                <div className="card-body py-4 px-5">
                  <div className="d-flex flex-row align-items-center">
                    <div>
                      <IconBox
                        icon="uil-users-alt"
                        className="icon btn btn-circle btn-md btn-soft-primary pe-none mx-auto me-3"
                      />
                    </div>

                    <div>
                      <h3 className="counter mb-0 text-nowrap">
                        <CountUp end={countUp || 0} suffix={suffix} />
                      </h3>
                      <p className="fs-14 lh-sm mb-0 text-nowrap">{heading}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6 text-center text-lg-start">
            <h1 className="display-4 mb-5" style={slideInDownAnimate('600ms')}>
              {title}
            </h1>

            <p
              className="lead fs-lg lh-sm mb-7 pe-xl-10"
              style={slideInDownAnimate('900ms')}>
              {description}
            </p>

            <div className="d-flex justify-content-center justify-content-lg-start">
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
    </div>
  );
}
