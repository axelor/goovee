'use client';
import {useState} from 'react';
import Switch from '@/subapps/website/common/components/reuseable/Switch';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {PricingCard1} from '@/subapps/website/common/components/reuseable/pricing-cards';

// -------- data -------- //
import {TemplateProps} from '@/subapps/website/common/types';

import type {Pricing1Data} from './meta';

export function Pricing1(props: TemplateProps<Pricing1Data>) {
  const {data} = props;
  const {
    pricing1RoundShape: roundShape,
    pricing1Title: title,
    pricing1Caption: caption,
    pricing1Description: description,
    pricing1SwitchLeftLabel: switchLeftLabel,
    pricing1SwitchRightLabel: switchRightLabel,
    pricing1ButtonText: buttonText,
    pricing1ButtonLink: buttonLink,
    pricing1Plans: plans,
    pricing1WrapperClassName: wrapperClassName,
    pricing1ContainerClassName: containerClassName,
  } = data || {};

  const [activeYearly, setActiveYearly] = useState(false);

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gy-6 mb-14 mb-md-18">
          <div className="col-lg-4">
            <h2 className="fs-16 text-uppercase text-muted mt-lg-18 mb-3">
              {title}
            </h2>
            <h3 className="display-4 mb-3">{caption}</h3>

            <p>{description}</p>
            {buttonText && (
              <NextLink
                href={buttonLink || '#'}
                title={buttonText}
                className="btn btn-primary rounded-pill mt-2"
              />
            )}
          </div>

          <div className="col-lg-7 offset-lg-1 pricing-wrapper">
            <div className="pricing-switcher-wrapper switcher justify-content-start justify-content-lg-end">
              <p className="mb-0 pe-3">{switchLeftLabel}</p>

              <Switch value={activeYearly} onChange={setActiveYearly} />

              <p className="mb-0 ps-3">{switchRightLabel}</p>
            </div>

            <div className="row gy-6 position-relative mt-5">
              {roundShape && (
                <div
                  className="shape rounded-circle bg-soft-primary rellax w-18 h-18"
                  style={{top: '-1rem', left: '-2rem'}}
                />
              )}

              <div
                className="shape bg-dot red rellax w-16 h-18"
                style={{right: '-1.6rem', bottom: '-0.5rem'}}
              />

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
