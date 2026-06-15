import type {ComponentProps} from 'react';
import NextLink from 'next/link';

type LinkProps = ComponentProps<typeof NextLink>;

export function Link({prefetch = false, ...props}: LinkProps) {
  return <NextLink prefetch={prefetch} {...props} />;
}

export default Link;
