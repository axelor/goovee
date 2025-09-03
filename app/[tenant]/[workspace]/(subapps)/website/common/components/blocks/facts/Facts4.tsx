import {FC} from 'react';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
// -------- data -------- //
import {factList3} from '@/subapps/website/common/data/facts';

const Facts4: FC = () => {
  return (
    <section
      className="wrapper image-wrapper bg-auto no-overlay bg-image text-center bg-map"
      style={{backgroundImage: 'url(/img/map.png)'}}>
      <div className="container pt-0 pb-14 pt-md-16 pb-md-18">
        <div className="row">
          <div className="col-md-8 col-xl-7 col-xxl-6 mx-auto">
            <h2 className="fs-15 text-uppercase text-muted mb-3">
              Join Our Community
            </h2>
            <h3 className="display-4 mb-8 px-lg-12">
              Trust us, join 10K+ clients to grow your business.
            </h3>
          </div>
        </div>

        <div className="row">
          <div className="col-md-10 col-lg-9 col-xl-7 mx-auto">
            <div className="row align-items-center counter-wrapper gy-4 gy-md-0">
              {factList3.map(({id, title, value}) => (
                <div className="col-md-4 text-center" key={id}>
                  <h3 className="counter counter-lg text-primary">
                    <CountUp end={value} separator="" suffix="K+" />
                  </h3>
                  <p>{title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Facts4;
