import {FC} from 'react';
import {ServiceCard3} from '@/subapps/website/common/components/reuseable/service-cards';
// -------- data -------- //
import {aboutList4} from '@/subapps/website/common/data/about';

const About20: FC = () => {
  return (
    <div className="row gy-10 gy-sm-13 gx-md-8 gx-xl-12 align-items-center mt-15">
      <div className="col-lg-6">
        <div className="row gx-md-5 gy-5">
          <div className="col-12">
            <figure className="rounded mx-md-5">
              <img
                src="/img/photos/g8.jpg"
                srcSet="/img/photos/g8@2x.jpg 2x"
                alt=""
              />
            </figure>
          </div>

          <div className="col-md-6">
            <figure className="rounded">
              <img
                src="/img/photos/g9.jpg"
                srcSet="/img/photos/g9@2x.jpg 2x"
                alt=""
              />
            </figure>
          </div>

          <div className="col-md-6">
            <figure className="rounded">
              <img
                src="/img/photos/g10.jpg"
                srcSet="/img/photos/g10@2x.jpg 2x"
                alt=""
              />
            </figure>
          </div>
        </div>
      </div>

      <div className="col-lg-6">
        <h2 className="fs-16 text-uppercase text-muted mb-3">
          What Makes Us Different?
        </h2>
        <h3 className="display-3 mb-8">
          We provide <span className="underline-3 style-2 yellow">ideas</span>{' '}
          for creating the lives of our clients easier.
        </h3>

        <div className="row gy-6">
          {aboutList4.map(({id, Icon, ...item}) => (
            <div className="col-md-6" key={id}>
              <ServiceCard3
                {...item}
                Icon={<Icon className="icon-svg-xs solid text-fuchsia me-4" />}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About20;
