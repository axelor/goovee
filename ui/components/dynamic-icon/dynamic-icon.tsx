'use client';

import {useMemo} from 'react';
import dynamic from 'next/dynamic';
import {MdDownloading, MdOutlineError} from 'react-icons/md';

const loading = () => <MdDownloading className="text-muted" />;

export function DynamicIcon({
  icon,
  ...rest
}: {
  icon: string;
  className?: string;
  onClick?: any;
  style?: any;
}) {
  const [library, name] = icon?.split('-');

  const IconComponent: React.JSXElementConstructor<any> = useMemo(() => {
    switch (library) {
      case 'md':
        return dynamic(
          () =>
            import(`react-icons/md`).then(
              (mod: any) => mod?.[`Md${name}`] ?? MdOutlineError,
            ),
          {loading, ssr: false},
        );
      case 'bs':
        return dynamic(
          () =>
            import(`react-icons/bs`).then(
              (mod: any) => mod?.[`Bs${name}`] ?? MdOutlineError,
            ),
          {loading, ssr: false},
        );
      default:
        return () => null;
    }
  }, [library, name]);

  return <IconComponent {...rest} />;
}

export default DynamicIcon;
