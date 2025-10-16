'use client';
import {usePathname} from 'next/navigation';
import {useEffect, useState} from 'react';
import '@/subapps/website/common/assets/scoped.scss';

export function TemplateRoot({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // added bootstrap functionality
  useEffect(() => {
    if (typeof window !== 'undefined') import('bootstrap');
  }, []);

  // scroll animation added
  useEffect(() => {
    (async () => {
      const scrollCue = (
        await import('@/subapps/website/common/plugins/scrollcue')
      ).default;
      scrollCue.init({interval: -400, duration: 700, percentage: 0.8});
      scrollCue.update();
    })();
  }, [pathname]);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="gv relative">
      {loading ? <div className="page-loader" /> : children}
    </div>
  );
}
