'use client';

import {useOptimistic, startTransition} from 'react';
import {Bell} from 'lucide-react';
import {
  MdCheck,
  MdArrowForward,
  MdOutlineForum,
  MdOutlineConfirmationNumber,
  MdOutlineReceiptLong,
  MdOutlineShoppingBag,
  MdOutlineArticle,
  MdOutlineEventNote,
  MdOutlineNotifications,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {usePushNotifications} from '@/pwa/push-context';
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {Button, Alert, AlertTitle, AlertDescription} from '@/ui/components';
import {Link} from '@/ui/components/link';
import {formatRelativeTime} from '@/locale/formatters';

type Notif = {
  id: string;
  title: string | null;
  body: string | null;
  url: string | null;
  tag: string | null;
  createdOn: Date | string | null;
};

// tag prefix → typed icon + colors (the model has no explicit "type").
function notifType(tag?: string | null) {
  const t = tag || '';
  if (t.startsWith('ticket'))
    return {
      Icon: MdOutlineConfirmationNumber,
      cls: 'bg-palette-orange-light text-palette-orange-dark',
    };
  if (t.startsWith('invoice'))
    return {
      Icon: MdOutlineReceiptLong,
      cls: 'bg-palette-red-light text-palette-red-dark',
    };
  if (t.startsWith('order') || t.startsWith('quotation'))
    return {Icon: MdOutlineShoppingBag, cls: 'bg-mint-50 text-mint-600'};
  if (t.startsWith('news'))
    return {Icon: MdOutlineArticle, cls: 'bg-royal-pale text-royal'};
  if (t.startsWith('event'))
    return {Icon: MdOutlineEventNote, cls: 'bg-royal-pale text-royal'};
  if (t.startsWith('forum')) {
    // a new comment vs a reply → blue / purple
    return t.includes('reply')
      ? {Icon: MdOutlineForum, cls: 'bg-royal-pale text-royal'}
      : {
          Icon: MdOutlineForum,
          cls: 'bg-palette-purple-light text-palette-purple-dark',
        };
  }
  return {Icon: MdOutlineNotifications, cls: 'bg-royal-pale text-royal'};
}

const PERIODS = ['Today', 'This week', 'Older'] as const;

function periodOf(date?: Date | string | null): (typeof PERIODS)[number] {
  if (!date) return 'Older';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'Older';
  const now = new Date();
  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  if (d.getTime() >= startToday) return 'Today';
  if (d.getTime() >= startToday - 6 * 24 * 60 * 60 * 1000) return 'This week';
  return 'Older';
}

export function UnreadNotificationsList() {
  const {
    unreadNotifications,
    markAsRead,
    markAllAsRead,
    isSupported,
    permission,
    subscribe,
  } = usePushNotifications();

  const [notifs, dispatch] = useOptimistic(
    unreadNotifications,
    (state, action: {type: 'markRead'; id: string} | {type: 'markAllRead'}) => {
      if (action.type === 'markRead')
        return state.filter(n => n.id !== action.id);
      if (action.type === 'markAllRead') return [];
      return state;
    },
  );

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      dispatch({type: 'markRead', id});
      await markAsRead(id);
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      dispatch({type: 'markAllRead'});
      await markAllAsRead();
    });
  };

  const count = notifs.length;
  const groups = PERIODS.map(p => ({
    label: p,
    items: (notifs as Notif[]).filter(n => periodOf(n.createdOn) === p),
  })).filter(g => g.items.length > 0);

  return (
    <div className="container mx-auto max-w-[900px] py-8 mb-20 lg:mb-0">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.025em] text-ink-900">
            {i18n.t('Notifications')}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {count > 0
              ? i18n.t('{0} unread', String(count))
              : i18n.t("You're all caught up 🎉")}
          </p>
        </div>
        {count > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="inline-flex shrink-0 items-center gap-2 rounded-[10px] border border-royal-border bg-white px-4 py-2.5 text-[13px] font-bold text-royal-dark transition-colors hover:bg-royal-pale">
            <MdCheck className="size-4" />
            {i18n.t('Mark all as read')}
          </button>
        )}
      </div>

      {/* Push permission prompts (real PWA) */}
      {isSupported && permission === 'default' && (
        <Alert variant="primary" className="mb-5">
          <Bell className="h-4 w-4" />
          <AlertTitle>{i18n.t('Stay Updated!')}</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p>
              {i18n.t(
                'Enable push notifications to receive real-time updates even when you are not on the site.',
              )}
            </p>
            <Button
              size="sm"
              variant="royal"
              className="shrink-0"
              onClick={() => subscribe()}>
              {i18n.t('Enable')}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {isSupported && permission === 'denied' && (
        <Alert variant="destructive" className="mb-5">
          <Bell className="h-4 w-4" />
          <AlertTitle>{i18n.t('Notifications Blocked')}</AlertTitle>
          <AlertDescription>
            {i18n.t(
              'You have blocked notifications for this site. To receive updates, please enable them in your browser settings.',
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Empty state */}
      {count === 0 ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-14 text-center shadow-xs">
          <div className="mx-auto mb-3.5 grid size-16 place-items-center rounded-full bg-mint-50 text-mint-600">
            <MdCheck className="size-8" />
          </div>
          <div className="text-base font-bold text-ink-900">
            {i18n.t("You're all caught up")}
          </div>
          <p className="mt-1 text-[13.5px] text-ink-500">
            {i18n.t('No unread notifications.')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(group => (
            <div key={group.label}>
              <div className="mb-2.5 pl-1 text-[11.5px] font-bold uppercase tracking-[0.05em] text-ink-400">
                {i18n.t(group.label)}
              </div>
              <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-xs">
                {group.items.map((n, i) => (
                  <NotifRow
                    key={n.id}
                    notif={n}
                    isLast={i === group.items.length - 1}
                    onMarkRead={handleMarkAsRead}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotifRow({
  notif,
  isLast,
  onMarkRead,
}: {
  notif: Notif;
  isLast: boolean;
  onMarkRead: (id: string) => void;
}) {
  const {Icon, cls} = notifType(notif.tag);

  return (
    <div
      className={cn(
        'relative flex items-start gap-3.5 bg-royal-pale/40 px-5 py-4 transition-colors hover:bg-ink-25',
        !isLast && 'border-b border-ink-100',
      )}>
      {/* unread dot */}
      <span className="absolute left-2 top-6 size-[7px] rounded-full bg-royal" />

      {/* typed icon */}
      <div
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-[10px]',
          cls,
        )}>
        <Icon className="size-[18px]" />
      </div>

      {/* content */}
      <div className="min-w-0 flex-1">
        <div className="text-sm leading-snug text-ink-900">{notif.title}</div>
        {notif.body && (
          <div className="mt-0.5 line-clamp-1 text-[13px] leading-snug text-ink-600">
            {notif.body}
          </div>
        )}
        {notif.createdOn && (
          <div className="mt-1.5 text-[11.5px] text-ink-400">
            {formatRelativeTime(notif.createdOn)}
          </div>
        )}
      </div>

      {/* actions */}
      <div className="flex shrink-0 items-center gap-2">
        {notif.url && (
          <Link
            href={notif.url}
            onClick={() => onMarkRead(notif.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-royal px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-royal-dark">
            {i18n.t('View')}
            <MdArrowForward className="size-3" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => onMarkRead(notif.id)}
          title={i18n.t('Mark as read')}
          aria-label={i18n.t('Mark as read')}
          className="grid size-8 place-items-center rounded-lg border border-ink-150 text-ink-400 transition-colors hover:border-mint-200 hover:bg-mint-50 hover:text-mint-600">
          <MdCheck className="size-[15px]" />
        </button>
      </div>
    </div>
  );
}
