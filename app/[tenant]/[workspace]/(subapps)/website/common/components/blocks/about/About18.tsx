import {FC} from 'react';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
import CloudGroup from '@/subapps/website/common/icons/solid-duo/CloudGroup';

const About18: FC = () => {
  return (
    <div className="row gx-md-8 gy-10 align-items-center">
      <div className="col-lg-6 offset-lg-1 order-lg-2 position-relative">
        <figure className="rounded">
          <img
            className="img-fluid"
            src="/img/photos/about27.jpg"
            srcSet="/img/photos/about27@2x.jpg 2x"
            alt=""
          />
        </figure>

        <div
          className="card shadow-lg position-absolute d-none d-md-block"
          style={{top: '15%', left: '-7%'}}>
          <div className="card-body py-4 px-5">
            <div className="d-flex flex-row align-items-center">
              <div>
                <CloudGroup />
              </div>
              <div>
                <h3 className="fs-25 counter mb-0 text-nowrap">
                  <CountUp end={15} suffix="K+" />
                </h3>
                <p className="fs-16 lh-sm mb-0 text-nowrap">Happy Clients</p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="card shadow-lg position-absolute text-center d-none d-md-block"
          style={{bottom: '10%', left: '-10%'}}>
          <div className="card-body p-6">
            <div
              className="progressbar semi-circle fuchsia mb-3"
              data-value="80"
            />
            <h4 className="mb-0">Time Saved</h4>
          </div>
        </div>
      </div>

      <div className="col-lg-5">
        <h2 className="fs-16 text-uppercase text-gradient gradient-1 mb-3">
          What Makes Us Different?
        </h2>
        <h3 className="display-5 mb-4 me-lg-n5">
          We take the stress out of using it so that you can be full charge.
        </h3>
        <p className="mb-6">
          A community refers to a group of people who share common interests,
          beliefs, values, or goals and interact with one another in a shared
          location or virtual space. Goals and interact with one another in a
          shared location or virtual space.
        </p>

        <ul className="icon-list bullet-bg bullet-soft-primary">
          <li>
            <i className="uil uil-check" />
            Customers may choose company quality product.
          </li>

          <li>
            <i className="uil uil-check" />
            Customers may choose company quality product.
          </li>

          <li>
            <i className="uil uil-check" />
            Customers may choose company quality product.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default About18;
