import {FC, ReactNode} from 'react';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';

// ====================================================
type CounterProps = {
  title: string;
  number: number;
  Icon: ReactNode;
  suffix?: string;
};
// ====================================================

const Counter3: FC<CounterProps> = ({title, number, Icon, suffix}) => {
  return (
    <div className="col-md-4">
      {Icon}

      <h3 className="counter">
        <CountUp end={number} {...(suffix && {suffix})} />
      </h3>

      <p>{title}</p>
    </div>
  );
};

export default Counter3;
