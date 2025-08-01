import {FC} from 'react';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
// -------- data -------- //
import {aboutList1} from '@/subapps/website/common/data/about';

const Services17: FC = () => {
  return (
    <section className="wrapper bg-light">
      <div className="container pt-14 pt-md-23 pb-14 pb-md-17">
        <div className="row mb-8 text-center">
          <div className="col-lg-8 col-xl-7 mx-auto">
            <h2 className="fs-16 text-uppercase text-primary mb-3">
              What We Do
            </h2>
            <h3 className="display-4">
              We create spending relaxed so that you can keep fully in charge.
            </h3>
          </div>
        </div>

        <div className="row gx-lg-8 gx-xl-12 gy-10 mb-14 mb-md-17 align-items-center">
          <div className="col-lg-6 position-relative">
            <div
              className="shape bg-dot primary rellax w-17 h-18"
              style={{bottom: '-2rem', left: '-0.7rem'}}
            />

            <figure className="rounded mb-0">
              <img
                src="/img/photos/se3.jpg"
                srcSet="/img/photos/se3@2x.jpg 2x"
                alt=""
              />
            </figure>
          </div>

          <div className="col-lg-6">
            <h3 className="display-6 mb-4">Package Design</h3>
            <p className="mb-5">
              Customers may choose your company because you provide excellent
              customer service that makes them feel valued and appreciated. This
              can include fast response times, personalized attention. Customers
              may choose your company because you provide excellent customer
              service.
            </p>

            <ListColumn list={aboutList1} bulletColor="leaf" />

            <NextLink
              title="More Details"
              href="#"
              className="btn btn-soft-leaf rounded-pill mt-6 mb-0"
            />
          </div>
        </div>

        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-6 order-lg-2 position-relative">
            <div
              className="shape rounded-circle bg-soft-primary rellax w-18 h-18"
              style={{bottom: '-2.5rem', right: '-1.5rem'}}
            />

            <figure className="rounded mb-0">
              <img
                src="/img/photos/se4.jpg"
                srcSet="/img/photos/se4@2x.jpg 2x"
                alt=""
              />
            </figure>
          </div>

          <div className="col-lg-6">
            <h3 className="display-6 mb-4">Corporate Design</h3>
            <p className="mb-5">
              Customers may choose your company because you provide excellent
              customer service that makes them feel valued and appreciated. This
              can include fast response times, personalized attention. Customers
              may choose your company because you provide excellent customer
              service.
            </p>

            <ListColumn list={aboutList1} bulletColor="leaf" />

            <NextLink
              title="More Details"
              href="#"
              className="btn btn-soft-leaf rounded-pill mt-6 mb-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services17;
