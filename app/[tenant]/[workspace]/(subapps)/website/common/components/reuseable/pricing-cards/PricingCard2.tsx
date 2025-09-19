import {FC} from 'react';
import Price from './Price';
import NextLink from '../links/NextLink';

// ================================================================
type PricingCard2Props = {
  planName?: string;
  features?: string[];
  yearlyPrice: number;
  monthlyPrice: number;
  activeYearly: boolean;
  roundedButton?: boolean;
  buttonText?: string;
  buttonLink?: string;
};
// ================================================================

const PricingCard2: FC<PricingCard2Props> = props => {
  const {
    planName,
    features,
    yearlyPrice,
    monthlyPrice,
    activeYearly,
    roundedButton,
    buttonLink,
    buttonText,
  } = props;

  const yearClasses = activeYearly ? 'price-show' : 'price-hide price-hidden';
  const monthClasses = !activeYearly ? 'price-show' : 'price-hide price-hidden';

  return (
    <div className="pricing card shadow-lg text-center">
      <div className="card-body">
        {/* <Icon /> */}

        <h4 className="card-title">{planName}</h4>

        <div className="prices text-dark">
          <Price duration="mo" value={monthlyPrice} classes={monthClasses} />
          <Price duration="yr" value={yearlyPrice} classes={yearClasses} />
        </div>

        <ul className="icon-list bullet-bg bullet-soft-primary mt-7 mb-8 text-start">
          {features?.map((item, i) => (
            <li key={i}>
              <i className="uil uil-check" />
              <span>
                <strong>{item.split(' ')[0]}</strong>{' '}
                {item.split(' ').slice(1).join(' ')}
              </span>
            </li>
          ))}
        </ul>

        <NextLink
          href={buttonLink || '#'}
          title={buttonText}
          className={`btn btn-primary ${roundedButton ? 'rounded' : 'rounded-pill'}`}
        />
      </div>
    </div>
  );
};

export default PricingCard2;
