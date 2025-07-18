import {FC} from 'react';
import {
  slideInDownAnimate,
  zoomInAnimate,
} from '@/subapps/website/common/utils/animation';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

const Hero2: FC = () => {
  return (
    <div className="row gx-lg-0 gx-xl-8 gy-10 gy-md-13 gy-lg-0 mb-7 mb-md-10 mb-lg-16 align-items-center">
      <div
        className="col-md-8 offset-md-2 col-lg-6 offset-lg-1 position-relative order-lg-2"
        style={zoomInAnimate('0ms')}>
        <div
          className="shape bg-dot primary rellax w-17 h-19"
          style={{top: '-1.7rem', left: '-1.5rem'}}
        />
        <div
          className="shape rounded bg-soft-primary rellax d-md-block"
          style={{
            width: '85%',
            height: '90%',
            right: '-0.8rem',
            bottom: '-1.8rem',
          }}
        />

        <figure className="rounded">
          <img
            src="/img/photos/about7.jpg"
            srcSet="/img/photos/about7@2x.jpg 2x"
            alt="hero"
          />
        </figure>
      </div>

      <div className="col-lg-5 mt-lg-n10 text-center text-lg-start">
        <h1 className="display-2 mb-5" style={slideInDownAnimate('600ms')}>
          We create solutions that make our customers lives easier.
        </h1>

        <p
          className="lead fs-22 lh-sm mb-7 px-md-10 px-lg-0"
          style={slideInDownAnimate('900ms')}>
          We offer solutions that cater to your business needs, regardless of
          your growth stage.
        </p>

        <div className="d-flex justify-content-center justify-content-lg-start">
          <span style={slideInDownAnimate('1200ms')}>
            <NextLink
              title="Explore Now"
              href="#"
              className="btn btn-lg btn-primary rounded-pill me-2"
            />
          </span>

          <span style={slideInDownAnimate('1500ms')}>
            <NextLink
              title="Free Trial"
              href="#"
              className="btn btn-lg btn-outline-primary rounded-pill"
            />
          </span>
        </div>
      </div>
    </div>
  );
};

export default Hero2;
