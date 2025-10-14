'use client';
import type {TemplateProps} from '@/subapps/website/common/types';
import {type Pricing6Data} from './meta';
import {useState} from 'react';
import Switch from '@/subapps/website/common/components/reuseable/Switch';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import PricingCard1 from '@/subapps/website/common/components/reuseable/pricing-cards/PricingCard1';

export default function Pricing6(props: TemplateProps<Pricing6Data>) {
  const {data} = props;
  const {
    pricing6Title: title,
    pricing6Caption: caption,
    pricing6Description: description,
    pricing6LinkTitle: linkTitle,
    pricing6ButtonLink: buttonLink,
    pricing6ButtonText: buttonText,
    pricing6SwitchLeftLabel: switchLeftLabel,
    pricing6SwitchRightLabel: switchRightLabel,
    pricing6Plans: plans,
    pricing6WrapperClassName: wrapperClassName,
    pricing6ContainerClassName: containerClassName,
  } = data || {};

  const [activeYearly, setActiveYearly] = useState(false);

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gy-6 align-items-center">
          <div className="col-lg-4">
            <h2 className="fs-15 text-uppercase text-muted mb-3">{title}</h2>
            <h3 className="display-5 mb-5">{caption}</h3>

            <p className="mb-5">
              {description}{' '}
              <NextLink title={linkTitle} href="#" className="hover" />
            </p>

            <NextLink
              href={buttonLink}
              title={buttonText}
              className="btn btn-primary rounded mt-2"
            />
          </div>

          <div className="col-lg-7 offset-lg-1 pricing-wrapper">
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
