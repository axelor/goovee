import React from 'react';

export default function Layout({children}: {children: React.ReactNode}) {
  return <div className="!mb-20 md:mb-0">{children}</div>;
}
