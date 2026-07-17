'use client';

import {Link} from '@/ui/components/link';
import {MdLocalFireDepartment} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

type Trending = {id: string; title: string};

export function ForumSidebar({
  stats,
  trending = [],
}: {
  stats: {discussions?: number; groups?: number; myGroups?: number};
  trending?: Trending[];
}) {
  const {workspaceURI} = useWorkspace();
  const postBase = `${workspaceURI}/${SUBAPP_CODES.forum}/post`;

  const statItems = [
    {label: i18n.t('Discussions'), value: stats.discussions ?? 0},
    {label: i18n.t('Groups'), value: stats.groups ?? 0},
    {label: i18n.t('My groups'), value: stats.myGroups ?? 0},
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Community stats */}
      <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-royal-dark to-royal">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-white/70 mb-3">
          {i18n.t('Community')}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {statItems.map(s => (
            <div key={s.label}>
              <div className="text-2xl font-extrabold tabular-nums">
                {s.value}
              </div>
              <div className="text-[11px] text-white/75 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-4">
          <div className="flex items-center gap-2 mb-3">
            <MdLocalFireDepartment className="size-4 text-[#e8732a]" />
            <h3 className="text-sm font-bold text-ink-900 mb-0">
              {i18n.t('Trending')}
            </h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {trending.slice(0, 3).map((t, i) => (
              <Link
                key={t.id}
                href={`${postBase}/${t.id}`}
                className="flex items-start gap-2.5 group">
                <span className="shrink-0 w-5 h-5 rounded-md bg-royal-pale text-royal-dark text-[11px] font-extrabold grid place-items-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[13px] font-semibold text-ink-800 leading-snug line-clamp-2 group-hover:text-royal">
                  {t.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ForumSidebar;
