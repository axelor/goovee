'use client';

import {useEffect, useRef, useState} from 'react';
import {useSession} from 'next-auth/react';
import {useRouter, useSearchParams} from 'next/navigation';

import {SEARCH_PARAMS} from '@/constants';
import {revalidate} from '../../actions';

export default function Content({partner}: any) {
  const {data: session, update, status} = useSession();
  const [initialized, setInitialized] = useState(false);

  const user = session?.user;

  const navigatedRef = useRef(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const tenantId = searchParams.get(SEARCH_PARAMS.TENANT_ID);

  useEffect(() => {
    async function init() {
      if (initialized) return;

      if (status !== 'authenticated') return;

      const userAlreadyInitiated = user?.tenantId && user?.id;

      if (!userAlreadyInitiated) {
        await update({
          ...partner,
          email: user?.email,
          tenantId,
        });
        await revalidate();
      }

      setInitialized(true);
    }

    init();
  }, []);

  useEffect(() => {
    if (user?.id && initialized && !navigatedRef.current) {
      navigatedRef.current = true;

      router.push(
        searchParams.get('callbackurl') ||
          searchParams.get('workspaceURL') ||
          '/',
      );
    }
  }, [user, initialized, router]);

  return (
    <div className="grid grid-cols-1 p-4 min-h-screen">
      <div className="flex items-center justify-center !border-0">
        <div className="w-6 h-6 border-2 border-t-transparent border-gray-400 rounded-full animate-spin-fast" />
      </div>
    </div>
  );
}
