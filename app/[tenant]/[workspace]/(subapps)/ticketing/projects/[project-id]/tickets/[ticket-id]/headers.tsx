'use client';
import {i18n} from '@/locale';
import type {PortalAppConfig} from '@/types';
import type {Cloned} from '@/types/util';
import {useToast} from '@/ui/hooks';
import type {ID} from '@goovee/orm';
import type {
  Category,
  ContactPartner,
  Priority,
  TicketLink,
} from '../../../../common/types';
import {useTicketDetails} from '../../../../common/ui/components/ticket-details/ticket-details-provider';
import {TicketForm} from '../../../../common/ui/components/ticket-form';
import {
  TicketChildLinkForm,
  TicketParentLinkForm,
  TicketRelatedLinkForm,
} from '../../../../common/ui/components/ticket-link-form';
import {TicketLinkHeader} from '../../../../common/ui/components/ticket-link-header';

export function RelatedTicketsHeader(props: {
  linkTypes: {
    id: string;
    name: string;
  }[];
  projectId: ID;
  ticketId: ID;
  links: Cloned<TicketLink[]>;
}) {
  return (
    <TicketLinkHeader
      title={i18n.t('Related tickets')}
      alertTitle={i18n.t('Link related ticket')}
      alertContentRenderer={({closeAlert}) => (
        <TicketRelatedLinkForm {...props} onSubmit={closeAlert} />
      )}
    />
  );
}

export function ParentTicketsHeader(props: {
  projectId: ID;
  ticketId: ID;
  childrenIds: ID[];
  parentId?: ID;
}) {
  return (
    <TicketLinkHeader
      title={i18n.t('Parent ticket')}
      alertTitle={i18n.t('Link parent ticket')}
      alertContentRenderer={({closeAlert}) => (
        <TicketParentLinkForm {...props} onSubmit={closeAlert} />
      )}
    />
  );
}

export function ChildTicketsHeader(props: {
  projectId: ID;
  ticketId: ID;
  parentIds: ID[];
  categories: Category[];
  priorities: Priority[];
  contacts: ContactPartner[];
  userId: ID;
  childrenIds: ID[];
  formFields: PortalAppConfig['ticketingFormFieldSet'];
}) {
  const {
    ticketId,
    projectId,
    categories,
    priorities,
    contacts,
    userId,
    parentIds,
    childrenIds,
    formFields,
  } = props;

  const {toast} = useToast();
  const {submitFormWithAction} = useTicketDetails();

  return (
    <TicketLinkHeader
      title={i18n.t('Child tickets')}
      dialogTitle={i18n.t('Create child ticket')}
      dialogContentRenderer={({closeDialog}) => (
        <TicketForm
          projectId={projectId.toString()}
          categories={categories}
          priorities={priorities}
          contacts={contacts}
          userId={userId}
          parentId={ticketId.toString()}
          formFields={formFields}
          className="mt-10 text-left"
          submitFormWithAction={submitFormWithAction}
          onSuccess={() => {
            toast({
              variant: 'success',
              title: i18n.t('Ticket created and linked'),
            });
            closeDialog();
          }}
        />
      )}
      alertTitle={i18n.t('Link child ticket')}
      alertContentRenderer={({closeAlert}) => (
        <TicketChildLinkForm
          ticketId={ticketId}
          parentIds={parentIds}
          childrenIds={childrenIds}
          projectId={projectId}
          onSubmit={closeAlert}
        />
      )}
    />
  );
}
