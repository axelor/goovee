'use client';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {useToast} from '@/ui/hooks';
import {zodResolver} from '@hookform/resolvers/zod';
import {pick} from 'lodash';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import {useForm, type UseFormReturn} from 'react-hook-form';
import {
  cancelTicket,
  closeTicket,
  mutate,
  MutateProps,
  MutateResponse,
  updateAssignment,
} from '../../../actions';
import {ASSIGNMENT} from '../../../constants';
import {useRetryAction} from '../../../hooks';
import type {Ticket} from '../../../types';
import {isWithProvider} from '../../../utils';
import {UpdateFormSchema, type UpdateFormData} from '../../../utils/validators';

export const TicketDetailsContext =
  createContext<null | TicketDetailsContextValue>(null);

const getDefaultValues = (ticket: Cloned<Ticket>): UpdateFormData => {
  return {
    category: ticket?.projectTaskCategory?.id,
    priority: ticket?.priority?.id,
    managedBy: ticket?.managedByContact?.id,
  };
};

type Props = {
  ticket: Cloned<Ticket>;
  children: ReactNode;
};

type TicketDetailsContextValue = {
  ticketForm: UseFormReturn<UpdateFormData>;
  ticket: Cloned<Ticket>;
  loading: boolean;
  handleTicketFormSubmit: (
    value: UpdateFormData,
    onSuccess?: (res: MutateResponse) => Promise<void>,
  ) => Promise<void>;
  handleCancelTicket: () => Promise<void>;
  handleCloseTicket: () => Promise<void>;
  handleAssignment: () => Promise<void>;
  submitFormWithAction: (
    action: (data?: MutateResponse) => Promise<void>,
  ) => Promise<void>;
};

export function TicketDetailsProvider(props: Props) {
  const {children, ticket} = props;

  const {toast} = useToast();

  const ticketForm = useForm<UpdateFormData>({
    resolver: zodResolver(UpdateFormSchema),
    defaultValues: getDefaultValues(ticket),
  });

  const {action: mutateAction, loading: isSubmitting} = useRetryAction(mutate);
  const {action: closeTicketAction, loading: isClosingTicket} = useRetryAction(
    closeTicket,
    i18n.t('Ticket closed'),
  );

  const company = ticket.project?.company?.name ?? '';
  const client = ticket.project?.clientPartner?.simpleFullName ?? '';

  const {action: cancelTicketAction, loading: isCancellingTicket} =
    useRetryAction(cancelTicket, i18n.t('Ticket canceled'));

  const {action: updateAssignmentAction, loading: isUpdatingAssignment} =
    useRetryAction(
      updateAssignment,
      isWithProvider(ticket.assignment)
        ? i18n.t('Ticket assigned to') + ' ' + client
        : i18n.t('Ticket assigned to') + ' ' + company,
    );

  const {workspaceURL, workspaceURI} = useWorkspace();

  const loading =
    isSubmitting ||
    isClosingTicket ||
    isCancellingTicket ||
    isUpdatingAssignment ||
    ticketForm.formState.isSubmitting;

  const getDirtyValues = useCallback(
    (value: UpdateFormData): UpdateFormData | undefined => {
      const dirtyFieldKeys = Object.keys(ticketForm.formState.dirtyFields);
      if (!dirtyFieldKeys.length) return;

      const dirtyValues = pick(value, dirtyFieldKeys) as UpdateFormData;
      return dirtyValues;
    },
    [ticketForm.formState.dirtyFields],
  );

  const handleTicketFormSubmit = useCallback(
    async (
      value: UpdateFormData,
      onSuccess?: (res: MutateResponse) => Promise<void>,
    ) => {
      const dirtyValues = getDirtyValues(value);
      if (!dirtyValues) return;
      const mutateProps: MutateProps = {
        action: {
          type: 'update',
          data: {
            id: ticket.id!,
            version: ticket.version!,
            ...dirtyValues,
          },
        },
        workspaceURL,
        workspaceURI,
      };

      await mutateAction(mutateProps, onSuccess);
    },
    [
      getDirtyValues,
      mutateAction,
      ticket.id,
      ticket.version,
      workspaceURI,
      workspaceURL,
    ],
  );

  const submitFormWithAction = useCallback(
    async (action: (data?: MutateResponse) => Promise<void>) => {
      if (loading) {
        toast({
          variant: 'destructive',
          title: i18n.t('Wait for previous action to finish'),
        });
        return;
      }
      if (!ticketForm.formState.isDirty) return action();

      const isValid = await ticketForm.trigger(undefined, {shouldFocus: true});
      if (!isValid) {
        toast({
          variant: 'destructive',
          title: i18n.t('Form is invalid'),
        });
        return;
      }

      return handleTicketFormSubmit(ticketForm.getValues(), action);
    },
    [loading, ticketForm, handleTicketFormSubmit, toast],
  );

  const handleAssignment = useCallback(async () => {
    submitFormWithAction(data =>
      updateAssignmentAction({
        data: {
          id: ticket.id,
          version: data?.version ?? ticket.version,
          assignment: isWithProvider(ticket.assignment)
            ? ASSIGNMENT.CUSTOMER
            : ASSIGNMENT.PROVIDER,
        },
        workspaceURL,
      }),
    );
  }, [
    submitFormWithAction,
    updateAssignmentAction,
    ticket.id,
    ticket.version,
    ticket.assignment,
    workspaceURL,
  ]);

  const handleCancelTicket = useCallback(async () => {
    submitFormWithAction(data =>
      cancelTicketAction({
        data: {id: ticket.id, version: data?.version ?? ticket.version},
        workspaceURL,
      }),
    );
  }, [
    submitFormWithAction,
    cancelTicketAction,
    ticket.id,
    ticket.version,
    workspaceURL,
  ]);

  const handleCloseTicket = useCallback(async () => {
    submitFormWithAction(data =>
      closeTicketAction({
        data: {id: ticket.id, version: data?.version ?? ticket.version},
        workspaceURL,
      }),
    );
  }, [
    submitFormWithAction,
    closeTicketAction,
    ticket.id,
    ticket.version,
    workspaceURL,
  ]);

  useEffect(() => {
    ticketForm.reset(getDefaultValues(ticket));
  }, [ticket, ticketForm]);

  //NOTE: value can not be momoised since form is referentially stable and will never change.
  const value: TicketDetailsContextValue = {
    ticketForm,
    ticket,
    loading,
    handleTicketFormSubmit,
    handleCancelTicket,
    handleCloseTicket,
    handleAssignment,
    submitFormWithAction,
  };

  return (
    <TicketDetailsContext.Provider value={value}>
      {children}
    </TicketDetailsContext.Provider>
  );
}

export function useTicketDetails() {
  const ticketDetailsContext = useContext(TicketDetailsContext);
  if (!ticketDetailsContext) {
    throw new Error(
      'useTicketDetails has to be used within <TicketDetailsContext.Provider>',
    );
  }
  return ticketDetailsContext;
}
