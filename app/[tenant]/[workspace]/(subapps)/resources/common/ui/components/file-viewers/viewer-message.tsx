import React from 'react';

/** What a viewer shows in place of a document it cannot show yet, or at all. */
export function ViewerMessage({children}: {children: React.ReactNode}) {
  return <div className="p-8 text-center text-sm text-ink-500">{children}</div>;
}
