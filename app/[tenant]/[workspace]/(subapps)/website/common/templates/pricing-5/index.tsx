'use client';
import type {TemplateProps} from '@/subapps/website/common/types';
import {type Pricing5Data} from './meta';
import {useState} from 'react';
import Switch from '@/subapps/website/common/components/reuseable/Switch';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import PricingCard1 from '@/subapps/website/common/components/reuseable/pricing-cards/PricingCard1';

export default function Pricing5(props: TemplateProps<Pricing5Data>) {
  const {data} = props;
  const {
    pricing5Title: title,
    pricing5Description: description,
    pricing5LinkTitle: linkTitle,
    pricing5ButtonLink: buttonLink,
    pricing5ButtonText: buttonText,
    pricing5SwitchLeftLabel: switchLeftLabel,
    pricing5SwitchRightLabel: switchRightLabel,
    pricing5Plans: plans,
    pricing5WrapperClassName: wrapperClassName,
    pricing5ContainerClassName: containerClassName,
  } = data || {};

  const [activeYearly, setActiveYearly] = useState(false);

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gy-6 align-items-center">
          <div className="col-lg-5">
            <h3 className="display-4 mb-5">{title}</h3>
            <p className="lead fs-lg mb-5">
              {description} <span className="underline">{linkTitle}</span>
            </p>

            <NextLink
              href={buttonLink}
              title={buttonText}
              className="btn btn-primary rounded-pill mt-2"
            />
          </div>

          <div className="col-lg-7  pricing-wrapper">
            <div className="pricing-switcher-wrapper switcher justify-content-start justify-content-lg-end">
              <p className="mb-0 pe-3">{switchLeftLabel}</p>
              <Switch value={activeYearly} onChange={setActiveYearly} />
              <p className="mb-0 ps-3">{switchRightLabel}</p>
            </div>

            <div className="row gy-6 mt-5">
              {plans?.map(({id, attrs: item}, i) => (
                <div className={`col-md-6 ${i === 1 && 'popular'}`} key={id}>
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
        </div>
      </div>
    </section>
  );
}
