'use client';
import {useMemo, useState, useTransition} from 'react';
import type {IconType} from 'react-icons';
import {
  MdArrowBack,
  MdNotificationsOff,
  MdOutlineChatBubbleOutline,
  MdOutlineForum,
  MdOutlineNotifications,
  MdSearch,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Link} from '@/ui/components/link';
import {RadioGroup, RadioGroupItem, Skeleton} from '@/ui/components';
import {useToast} from '@/ui/hooks';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {
  NOTIFICATION_VALUES,
  NOTIFICATIONS_OPTIONS,
  type NotificationValue,
} from '@/subapps/forum/common/constants';
import type {MemberGroup} from '@/subapps/forum/common/types/forum';
import {groupColorClass} from '@/subapps/forum/common/utils/group-color';
import {saveGroupNotifications} from '@/subapps/forum/common/action/action';

const OPTION_ICONS: Record<NotificationValue, IconType> = {
  [NOTIFICATION_VALUES.ALL]: MdOutlineNotifications,
  [NOTIFICATION_VALUES.ALL_ON_MY_POST]: MdOutlineForum,
  [NOTIFICATION_VALUES.NEW_COMMENTS_ON_MY_POST]: MdOutlineChatBubbleOutline,
  [NOTIFICATION_VALUES.NONE]: MdNotificationsOff,
};

type Prefs = Record<string, NotificationValue>;

/* A membership created before this screen existed can still carry a null
 * `notificationSelect`; the mailer treats that as "no notification", so the UI
 * shows it as such. */
function readPrefs(groups: MemberGroup[]): Prefs {
  return groups.reduce<Prefs>((acc, group) => {
    const current = NOTIFICATIONS_OPTIONS.find(
      o => o.value === group.notificationSelect,
    );
    acc[String(group.id)] = current?.value ?? NOTIFICATION_VALUES.NONE;
    return acc;
  }, {});
}

