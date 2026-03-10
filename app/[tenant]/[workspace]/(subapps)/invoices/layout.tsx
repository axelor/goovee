import {ReactNode} from 'react';
export default async function Layout({children}: {children: ReactNode}) {
  return <div className="!mb-20 md:mb-0">{children}</div>;
}
