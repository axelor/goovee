'use client';
import type {TemplateProps} from '@/subapps/website/common/types';
import {type Pricing7Data} from './meta';
import {useState} from 'react';
import Switch from '@/subapps/website/common/components/reuseable/Switch';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {PricingCard1} from '@/subapps/website/common/components/reuseable/pricing-cards';

export function Pricing7(props: TemplateProps<Pricing7Data>) {
  const {data} = props;
  const {
    pricing7Title: title,
    pricing7Caption: caption,
    pricing7Description: description,
    pricing7LinkTitle: linkTitle,
    pricing7ButtonLink: buttonLink,
    pricing7ButtonText: buttonText,
    pricing7SwitchLeftLabel: switchLeftLabel,
    pricing7SwitchRightLabel: switchRightLabel,
    pricing7Plans: plans,
    pricing7WrapperClassName: wrapperClassName,
    pricing7ContainerClassName: containerClassName,
  } = data || {};

  const [activeYearly, setActiveYearly] = useState(false);

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gy-6 gy-lg-0">
          <div className="col-lg-4">
            <h2 className="display-5 mt-lg-18 mb-3">{title}</h2>
            <p>{caption}</p>
            <p className="mb-5 lead">
              {description}{' '}
              <NextLink title={linkTitle} href="#" className="hover" />
            </p>

            <NextLink
              href={buttonLink}
              title={buttonText}
              className="btn btn-primary rounded-pill mt-2"
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
