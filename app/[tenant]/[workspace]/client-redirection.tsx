'use client';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';

export function ClientRedirection(props: {url: string}) {
  const router = useRouter();
  useEffect(() => {
    router.replace(props.url);
  }, [props.url, router]);
  return (
    <div className="grid grid-cols-1 p-4 h-full">
      <div className="flex items-center justify-center !border-0">
        <div className="w-6 h-6 border-2 border-t-transparent border-gray-400 rounded-full animate-spin-fast" />
      </div>
    </div>
  );
}
