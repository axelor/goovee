import {FC} from 'react';

// =================================================
type TestimonialCard6Props = {
  name?: string;
  review?: string;
  designation?: string;
  borderBottom?: boolean;
};
// =================================================

const TestimonialCard6: FC<TestimonialCard6Props> = props => {
  const {name, review, designation} = props;

  return (
    <div className="card shadow-lg card-border-bottom border-soft-primary">
      <div className="card-body">
        <blockquote className="border-0 mb-0">
          <p>“{review}”</p>
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

export default TestimonialCard6;
