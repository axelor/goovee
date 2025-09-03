import {FC} from 'react';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';

const Facts17: FC = () => {
  return (
    <section className="wrapper bg-gray position-relative min-vh-60 d-lg-flex align-items-center">
      <div
        className="col-lg-6 position-lg-absolute top-0 end-0 image-wrapper bg-image bg-cover h-100"
        style={{backgroundImage: 'url(/img/photos/bg39.jpg)'}}>
        <div className="divider text-gray divider-v-start d-none d-lg-block">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 1200">
            <g />
            <g>
              <g>
                <polygon
                  fill="currentColor"
                  points="6 0 0 0 0 1200 6 1200 54 0 6 0"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>

      <div className="container">
        <div className="row gx-0">
          <div className="col-lg-6">
            <div className="pt-13 pb-15 pb-md-17 py-lg-16 pe-lg-15">
              <h2 className="fs-16 text-uppercase text-muted mb-3">
                Our Solutions
              </h2>
              <h3 className="display-3 ls-sm mb-5">
                Just sit & relax while we take care of your business needs.
              </h3>
              <p className="mb-6">
                Cum sociis natoque penatibus et magnis dis parturient montes,
                nascetur ridiculus mus. Cras justo odio, dapibus ac facilisis
                in, egestas eget quam. Praesent commodo cursus. Maecenas sed
                diam eget risus varius blandit sit amet non magna. Praesent
                commodo cursus magna.
              </p>
              <div className="row align-items-center counter-wrapper gy-6">
                <div className="col-md-6">
                  <h3 className="counter counter-lg mb-1">
                    <CountUp end={99} suffix="%" />
                  </h3>
                  <h6 className="fs-17 mb-1">Customer Satisfaction</h6>
                  <span className="ratings five" />
                </div>

                <div className="col-md-6">
                  <h3 className="counter counter-lg mb-1">
                    <CountUp end={4} suffix="x" />
                  </h3>
                  <h6 className="fs-17 mb-1">New Visitors</h6>
                  <span className="ratings five" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Facts17;
