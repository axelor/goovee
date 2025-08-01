import {FC} from 'react';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

const Hero14: FC = () => {
  return (
    <section className="wrapper bg-soft-primary">
      <div className="container pt-10 pt-md-14 pb-14 pb-md-0">
        <div className="row gx-md-8 gx-lg-12 gy-3 gy-lg-0 mb-13">
          <div className="col-lg-6">
            <h1 className="display-1 fs-66 lh-xxs mb-0">
              We provide rapid solutions for your company.
            </h1>
          </div>

          <div className="col-lg-6">
            <p className="lead fs-23 my-3">
              We work as an outstanding identity-designing company that feels
              the strength of innovative thinking.
            </p>

            <NextLink title="Learn More" href="#" className="more hover" />
          </div>
        </div>

        <div className="position-relative">
          <div
            className="shape bg-dot primary rellax w-17 h-21"
            style={{top: '-2.5rem', right: '-2.7rem'}}
          />

          <figure className="rounded mb-md-n20">
            <img
              src="/img/photos/about18.jpg"
              srcSet="/img/photos/about18@2x.jpg 2x"
              alt=""
            />
          </figure>
        </div>
      </div>
    </section>
  );
};

export default Hero14;
