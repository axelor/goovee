import {FC} from 'react';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

const Contact9: FC = () => {
  return (
    <section
      className="wrapper image-wrapper bg-image bg-overlay"
      style={{backgroundImage: 'url(/img/photos/bg10.jpg)'}}>
      <div className="container py-18">
        <div className="row text-center">
          <div className="col-md-8 col-lg-7 col-xl-5 mx-auto">
            <h2 className="fs-16 text-uppercase text-white mb-3">
              Join Our Community
            </h2>
            <h3 className="display-4 mb-6 text-white px-lg-5 px-xxl-0">
              Trust us, join 10K+ clients to grow your business.
            </h3>

            <NextLink
              title="Join Us"
              href="#"
              className="btn btn-white rounded-pill mb-0 text-nowrap"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact9;
