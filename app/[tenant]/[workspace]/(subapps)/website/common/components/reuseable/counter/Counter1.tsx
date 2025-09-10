import {FC} from 'react';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';

// ====================================================
type CounterProps = {
  title?: string;
  number?: number;
  titleColor?: string;
};
// ====================================================

const Counter1: FC<CounterProps> = ({title, number = 0, titleColor = ''}) => {
  const isThousand = number > 1000;

  return (
    <div className="col-md-4">
      <h3 className={`counter counter-lg ${titleColor}`}>
        <CountUp
          end={isThousand ? number / 1000 : number}
          suffix={isThousand ? 'K+' : '+'}
          separator=""
        />
      </h3>

      <p>{title}</p>
    </div>
  );
};

export default Counter1;
