import {FC} from 'react';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
import {CountUpProps} from 'react-countup';

// ==============================================================
interface CounterProps extends CountUpProps {
  title: string;
}
// ==============================================================

const Counter4: FC<CounterProps> = ({title, ...props}) => (
  <div className="col-md-6">
    <h3 className="counter counter-lg mb-1">
      <CountUp {...props} />
    </h3>

    <h5 className="mb-0">{title}</h5>
  </div>
);

export default Counter4;
