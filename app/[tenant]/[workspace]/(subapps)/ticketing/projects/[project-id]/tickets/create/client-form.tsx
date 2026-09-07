'use client';

import type {TicketingConfig} from '../../../../common/orm/config';
import type {ID} from '@/types';
import {useRouter} from 'next/navigation';
import {useCallback} from 'react';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import type {
  Category,
  ContactPartner,
  Priority,
} from '../../../../common/types';
import {TicketForm} from '../../../../common/ui/components/ticket-form';

export function Form(props: {
  projectId: string;
  userId: ID;
  categories: Category[];
  priorities: Priority[];
  contacts: ContactPartner[];
  parentId?: string;
  formFields: TicketingConfig['ticketingFormFieldSet'];
}) {
  const {
    categories,
    priorities,
    projectId,
    contacts,
    userId,
    parentId,
    formFields,
  } = props;

  const {scope} = useWorkspace();
  const router = useRouter();
  const handleSuccess = useCallback(
    (ticketId: string, projectId: string) => {
      router.replace(
        scope.forRouter(`/ticketing/projects/${projectId}/tickets/${ticketId}`),
      );
    },
    [scope, router],
  );

  return (
    <TicketForm
      formFields={formFields}
      projectId={projectId}
      categories={categories}
      priorities={priorities}
      contacts={contacts}
      userId={userId}
      parentId={parentId}
      onSuccess={handleSuccess}
    />
  );
}
