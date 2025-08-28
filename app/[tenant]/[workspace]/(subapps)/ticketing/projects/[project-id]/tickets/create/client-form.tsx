'use client';

import type {PortalAppConfig} from '@/types';
import type {ID} from '@goovee/orm';
import {useRouter} from 'next/navigation';
import {useCallback} from 'react';
import type {TaskCategory} from '@/orm/project-task';
import type {TaskPriority} from '@/orm/project-task';
import type {MainPartnerContact} from '@/orm/project-task';
import {TicketForm} from '../../../../common/ui/components/ticket-form';

export function Form(props: {
  projectId: string;
  userId: ID;
  categories: TaskCategory[];
  priorities: TaskPriority[];
  contacts: MainPartnerContact[];
  workspaceURI: string;
  parentId?: string;
  formFields: PortalAppConfig['ticketingFormFieldSet'];
}) {
  const {
    categories,
    priorities,
    projectId,
    contacts,
    userId,
    parentId,
    workspaceURI,
    formFields,
  } = props;

  const router = useRouter();
  const handleSuccess = useCallback(
    (ticketId: string, projectId: string) => {
      router.replace(
        `${workspaceURI}/ticketing/projects/${projectId}/tickets/${ticketId}`,
      );
    },
    [workspaceURI, router],
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
      className="mt-10"
    />
  );
}
