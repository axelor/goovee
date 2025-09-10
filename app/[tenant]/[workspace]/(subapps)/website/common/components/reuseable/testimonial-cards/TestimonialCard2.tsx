import {FC, HTMLAttributes} from 'react';

// =================================================
type TestimonialCard2Props = {
  name?: string;
  review?: string;
  designation?: string;
  blockClassName?: HTMLAttributes<HTMLQuoteElement>['className'];
  blockDetailsClassName?: HTMLAttributes<HTMLDivElement>['className'];
};
// =================================================

const TestimonialCard2: FC<TestimonialCard2Props> = props => {
  const {
    name,
    review,
    designation,
    blockClassName = 'icon icon-top fs-lg text-center',
    blockDetailsClassName = 'blockquote-details justify-content-center text-center',
  } = props;

  return (
    <blockquote className={blockClassName}>
      <p>“{review}”</p>

      <div className={blockDetailsClassName}>
        <div className="info ps-0">
          <h5 className="mb-1">{name}</h5>
          <p className="mb-0">{designation}</p>
        </div>
      </div>
    </blockquote>
  );
};

export default TestimonialCard2;
