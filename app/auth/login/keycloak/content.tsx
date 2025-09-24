'use client';

import {useEffect} from 'react';
import {useSession} from 'next-auth/react';
import {useRouter, useSearchParams} from 'next/navigation';

import {SEARCH_PARAMS} from '@/constants';
import {revalidate} from '../actions';

export default function Content({partner}: any) {
  const {data: session, update} = useSession();
  const user = session?.user;

  const router = useRouter();
  const searchParams = useSearchParams();

  const tenantId = searchParams.get(SEARCH_PARAMS.TENANT_ID);

  useEffect(() => {
    async function init() {
      await update({
        ...partner,
        email: user?.email,
        tenantId,
      });

      await revalidate();
    }

    init();
  }, []);

  useEffect(() => {
    if (user?.id) {
      router.push(
        searchParams.get('callbackurl') ||
          searchParams.get('workspaceURL') ||
          '/',
      );
    }
  }, [user]);

  return null;
}
