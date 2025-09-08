'use client';
import type {TemplateProps} from '@/subapps/website/common/types';
import {type Pricing8Data} from './meta';
import {Fragment, useState} from 'react';
import Switch from '@/subapps/website/common/components/reuseable/Switch';
import {PricingCard1} from '@/subapps/website/common/components/reuseable/pricing-cards';
import {FAQ5} from '@/subapps/website/common/templates/faq-5';

export function Pricing8(props: TemplateProps<Pricing8Data>) {
  const {data} = props;
  const {
    pricing8Title: title,
    pricing8Caption: caption,
    pricing8SwitchLeftLabel: switchLeftLabel,
    pricing8SwitchRightLabel: switchRightLabel,
    pricing8Plans: plans,
    pricing8Faq: faq,
  } = data || {};

  const [activeYearly, setActiveYearly] = useState(false);

  return (
    <div className="container">
      <Fragment>
        <div className="row text-center">
          <div className="col-md-11 col-lg-9 col-xl-8 mx-auto">
            <h2 className="fs-16 text-uppercase text-muted mb-3">{title}</h2>
            <h3 className="display-4 mb-10 px-xxl-10">{caption}</h3>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-11 mx-auto">
            <div className="pricing-wrapper mb-10 mb-md-14">
              <div className="pricing-switcher-wrapper switcher">
                <p className="mb-0 pe-3">{switchLeftLabel}</p>
                <Switch value={activeYearly} onChange={setActiveYearly} />
                <p className="mb-0 ps-3">{switchRightLabel}</p>
              </div>

              <div className="row gy-6 mt-3 mt-md-5">
                {plans?.map(({id, attrs: item}, i) => (
                  <div
                    className={`col-md-6 col-lg-4 ${i === 1 && 'popular'}`}
                    key={id}>
                    <PricingCard1
                      bulletBg={item.bulletBg}
                      planName={item.plan}
                      monthlyPrice={Number(item.price1)}
                      yearlyPrice={Number(item.price2)}
                      features={item.features?.map(
                        feature => feature.attrs?.label,
                      )}
                      buttonLink={item.buttonLink}
                      buttonText={item.buttonText}
                      activeYearly={activeYearly}
                      roundedButton={item.roundedButton}
                    />
                  </div>
                ))}
              </div>
            </div>

            <FAQ5 {...props} data={{...data, faq5Questions: faq}} />
          </div>
        </div>
      </Fragment>
    </div>
  );
}
