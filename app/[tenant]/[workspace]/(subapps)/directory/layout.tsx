import type {ReactNode} from 'react';

export default async function Layout({
  children,
}: {
  params: {tenant: string; workspace: string};
  children: ReactNode;
}) {
  return <div className="mb-[72px] lg:mb-0">{children}</div>;
}
