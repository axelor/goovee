import {FC, Fragment} from 'react';
// -------- data -------- //
import {serviceList10} from '@/subapps/website/common/data/service';

const Services20: FC = () => {
  return (
    <Fragment>
      <div className="row text-center">
        <div className="col-md-10 offset-md-1 col-lg-8 offset-lg-2">
          <h2 className="fs-16 text-uppercase text-gradient gradient-1 mb-3">
            Our Features
          </h2>
          <h3 className="display-4 mb-9 px-xl-14">
            Sandbox is the only app you need to track your goals for better
            health.
          </h3>
        </div>
      </div>

      <div className="row gy-8 mb-17">
        {serviceList10.map(({id, title, description, Icon}) => (
          <div className="col-md-6 col-lg-4" key={id}>
            <div className="d-flex flex-row">
              <div>
                <Icon className="solid icon-svg-sm text-fuchsia me-4" />
              </div>
              <div>
                <h3 className="fs-22 mb-1">{title}</h3>
                <p className="mb-0">{description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Fragment>
  );
};

export default Services20;
