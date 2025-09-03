import {FC} from 'react';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
// -------- data -------- //
import {factList4} from '@/subapps/website/common/data/facts';

const Facts5: FC = () => {
  return (
    <section className="wrapper bg-soft-primary">
      <div className="container py-14 py-md-16">
        <div className="row mb-10">
          <div className="col-xl-10 mx-auto">
            <div className="row align-items-center counter-wrapper gy-6 text-center">
              {factList4.map(({value, title, Icon, id}) => (
                <div className="col-md-3" key={id}>
                  <Icon className="icon-svg-lg text-primary mb-3" />
                  <h3 className="counter">
                    <CountUp end={value} separator="" />
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

export default Facts5;
