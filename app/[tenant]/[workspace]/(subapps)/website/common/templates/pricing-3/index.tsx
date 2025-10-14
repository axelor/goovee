'use client';
import type {TemplateProps} from '@/subapps/website/common/types';
import {type Pricing3Data} from './meta';
import {useState} from 'react';
import Switch from '@/subapps/website/common/components/reuseable/Switch';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import PricingCard1 from '@/subapps/website/common/components/reuseable/pricing-cards/PricingCard1';

export default function Pricing3(props: TemplateProps<Pricing3Data>) {
  const {data} = props;
  const {
    pricing3Title: title,
    pricing3Caption: caption,
    pricing3Description: description,
    pricing3SwitchLeftLabel: switchLeftLabel,
    pricing3SwitchRightLabel: switchRightLabel,
    pricing3ButtonLabel: buttonLabel,
    pricing3ButtonLink: buttonLink,
    pricing3Plans: plans,
    pricing3WrapperClassName: wrapperClassName,
    pricing3ContainerClassName: containerClassName,
  } = data || {};

  const [activeYearly, setActiveYearly] = useState(false);

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gy-6">
          <div className="col-lg-4">
            <h2 className="fs-16 text-uppercase text-line text-primary mt-lg-18 mb-3">
              {title}
            </h2>
            <h3 className="display-4 mb-3">{caption}</h3>
            <p>{description}</p>

            <NextLink
              href={buttonLink}
              title={buttonLabel}
              className="btn btn-primary rounded mt-2"
            />
          </div>

          <div className="col-lg-7 offset-lg-1 pricing-wrapper">
            <div className="pricing-switcher-wrapper switcher justify-content-start justify-content-lg-end">
              <p className="mb-0 pe-3">{switchLeftLabel}</p>

              <Switch value={activeYearly} onChange={setActiveYearly} />

              <p className="mb-0 ps-3">{switchRightLabel}</p>
            </div>

            <div className="row gy-6 position-relative mt-5">
              <div
                className="shape rounded-circle bg-soft-primary rellax w-18 h-18"
                style={{top: '-1rem', left: '-2rem'}}
              />

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
