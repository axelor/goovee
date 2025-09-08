import {FC} from 'react';
import Price from './Price';
import NextLink from '../links/NextLink';

// ================================================================
type PricingCard1Props = {
  planName?: string;
  features?: string[];
  bulletBg?: boolean;
  yearlyPrice: number;
  monthlyPrice: number;
  activeYearly: boolean;
  roundedButton?: boolean;
  buttonText?: string;
  buttonLink?: string;
};
// ================================================================

const PricingCard1: FC<PricingCard1Props> = props => {
  const {
    planName,
    features,
    yearlyPrice,
    monthlyPrice,
    activeYearly,
    roundedButton,
    bulletBg,
    buttonText,
    buttonLink,
  } = props;

  const yearClasses = activeYearly ? 'price-show' : 'price-hide price-hidden';
  const monthClasses = !activeYearly ? 'price-show' : 'price-hide price-hidden';

  return (
    <div className="pricing card shadow-lg">
      <div className="card-body pb-12">
        <div className="prices text-dark">
          <Price duration="mo" value={monthlyPrice} classes={monthClasses} />
          <Price duration="yr" value={yearlyPrice} classes={yearClasses} />
        </div>

        <h4 className="card-title mt-2">{planName}</h4>

        <ul
          className={`icon-list ${bulletBg ? 'bullet-bg' : ''} bullet-soft-primary mt-7 mb-8`}>
          {features?.map((item, i) => (
            <li key={i}>
              <i className="uil uil-check fs-21" />
              {item}
            </li>
          ))}
        </ul>
        {buttonText && (
          <NextLink
            href={buttonLink || '#'}
            title={buttonText}
            className={`btn btn-primary ${roundedButton ? 'rounded' : 'rounded-pill'}`}
          />
        )}
      </div>
    </div>
  );
};

export default PricingCard1;
