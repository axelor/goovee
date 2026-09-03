import {i18n} from '@/locale';
import {useToast} from '@/ui/hooks';
import type {ID} from '@/types';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {
  deleteChildLink,
  deleteParentLink,
  deleteRelatedLink,
} from '../../../actions';
import {Button} from '../delete-button';
import {useTicketDetails} from '../ticket-details/ticket-details-provider';

export function RemoveLinkButton({
  ticketId,
  linkId,
  relatedTicketId,
}: {
  ticketId: ID;
  linkId: ID;
  relatedTicketId: ID;
}) {
  const router = useRouter();
  const {toast} = useToast();
  const {submitFormWithAction, loading: isSubmitting} = useTicketDetails();
  const [loading, setLoading] = useState(false);

  const deleteAction = async () => {
    if (!loading && !isSubmitting) {
      try {
        const {error, message} = await deleteRelatedLink({
          data: {
            currentTicketId: ticketId,
            linkTicketId: relatedTicketId,
            linkId,
          },
        });

        if (error) {
          toast({
            variant: 'destructive',
            title: message,
          });
          return;
        }

        toast({
          variant: 'success',
          title: i18n.t('Link removed'),
        });

        router.refresh();
      } catch (e) {
        if (e instanceof Error) {
          toast({
            variant: 'destructive',
            title: e.message,
          });
          return;
        }
        toast({
          variant: 'destructive',
          title: i18n.t('An error occurred'),
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    submitFormWithAction(deleteAction);
  };

  return <Button onClick={handleDelete} disabled={loading || isSubmitting} />;
}

export function RemoveChildButton({
  ticketId,
  relatedTicketId,
}: {
  ticketId: ID;
  relatedTicketId: ID;
}) {
  const router = useRouter();
  const {toast} = useToast();
  const {submitFormWithAction, loading: isSubmitting} = useTicketDetails();
  const [loading, setLoading] = useState(false);

  const deleteAction = async () => {
    if (!loading && !isSubmitting) {
      try {
        const {error, message} = await deleteChildLink({
          data: {
            currentTicketId: ticketId,
            linkTicketId: relatedTicketId,
          },
        });

        if (error) {
          toast({
            variant: 'destructive',
            title: message,
          });
          return;
        }

        toast({
          variant: 'success',
          title: i18n.t('Link removed'),
        });

        router.refresh();
      } catch (e) {
        if (e instanceof Error) {
          toast({
            variant: 'destructive',
            title: e.message,
          });
          return;
        }
        toast({
          variant: 'destructive',
          title: i18n.t('An error occurred'),
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    submitFormWithAction(deleteAction);
  };

  return <Button onClick={handleDelete} disabled={loading || isSubmitting} />;
}

export function RemoveParentButton({
  ticketId,
  relatedTicketId,
}: {
  ticketId: ID;
  relatedTicketId: ID;
}) {
  const router = useRouter();
  const {submitFormWithAction, loading: isSubmitting} = useTicketDetails();
  const {toast} = useToast();
  const [loading, setLoading] = useState(false);

  const deleteAction = async () => {
    if (!loading && !isSubmitting) {
      try {
        const {error, message} = await deleteParentLink({
          data: {
            currentTicketId: ticketId,
            linkTicketId: relatedTicketId,
          },
        });

        if (error) {
          toast({
            variant: 'destructive',
            title: message,
          });
          return;
        }

        toast({
          variant: 'success',
          title: i18n.t('Link removed'),
        });

        router.refresh();
      } catch (e) {
        if (e instanceof Error) {
          toast({
            variant: 'destructive',
            title: e.message,
          });
          return;
        }
        toast({
          variant: 'destructive',
          title: i18n.t('An error occurred'),
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    submitFormWithAction(deleteAction);
  };

  return <Button onClick={handleDelete} disabled={loading || isSubmitting} />;
}
