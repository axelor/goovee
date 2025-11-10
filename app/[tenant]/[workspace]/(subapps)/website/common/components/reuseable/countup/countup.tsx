'use client';
import ReactCountUp, {type CountUpProps} from 'react-countup';

export function CountUp(props: CountUpProps) {
  return (
    <ReactCountUp
      enableScrollSpy
      scrollSpyOnce
      scrollSpyDelay={400}
      {...props}
    />
  );
}
