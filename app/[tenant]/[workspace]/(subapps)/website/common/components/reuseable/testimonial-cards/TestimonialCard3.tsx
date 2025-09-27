import {FC} from 'react';
import Image from 'next/image';

// =================================================
type TestimonialCard3Props = {
  name?: string;
  image?: string;
  review?: string;
  rating?: number;
  shadow?: boolean;
  designation?: string;
};
// =================================================

const TestimonialCard3: FC<TestimonialCard3Props> = props => {
  const {name, image, review, designation, rating, shadow} = props;

  const ratingMap: {[key: number]: string} = {
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
  };

  return (
    <div className={`card ${shadow ? 'shadow-lg' : ''}`}>
      <div className="card-body">
        {rating && ratingMap[rating] && (
          <span className={`ratings ${ratingMap[rating]} mb-3`} />
        )}

        <blockquote className="icon mb-0">
          <p>“{review}”</p>

          <div className="blockquote-details">
            <figure className="rounded-circle w-12 overflow-hidden">
              <Image
                width={100}
                height={100}
                src={image}
                alt="team"
                style={{width: '100%', height: 'auto'}}
              />
            </figure>

            <div className="info">
              <h5 className="mb-0">{name}</h5>
              <p className="mb-0">{designation}</p>
            </div>
          </div>
        </blockquote>
      </div>
    </div>
  );
};

export default TestimonialCard3;
