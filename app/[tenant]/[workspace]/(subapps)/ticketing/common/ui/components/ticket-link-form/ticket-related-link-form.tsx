import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/ui/components/form';
import type {ID} from '@/types';
import {zodResolver} from '@hookform/resolvers/zod';
import {useMemo, useRef} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';

import type {TicketLink} from '../../../../common/types';
import {
  createChildLink,
  createParentLink,
  createRelatedLink,
} from '../../../actions';
import {useRetryAction} from '../../../hooks';
import {
  ChildTicketSchema,
  RelatedTicketSchema,
} from '../../../utils/validators';
import {useTicketDetails} from '../ticket-details/ticket-details-provider';
import {TicketSelect} from '../ticket-select';
import {useRouter} from 'next/navigation';
import {useToast} from '@/ui/hooks';

export function TicketRelatedLinkForm({
  linkTypes,
  ticketId,
  onSubmit,
  links,
  projectId,
}: {
  linkTypes: {
    id: string;
    name: string;
  }[];
  ticketId: ID;
  projectId: ID;
  links: Cloned<TicketLink>[];
  onSubmit: () => void;
}) {
  const {workspaceURL} = useWorkspace();
  const router = useRouter();
  const {toast} = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<z.infer<typeof RelatedTicketSchema>>({
    resolver: zodResolver(RelatedTicketSchema),
    defaultValues: {
      linkType: linkTypes[0]?.id,
      ticket: undefined,
    },
  });

  const {loading, submitFormWithAction} = useTicketDetails();
  const {action, loading: isSubmitting} = useRetryAction(createRelatedLink);

  const handleSubmit = async (values: z.infer<typeof RelatedTicketSchema>) => {
    submitFormWithAction(async () => {
      await action(
        {
          workspaceURL,
          data: {
            linkType: values.linkType,
            linkTicketId: values.ticket.id,
            currentTicketId: ticketId,
          },
        },
        {
          onDiscard: () => router.refresh(),
          onSuccess: () => {
            router.refresh();
            toast({
              variant: 'success',
              title: i18n.t('Link created'),
            });
          },
        },
      );
      onSubmit();
    });
  };

  const excludeList = useMemo(
    () =>
      links
        .map(({relatedTask}) => relatedTask?.id)
        .concat(ticketId.toString())
        .filter(Boolean) as string[],
    [links, ticketId],
  );

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4">
        <div className="flex gap-4 p-2 flex-col lg:flex-row">
          <FormField
            control={form.control}
            name="linkType"
            render={({field}) => (
              <FormItem className="lg:basis-1/3 text-primary">
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {linkTypes.map(linkType => (
                        <SelectItem value={linkType.id} key={linkType.id}>
                          {linkType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ticket"
            render={({field}) => (
              <FormItem className="lg:basis-2/3">
                <FormControl>
                  <TicketSelect
                    className="w-full border-input"
                    value={field.value}
                    onChange={field.onChange}
                    excludeList={excludeList}
                    projectId={projectId}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          size="sm"
          variant="royal"
          className="ms-auto"
          disabled={loading || isSubmitting || form.formState.isSubmitting}>
          {i18n.t('Create Link')}
        </Button>
      </form>
    </Form>
  );
}

export function TicketChildLinkForm({
  ticketId,
  parentIds,
  childrenIds,
  projectId,
  onSubmit,
}: {
  ticketId: ID;
  parentIds: ID[];
  childrenIds: ID[];
  projectId?: ID;
  onSubmit: () => void;
}) {
  const {workspaceURL} = useWorkspace();
  const router = useRouter();
  const {toast} = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<z.infer<typeof ChildTicketSchema>>({
    resolver: zodResolver(ChildTicketSchema),
  });

  const {loading, submitFormWithAction} = useTicketDetails();
  const {action, loading: isSubmitting} = useRetryAction(createChildLink);

  const handleSubmit = async (values: z.infer<typeof ChildTicketSchema>) => {
    submitFormWithAction(async () => {
      await action(
        {
          workspaceURL,
          data: {
            linkTicketId: values.ticket.id,
            currentTicketId: ticketId,
          },
        },
        {
          onDiscard: () => router.refresh(),
          onSuccess: () => {
            router.refresh();
            toast({
              variant: 'success',
              title: i18n.t('Link created'),
            });
          },
        },
      );
      onSubmit();
    });
  };

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4">
        <div className="flex gap-4 flex-col lg:flex-row">
          <FormField
            control={form.control}
            name="ticket"
            render={({field}) => (
              <FormItem className="lg:grow-[2]">
                <FormControl>
                  <TicketSelect
                    className="w-full border-input"
                    value={field.value}
                    onChange={field.onChange}
                    excludeList={[ticketId, ...parentIds, ...childrenIds]}
                    projectId={projectId}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          size="sm"
          variant="royal"
          className="ms-auto"
          disabled={loading || form.formState.isSubmitting || isSubmitting}>
          {i18n.t('Create Link')}
        </Button>
      </form>
    </Form>
  );
}

export function TicketParentLinkForm({
  ticketId,
  childrenIds,
  parentId,
  projectId,
  onSubmit,
}: {
  ticketId: ID;
  parentId?: ID;
  childrenIds: ID[];
  projectId?: ID;
  onSubmit: () => void;
}) {
  const {workspaceURL} = useWorkspace();
  const {toast} = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<z.infer<typeof ChildTicketSchema>>({
    resolver: zodResolver(ChildTicketSchema),
  });

  const {loading, submitFormWithAction} = useTicketDetails();
  const {action, loading: isSubmitting} = useRetryAction(createParentLink);

  const handleSubmit = async (values: z.infer<typeof ChildTicketSchema>) => {
    submitFormWithAction(async () => {
      await action(
        {
          workspaceURL,
          data: {
            linkTicketId: values.ticket.id,
            currentTicketId: ticketId,
          },
        },
        {
          onDiscard: () => router.refresh(),
          onSuccess: () => {
            router.refresh();
            toast({
              variant: 'success',
              title: i18n.t('Link created'),
            });
          },
        },
      );
      onSubmit();
    });
  };

  const excludeList = [ticketId, ...childrenIds];
  if (parentId) {
    excludeList.push(parentId);
  }

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4">
        <div className="flex gap-4 flex-col lg:flex-row">
          <FormField
            control={form.control}
            name="ticket"
            render={({field}) => (
              <FormItem className="lg:grow-[2]">
                <FormControl>
                  <TicketSelect
                    className="w-full border-input"
                    value={field.value}
                    onChange={field.onChange}
                    excludeList={excludeList}
                    projectId={projectId}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          size="sm"
          variant="royal"
          className="ms-auto"
          disabled={loading || form.formState.isSubmitting || isSubmitting}>
          {i18n.t('Create Link')}
        </Button>
      </form>
    </Form>
  );
}
