import {t} from '@/locale/server';
import {Ban, Clock, Rocket, XCircle} from 'lucide-react';
import type {ComponentType, ReactNode} from 'react';
import {PUBLISHER_REQUEST_STATUS} from '../../../../constants/statuses';
import {RequestAccessButton} from './request-access-button';

/**
 * Status-driven publisher-access panel shown in Contributions when the partner
 * is not yet an approved publisher: request access, pending, declined (with the
 * reason and either a re-request date or a "request again" button), or banned.
 */
export async function PublisherAccessRequest({
  workspaceURL,
  status,
  cooldownUntil,
  rejectionReason,
  canRequest,
}: {
  workspaceURL: string;
  status: number | null;
  cooldownUntil: Date | null;
  rejectionReason: string | null;
  canRequest: boolean;
}) {
  let Icon: ComponentType<{className?: string}> = Rocket;
  let title = await t('Become a publisher');
  let description = await t(
    'Request access to publish your apps and plugins on this marketplace. Once approved, you can create and manage listings.',
  );
  let reason: string | null = null;
  let action: ReactNode = (
    <RequestAccessButton
      workspaceURL={workspaceURL}
      label={await t('Request access')}
    />
  );

  if (status === PUBLISHER_REQUEST_STATUS.REQUESTED) {
    Icon = Clock;
    title = await t('Request pending');
    description = await t(
      "Your request to become a publisher is awaiting review. You'll be able to publish once it's approved.",
    );
    action = null;
  } else if (status === PUBLISHER_REQUEST_STATUS.BANNED) {
    Icon = Ban;
    title = await t('Publisher access unavailable');
    description = await t(
      'Publisher access is not available for your account.',
    );
    action = null;
  } else if (status === PUBLISHER_REQUEST_STATUS.REJECTED) {
    Icon = XCircle;
    title = await t('Request declined');
    reason = rejectionReason;
    if (canRequest) {
      description = await t(
        'Your previous request was declined. You can request publisher access again.',
      );
      action = (
        <RequestAccessButton
          workspaceURL={workspaceURL}
          label={await t('Request again')}
        />
      );
    } else {
      const when = cooldownUntil ? cooldownUntil.toLocaleDateString() : '';
      description = (
        await t('You can request publisher access again after {date}.')
      ).replace('{date}', when);
      action = null;
    }
  }

  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto py-16 gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
      {reason && (
        <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3 text-left">
          {reason}
        </p>
      )}
      {action}
    </div>
  );
}
