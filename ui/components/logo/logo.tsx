import Image from 'next/image';

import {withBasePath} from '@/lib/core/path/base-path';

export function Logo({height = 50, width = 100, ...rest}: any) {
  return (
    <Image
      alt="Company Logo"
      src={withBasePath('/images/logo.png')}
      height={height}
      width={width}
      style={{width: 'auto', height: 'auto'}}
      {...rest}
    />
  );
}

export default Logo;
