import {FC} from 'react';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
// -------- data -------- //
import {factList} from '@/subapps/website/common/data/demo-12';

const Facts8: FC = () => {
  return (
    <section className="wrapper bg-soft-primary">
      <div className="container py-14 pt-md-15 pb-md-20">
        <div className="row align-items-center gx-lg-8 gx-xl-12 gy-10 gy-lg-0">
          <div className="col-lg-4 text-center text-lg-start">
            <h3 className="display-4 mb-3">
              We feel proud of our achievements.
            </h3>
            <p className="lead fs-lg mb-0">
              Let us handle your business needs while you sit back and relax.
            </p>
          </div>

          <div className="offset-lg-1 col-lg-7 mt-lg-2">
            <div className="row align-items-center counter-wrapper gy-6 text-center">
              {factList.map(({id, number, title, suffix}) => (
                <div className="col-md-4" key={id}>
                  <h3 className="counter">
                    <CountUp end={number} suffix={suffix} />
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

export default Facts8;
