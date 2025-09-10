import {FC} from 'react';

// =================================================
type TestimonialCard5Props = {
  name?: string;
  review?: string;
  designation?: string;
  rating?: number;
  borderBottom?: boolean;
};
// =================================================

const TestimonialCard5: FC<TestimonialCard5Props> = props => {
  const {name, review, designation, rating, borderBottom} = props;
  const className = `card shadow-lg ${borderBottom ? 'card-border-bottom border-soft-primary' : ''}`;

  const ratingMap: {[key: number]: string} = {
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
  };

  return (
    <div className={className}>
      <div className="card-body">
        {rating && ratingMap[rating] && (
          <span className={`ratings ${ratingMap[rating]} mb-3`} />
        )}
        <blockquote className="icon mb-0">
          <p className="fs-16">“{review}”</p>
          <div className="blockquote-details">
            <div className="info ps-0">
              <h5 className="mb-1">{name}</h5>
              <p className="mb-0">{designation}</p>
            </div>
          </div>
        </blockquote>
      </div>
    </div>
  );
};

export default TestimonialCard5;
