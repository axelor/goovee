import {FC} from 'react';
import AccordionList from '@/subapps/website/common/components/common/AccordionList';

const About12: FC = () => {
  return (
    <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center mb-14 mb-md-17">
      <div className="col-lg-7">
        <figure>
          <img
            className="w-auto"
            src="/img/illustrations/i17.png"
            srcSet="/img/illustrations/i17@2x.png 2x"
            alt=""
          />
        </figure>
      </div>

      <div className="col-lg-5">
        <h2 className="fs-15 text-uppercase text-primary mb-3">
          Why Choose Us?
        </h2>
        <h3 className="display-4 mb-7">Discover the Benefits of Choosing Us</h3>
        <AccordionList />
      </div>
    </div>
  );
};

export default About12;
