'use client';

import Link from 'next/link';
import {MdKeyboardBackspace} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {AlertToast, BadgeList, Button, Separator} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {useSearchParams} from '@/ui/hooks';
import {authClient} from '@/lib/auth-client';

// ---- LOCAL IMPORTS ---- //
import {EventDateCard} from '@/subapps/events/common/ui/components';

type ContentProps = {
  event: any;
};

function Content({event}: ContentProps) {
  const {searchParams} = useSearchParams();
  const isPaid = searchParams.get('isPaid')?.toLowerCase() === 'true';

  const {workspaceURI} = useWorkspace();
  const {data: session} = authClient.useSession();
  const user = session?.user;

  const hideEventHomeNavigationButton = event.isHidden && !user;

  return (
    <div className="py-6 container mx-auto flex flex-col gap-6 mb-16">
      <h1 className="font-medium text-xl">
        {i18n.t(`Registration ${isPaid ? 'and payment' : ''} success`)}
      </h1>
      <div className="flex flex-col gap-4 bg-white rounded-lg p-6">
        <p className="text-xl font-semibold">{event?.eventTitle}</p>
        <EventDateCard
          startDate={event?.eventStartDateTime}
          endDate={event?.eventEndDateTime}
          eventAllDay={event?.eventAllDay}
        />
        <BadgeList items={event?.eventCategorySet} />

        <Separator className="bg-zinc-200" />

        <div className="mb-7">
          <AlertToast
            show={true}
            title={i18n.t(
              `${isPaid ? 'Thank you very much for your payment, you' : 'You'} are now registered for this event`,
            )}
            variant="success"
          />
        </div>
        {!hideEventHomeNavigationButton && (
          <Button variant="outline-success">
            <Link
              href={`${workspaceURI}/${SUBAPP_CODES.events}`}
              className="flex gap-2">
              <MdKeyboardBackspace size={24} />
              {i18n.t('Go back to the homepage')}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default Content;
