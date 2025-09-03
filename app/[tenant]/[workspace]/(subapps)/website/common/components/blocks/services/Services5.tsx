import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
import {FC, Fragment} from 'react';
import {Tiles1} from '@/subapps/website/common/components/elements/tiles';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
import {ServiceCard3} from '@/subapps/website/common/components/reuseable/service-cards';
// -------- data -------- //
import {aboutList6} from '@/subapps/website/common/data/about';
import {serviceList4} from '@/subapps/website/common/data/service';

const Services5: FC = () => {
  return (
    <Fragment>
      <div className="row gx-lg-8 gx-xl-12 gy-12 align-items-center mb-10 mb-md-13">
        <div className="col-lg-6 position-relative">
          <div
            className="btn btn-circle btn-primary pe-none position-absolute counter-wrapper flex-column d-none d-md-flex"
            style={{
              zIndex: 1,
              top: '50%',
              width: 170,
              height: 170,
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}>
            <h3 className="text-white mb-1 mt-n2">
              <span className="counter counter-lg">
                <CountUp end={20} suffix="+" />
              </span>
            </h3>

            <p>Year Experience</p>
          </div>

          <Tiles1 />
        </div>

        <div className="col-lg-6">
          <h3 className="display-4 mb-5">
            Our goal is to develop solutions that make our clients&apos; life
            easier.
          </h3>

          <p className="mb-7">
            Customers may choose your company because you provide excellent
            customer service that makes them feel valued and appreciated. This
            can include fast response times, personalized attention.
          </p>

          <ListColumn list={aboutList6} />
        </div>
      </div>

      <div className="row gx-lg-8 gx-xl-12 gy-8">
        {serviceList4.map(({Icon, ...item}) => (
          <div className="col-md-6 col-lg-4" key={item.id}>
            <ServiceCard3
              {...item}
              Icon={<Icon className="solid text-violet icon-svg-sm me-4" />}
            />
          </div>
        ))}
      </div>
    </Fragment>
  );
};

export default Services5;
