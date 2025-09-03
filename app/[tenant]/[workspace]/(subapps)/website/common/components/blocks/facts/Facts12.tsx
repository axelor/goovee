import {FC} from 'react';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';

const Facts12: FC = () => {
  return (
    <div className="container-card">
      <div
        className="card image-wrapper bg-full bg-image bg-overlay bg-overlay-light-500 pb-15"
        style={{backgroundImage: 'url(/img/photos/bg22.png)'}}>
        <div className="card-body py-14 px-0">
          <div className="container">
            <div className="row align-items-center gx-lg-8 gx-xl-12 gy-10 gy-lg-0">
              <div className="col-lg-4 text-center text-lg-start">
                <h3 className="display-4 mb-3">
                  We feel proud of our achievements.
                </h3>
                <p className="lead fs-lg mb-0">
                  We bring solutions to make life easier for our customers.
                </p>
              </div>

              <div className="col-lg-8 mt-lg-2">
                <div className="row align-items-center counter-wrapper gy-6 text-center">
                  <div className="col-md-4">
                    <h3 className="counter">
                      <CountUp end={10} suffix="K+" />
                    </h3>
                    <p className="mb-0">Completed Projects</p>
                  </div>

                  <div className="col-md-4">
                    <h3 className="counter">
                      <CountUp end={5} suffix="K+" />
                    </h3>
                    <p className="mb-0">Happy Clients</p>
                  </div>

                  <div className="col-md-4">
                    <h3 className="counter">
                      <CountUp end={265} suffix="+" />
                    </h3>
                    <p className="mb-0">Awards Won</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Facts12;
