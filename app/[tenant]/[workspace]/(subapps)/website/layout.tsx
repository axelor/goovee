import type {ReactNode} from 'react';

export default function Layout({children}: {children: ReactNode}) {
  return <div className="h-full mb-[72px] lg:mb-0">{children}</div>;
}
