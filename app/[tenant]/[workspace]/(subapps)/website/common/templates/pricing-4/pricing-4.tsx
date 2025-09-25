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
    pricing4WrapperClassName: wrapperClassName = '',
    pricing4InnerWrapper1ClassName: innerWrapper1ClassName = 'bg-soft-primary',
    pricing4InnerContainer1ClassName:
      innerContainer1ClassName = 'pt-14 pb-18 pt-md-17 pb-md-22 text-center',
    pricing4InnerWrapper2ClassName: innerWrapper2ClassName = ' bg-light',
    pricing4InnerContainer2ClassName:
      innerContainer2ClassName = 'py-14 py-md-16',
    pricing4PricingWrapperClassName:
      pricingWrapperClassName = 'mt-n22 mt-md-n24',
  } = data || {};

  return (
    <section className={wrapperClassName}>
      <div className={`wrapper ${innerWrapper1ClassName}`}>
        <div className={`container ${innerContainer1ClassName}`}>
          <div className="row">
            <div className="col-lg-10 col-xl-9 col-xxl-8 mx-auto">
              <h3 className="display-4 mb-15 mb-md-6 ">{title}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className={`wrapper ${innerWrapper2ClassName}`}>
        <div className={`container ${innerContainer2ClassName}`}>
          <Pricing2
            {...props}
            data={{
              ...data,
              pricing2SwitchLeftLabel: switchLeftLabel,
              pricing2SwitchRightLabel: switchRightLabel,
              pricing2Plans: plans,
              pricing2WrapperClassName: pricingWrapperClassName,
            }}
          />
        </div>
      </div>
    </section>
  );
}
