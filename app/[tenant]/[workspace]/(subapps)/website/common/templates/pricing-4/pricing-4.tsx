import type {TemplateProps} from '@/subapps/website/common/types';
import {type Pricing4Data} from './meta';
import {Pricing2} from '../pricing-2';

export function Pricing4(props: TemplateProps<Pricing4Data>) {
  const {data} = props;
  const {
    pricing4Title: title,
    pricing4SwitchLeftLabel: switchLeftLabel,
    pricing4SwitchRightLabel: switchRightLabel,
    pricing4Plans: plans,
  } = data || {};

  return (
    <div>
      <div className="wrapper bg-soft-primary">
        <div className="container pt-14 pb-18 pt-md-17 pb-md-22 text-center">
          <div className="row">
            <div className="col-lg-10 col-xl-9 col-xxl-8 mx-auto">
              <h3 className="display-4 mb-15 mb-md-6 ">{title}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="wrapper bg-light">
        <div className="container py-14 py-md-16">
          <Pricing2
            {...props}
            data={{
              ...data,
              pricing2SwitchLeftLabel: switchLeftLabel,
              pricing2SwitchRightLabel: switchRightLabel,
              pricing2Plans: plans,
            }}
          />
        </div>
      </div>
    </div>
  );
}
