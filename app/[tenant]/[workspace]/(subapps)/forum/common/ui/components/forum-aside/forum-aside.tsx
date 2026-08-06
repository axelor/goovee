'use client';

import {useState} from 'react';

// ---- CORE IMPORTS ---- //
import {User} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {ForumSidebar} from '../forum-sidebar';
import {GroupControls} from '../group-controls';
import {Group, MemberGroup} from '@/subapps/forum/common/types/forum';

type Stats = {discussions?: number; groups?: number; myGroups?: number};
type Trending = {id: string; title: string};

export function ForumAside({
  stats,
  trending = [],
  memberGroups,
  nonMemberGroups,
  user,
}: {
  stats: Stats;
  trending?: Trending[];
  memberGroups: MemberGroup[];
  nonMemberGroups: Group[];
  user: User | null;
}) {
  const [myGroups, setMyGroups] = useState(stats.myGroups ?? 0);

  return (
    <>
      <ForumSidebar stats={{...stats, myGroups}} trending={trending} />
      <GroupControls
        memberGroups={memberGroups}
        nonMemberGroups={nonMemberGroups}
        user={user}
        onMemberCountChange={setMyGroups}
      />
    </>
  );
}

export default ForumAside;
