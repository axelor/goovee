'use client';
import type {TemplateProps} from '@/subapps/website/common/types';
import {type Pricing2Data} from './meta';
import {useState} from 'react';
import Switch from '@/subapps/website/common/components/reuseable/Switch';
import PricingCard2 from '@/subapps/website/common/components/reuseable/pricing-cards/PricingCard2';

export default function Pricing2(props: TemplateProps<Pricing2Data>) {
  const {data} = props;
  const {
    pricing2SwitchLeftLabel: switchLeftLabel,
    pricing2SwitchRightLabel: switchRightLabel,
    pricing2Plans: plans,
    pricing2WrapperClassName: wrapperClassName,
  } = data || {};

  const [activeYearly, setActiveYearly] = useState(false);

  return (
    <div className={wrapperClassName}>
      <div
        className="shape bg-dot primary rellax w-16 h-18"
        style={{top: '2rem', right: '-2.4rem'}}
      />
      <div
        className="shape rounded-circle bg-line red rellax w-18 h-18 d-none d-lg-block"
        style={{bottom: '0.5rem', left: '-2.5rem'}}
      />

      <div className="pricing-switcher-wrapper switcher">
        <p className="mb-0 pe-3">{switchLeftLabel}</p>
        <Switch value={activeYearly} onChange={setActiveYearly} />
        <p className="mb-0 ps-3">{switchRightLabel}</p>
      </div>

      <div className="row gy-6 mt-3 mt-md-5">
        {plans?.map(({id, attrs: item}, i) => {
          return (
            <div
              className={`col-md-6 col-lg-4 ${i === 1 && 'popular'}`}
              key={id}>
              <PricingCard2
                planName={item.plan}
                monthlyPrice={Number(item.price1)}
                yearlyPrice={Number(item.price2)}
                features={item.features?.map(feature => feature.attrs?.label)}
                buttonLink={item.buttonLink}
                buttonText={item.buttonText}
                activeYearly={activeYearly}
                roundedButton
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
