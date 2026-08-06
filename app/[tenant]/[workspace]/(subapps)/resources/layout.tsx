import React from 'react';

export default function Layout({children}: {children: React.ReactNode}) {
  /* Holds the content clear of the workspace's fixed mobile menu bar, which is
     that tall and hides at lg. */
  return <div className="mb-[72px] lg:mb-0">{children}</div>;
}
