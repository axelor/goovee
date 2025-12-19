import React from 'react';

// ---- LOCAL IMPORTS ---- //
import {getMmuser, getUsers, getUserStatus} from './api';
import {ChatView} from './components';
import {getTeam} from './orm/orm';
import {clone} from '@/utils';
import {getSession} from '@/lib/core/auth';
import {t} from '@/locale/server';
import {getAdminToken} from '@/lib/core/mattermost';

export default async function Chat(props: {params: Promise<{tenant: string}>}) {
  const params = await props.params;
  const session = await getSession();
  const user = session?.user;
  const token = getAdminToken();
  const {data} = await getMmuser(user?.email, token);

  if (!token) {
    return <div>{await t('No discussions available')}</div>;
  }

  const team = await getTeam({tenant: params.tenant}).then(clone);

  if (!team || team?.teamId === '') {
    return <div>{await t('Chat configuration error.')}</div>;
  }

  const userStatus = await getUserStatus(data.id, token);
  const users = await getUsers(token);

  return (
    <ChatView
      token={token}
      user={data}
      userStatus={userStatus}
      users={users}
      teamId={team?.teamId}
    />
  );
}
