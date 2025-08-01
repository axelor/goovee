import {FC} from 'react';
import IconBox from '@/subapps/website/common/components/reuseable/IconBox';
import {Counter3} from '@/subapps/website/common/components/reuseable/counter';
// -------- data -------- //
import {factList8} from '@/subapps/website/common/data/facts';

const Facts15: FC = () => {
  return (
    <div className="row gx-lg-8 gx-xl-12 gy-10 gy-lg-0 mb-11">
      <div className="col-lg-4 text-center text-lg-start">
        <h2 className="fs-16 text-uppercase text-primary mb-3">
          Company Facts
        </h2>
        <h3 className="display-3 mb-4 pe-xxl-5">
          We feel proud of our achievements.
        </h3>
        <p className="mb-0 pe-xxl-11">
          We bring solutions to make life easier for our customers.
        </p>
      </div>

      <div className="col-lg-8 mt-lg-2">
        <div className="row align-items-center counter-wrapper gy-6 text-center">
          {factList8.map(({id, icon, ...item}) => (
            <Counter3
              {...item}
              key={id}
              Icon={
                <IconBox
                  className="icon btn btn-circle btn-lg btn-soft-primary pe-none mb-4"
                  icon={icon}
                />
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Facts15;