export function ForumNotifSettings({groups}: {groups: MemberGroup[]}) {
  const {url} = useWorkspace();
  const {toast} = useToast();
  const [isPending, startTransition] = useTransition();

  const [saved, setSaved] = useState<Prefs>(() => readPrefs(groups));
  const [prefs, setPrefs] = useState<Prefs>(() => readPrefs(groups));
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return groups;
    return groups.filter(g =>
      (g.forumGroup?.name || '').toLowerCase().includes(needle),
    );
  }, [groups, search]);

  const changed = groups.filter(
    g => prefs[String(g.id)] !== saved[String(g.id)],
  );
  const dirty = changed.length > 0;
  const disabled = !dirty || isPending;

  const handleCancel = () => setPrefs(saved);

  const handleSave = () => {
    if (!dirty) return;
    const payload = changed.map(g => ({
      id: g.id,
      groupID: g.forumGroup.id,
      notificationType: prefs[String(g.id)],
    }));

    startTransition(async () => {
      let response;
      try {
        response = await saveGroupNotifications({
          prefs: payload,
        });
      } catch {
        // The call itself rejected (network drop, stale server-action id,
        // or a throw before the action's own try/catch) — the action never
        // ran to completion, so there is nothing to reconcile. Leave `prefs`
        // and `saved` untouched so the draft survives and Save can be retried.
        toast({
          variant: 'destructive',
          title: i18n.t('An error occurred'),
        });
        return;
      }

      if ('success' in response) {
        setSaved(prefs);
        toast({title: i18n.t('Settings saved')});
        return;
      }

      // Partial failure: keep the settings that went through, roll the rest
      // back to what the server still holds. `prefs` captured here is the
      // snapshot from when Save was pressed — the right basis for `saved`,
      // since that is what the server was asked to store. The draft, though,
      // must be rebuilt from the live state: the radios stay enabled during
      // the request, so an edit made while it was in flight would otherwise be
      // overwritten by this stale snapshot without any notice.
      const failed = new Set(
        response.failedIds ?? changed.map(g => String(g.id)),
      );
      const nextSaved: Prefs = {...prefs};
      failed.forEach(id => {
        nextSaved[id] = saved[id];
      });
      setSaved(nextSaved);
      setPrefs(live => {
        const next = {...live};
        failed.forEach(id => {
          next[id] = saved[id];
        });
        return next;
      });
      toast({
        variant: 'destructive',
        title: i18n.t(response.message || 'An error occurred'),
      });
    });
  };

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="max-w-[900px] mx-auto px-4 pt-7 pb-14">
        <Link
          href={url.forRouter(`/${SUBAPP_CODES.forum}`)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 hover:text-royal mb-4 transition-colors">
          <MdArrowBack className="size-4" />
          {i18n.t('Back to forum')}
        </Link>

        <h1 className="text-[26px] font-extrabold tracking-[-0.025em] text-ink-900">
          {i18n.t('Forum notifications')}
        </h1>
        <p className="mt-1.5 mb-6 text-sm text-ink-500">
          {i18n.t('Choose what you want to receive, group by group.')}
        </p>

        {/* Group filter */}
        <div className="flex items-center gap-2.5 mb-3.5 px-3.5 py-2.5 rounded-[11px] bg-white border border-ink-150">
          <MdSearch className="size-4 shrink-0 text-royal" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={i18n.t('Search a group…')}
            aria-label={i18n.t('Search a group…')}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13.5px] text-ink-800 placeholder:text-ink-400"
          />
          <span className="shrink-0 text-xs text-ink-400">
            {i18n.t('{0} groups', String(visible.length))}
          </span>
        </div>

        {/* One card per group */}
        <div className="flex flex-col gap-3">
          {visible.map(group => {
            const key = String(group.id);
            const current = prefs[key];
            const currentOption = NOTIFICATIONS_OPTIONS.find(
              o => o.value === current,
            );
            const name = group.forumGroup?.name || '';

            return (
              <div
                key={key}
                className="bg-white border border-ink-100 rounded-[14px] p-[18px]">
                <div className="flex items-center gap-3 mb-3.5">
                  <span
                    className={cn(
                      'size-[38px] shrink-0 rounded-[10px] grid place-items-center text-white text-[17px] font-extrabold',
                      groupColorClass(name),
                    )}>
                    {(name || '#').trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      id={`${key}-group-name`}
                      className="text-[14.5px] font-bold text-ink-900 truncate">
                      {i18n.t(name)}
                    </div>
                    <div
                      className={cn(
                        'mt-0.5 text-xs font-semibold',
                        current === NOTIFICATION_VALUES.NONE
                          ? 'text-ink-400'
                          : 'text-royal-dark',
                      )}>
                      {i18n.t(currentOption?.title || '')}
                    </div>
                  </div>
                </div>

                <RadioGroup
                  value={current}
                  onValueChange={value =>
                    setPrefs(p => ({...p, [key]: value as NotificationValue}))
                  }
                  aria-labelledby={`${key}-group-name`}
                  className="gap-1.5">
                  {NOTIFICATIONS_OPTIONS.map(option => {
                    const on = current === option.value;
                    const Icon = OPTION_ICONS[option.value];
                    const id = `${key}-${option.value}`;
                    return (
                      <label
                        key={option.value}
                        htmlFor={id}
                        className={cn(
                          'flex items-center gap-[11px] px-3.5 py-[11px] rounded-[10px] cursor-pointer transition-colors',
                          on
                            ? 'bg-royal-pale border-[1.5px] border-royal'
                            : 'bg-white border border-ink-150 hover:bg-ink-25',
                        )}>
                        <RadioGroupItem
                          id={id}
                          value={option.value}
                          className={cn(
                            'shrink-0',
                            on
                              ? 'border-royal text-royal'
                              : 'border-ink-300 text-ink-300',
                          )}
                        />
                        <Icon
                          className={cn(
                            'size-4 shrink-0',
                            on ? 'text-royal' : 'text-ink-400',
                          )}
                        />
                        <span
                          className={cn(
                            'text-[13.5px]',
                            on
                              ? 'font-bold text-royal-dark'
                              : 'font-medium text-ink-700',
                          )}>
                          {i18n.t(option.title)}
                        </span>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>
            );
          })}

          {visible.length === 0 && (
            <div className="bg-white border border-ink-100 rounded-[14px] py-9 px-4 text-center text-[13.5px] text-ink-400">
              {groups.length === 0
                ? i18n.t('You are not a member of any group yet.')
                : i18n.t('No group matches your search.')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 mt-5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={disabled}
            className="px-[18px] py-2.5 rounded-[10px] bg-white border border-ink-150 text-ink-700 text-[13.5px] font-semibold hover:bg-ink-25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {i18n.t('Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={disabled}
            className="px-5 py-2.5 rounded-[10px] bg-royal text-white text-[13.5px] font-bold shadow-[0_1px_2px_rgba(13,30,75,0.15),0_4px_12px_rgba(13,30,75,0.12)] hover:bg-royal-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isPending ? i18n.t('Saving…') : i18n.t('Save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForumNotifSettings;

export function ForumNotifSettingsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(4)].map((_, card) => (
        <div
          key={card}
          className="bg-white border border-ink-100 rounded-[14px] p-[18px]">
          <div className="flex items-center gap-3 mb-3.5">
            <Skeleton className="size-[38px] rounded-[10px]" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {[...Array(4)].map((_, row) => (
              <Skeleton key={row} className="h-[42px] rounded-[10px]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
