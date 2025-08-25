'use client';
import CountUpReact from 'react-countup';

export function CountUp(props: {end?: number; suffix?: string}) {
  const {end, suffix} = props;
  return <CountUpReact end={end || 0} suffix={suffix} />;
}
