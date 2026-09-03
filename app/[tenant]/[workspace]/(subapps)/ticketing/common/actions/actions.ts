'use server';

import {after} from 'next/server';
import {ZodIssueCode} from 'zod';

// ---- CORE IMPORTS ---- //
import type {WorkspaceSubPath} from '@/lib/core/url';
import {t, getTranslation} from '@/locale/server';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {clone, uniqueById} from '@/utils';
import type {ID} from '@/types';
import type {Cloned} from '@/types/util';
import type {ActionResponse} from '@/types/action';
import {addComment, findComments} from '@/comments/orm';
import {
  CreateComment,
  CreateCommentPropsSchema,
  FetchComments,
  FetchCommentsPropsSchema,
  isCommentEnabled,
} from '@/comments';
import {ModelMap, SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessMessage} from '@/lib/core/access/denial';
import {getTicketingConfig} from '../orm/config';

// ---- LOCAL IMPORTS ---- //
import {
  FIELDS,
  MUTATE_TYPE,
  STATUS_CHANGE_METHOD,
  UPDATABLE_FIELDS,
} from '../constants';
import {findTicketCancelledStatus, findTicketDoneStatus} from '../orm/projects';
import type {TicketSearch} from '../types';
import {
  createChildTicketLink,
  createParentTicketLink,
  createRelatedTicketLink,
  createTicket,
  deleteChildTicketLink,
  deleteParentTicketLink,
  deleteRelatedTicketLink,
  findTicketAccess,
  findTicketsBySearch,
  findTicketVersion,
  updateTicket,
} from '../orm/tickets';
import {notifyTicketChange} from '../utils/notify';
import {CreateTicketSchema, UpdateTicketSchema} from '../utils/validators';
import {handleError} from './helpers';
import type {ActionConfig, MutateProps} from './types';
import {getMailRecipients} from '../orm/mail';
import {sendCommentMail} from '../utils/mail';
import {notifyAll, notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';
import sanitize from 'sanitize-html';

export type MutateResponse = {id: string; version: number};

export async function mutate(
  props: MutateProps,
  config?: ActionConfig,
): ActionResponse<MutateResponse> {
  const {action} = props;

  const {force} = config || {};

  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getTicketingConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const allowedFields = new Set(
    workspaceConfig.ticketingFormFieldSet
      ?.map(f => f.name)
      .filter(
        (name): name is string => !!name && UPDATABLE_FIELDS.includes(name),
      ),
  );

  try {
    let ticket;
    if (action.type === MUTATE_TYPE.CREATE) {
      const refinedSchema = CreateTicketSchema.superRefine(
        async (data, ctx) => {
          if (allowedFields.has(FIELDS.CATEGORY) && !data.category) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              path: ['category'],
              message: await t('Category is required'),
            });
          }
          if (data.category && !allowedFields.has(FIELDS.CATEGORY)) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              path: ['category'],
              message: await t('Updating Category is not allowed'),
            });
          }

          if (allowedFields.has(FIELDS.PRIORITY) && !data.priority) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              path: ['priority'],
              message: await t('Priority is required'),
            });
          }

          if (data.priority && !allowedFields.has(FIELDS.PRIORITY)) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              path: ['priority'],
              message: await t('Updating Priority is not allowed'),
            });
          }

          if (allowedFields.has(FIELDS.MANAGED_BY) && !data.managedBy) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              path: ['managedBy'],
              message: await t('Managed by is required'),
            });
          }

          if (data.managedBy && !allowedFields.has(FIELDS.MANAGED_BY)) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              path: ['managedBy'],
              message: await t('Updating Managed by is not allowed'),
            });
          }

          if (
            !workspaceConfig.isDisplayChildTicket &&
            !workspaceConfig.isDisplayTicketParent &&
            data.parentId
          ) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              path: ['parentId'],
              message: await t('Parent child relation not enabled'),
            });
          }
        },
      );
      const createData = await refinedSchema.parseAsync(action.data);
      /* createTicket does create + update (to set fullName from generated id),
         so we wrap in a transaction to keep them atomic. */
      const {user, subapp} = access;
      const {
        ticket: created,
        tracks,
        contacts,
      } = await access.tenant.client.$transaction(txClient =>
        createTicket({
          data: createData,
          client: txClient,
          user,
          subapp,
          workspace: access.workspace,
        }),
      );
      after(() =>
        notifyTicketChange({
          type: 'create',
          ticket: created,
          tracks,
          contacts,
          user,
          workspaceUserId: access.workspace.workspaceUser?.id,
          tenantId: access.tenant.id,
          workspaceURL: access.workspace.url,
          client,
        }),
      );
      ticket = created;
    } else {
      const refinedSchema = UpdateTicketSchema.superRefine(
        async (data, ctx) => {
          if (data.category && !allowedFields.has(FIELDS.CATEGORY)) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              path: ['category'],
              message: await t('Updating Category is not allowed'),
            });
          }

          if (data.priority && !allowedFields.has(FIELDS.PRIORITY)) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              path: ['priority'],
              message: await t('Updating Priority is not allowed'),
            });
          }

          if (data.managedBy && !allowedFields.has(FIELDS.MANAGED_BY)) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              path: ['managedBy'],
              message: await t('Updating Managed by is not allowed'),
            });
          }
        },
      );

      const updateData = await refinedSchema.parseAsync(action.data);
      if (force) {
        const version = await findTicketVersion(updateData.id, client);
        updateData.version = version;
      }
      const {
        ticket: updated,
        tracks,
        contacts,
      } = await updateTicket({
        data: updateData,
        client,
        user: access.user,
        subapp: access.subapp,
        workspace: access.workspace,
        tenant: access.tenant,
      });
      after(() =>
        notifyTicketChange({
          type: 'update',
          ticket: updated,
          tracks,
          contacts,
          user: access.user,
          workspaceUserId: access.workspace.workspaceUser?.id,
          tenantId: access.tenant.id,
          workspaceURL: access.workspace.url,
          client,
        }),
      );
      ticket = updated;
    }

    if (ticket.project?.id) {
      access.url.revalidate(`/ticketing/projects/${ticket.project.id}/tickets`);
    }

    return {
      success: true,
      data: {id: ticket.id, version: ticket.version},
    };
  } catch (e) {
    return handleError(e);
  }
}

export type UpdateAssignmentProps = {
  data: {id: string; version: number; assignment: number};
};

export async function updateAssignment(
  props: UpdateAssignmentProps,
  config?: ActionConfig,
): ActionResponse<true> {
  const {data} = props;
  const {force} = config || {};

  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getTicketingConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const {workspaceUser} = access.workspace;

  if (!workspaceConfig.isDisplayAssignmentBtn) {
    return {
      error: true,
      message: await t('Updating AssignedTo is not allowed'),
    };
  }

  try {
    const updateData = UpdateTicketSchema.parse({
      id: data.id,
      version: data.version,
      assignment: data.assignment,
    });

    if (force) {
      const version = await findTicketVersion(updateData.id, client);
      updateData.version = version;
    }

    const fromWS =
      workspaceConfig.ticketStatusChangeMethod === STATUS_CHANGE_METHOD.WS;

    const {ticket, tracks, contacts} = await updateTicket({
      data: updateData,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace: access.workspace,
      tenant: access.tenant,
      fromWS,
    });
    after(() =>
      notifyTicketChange({
        type: 'update',
        ticket,
        tracks,
        contacts,
        user: access.user,
        workspaceUserId: fromWS ? undefined : workspaceUser?.id,
        tenantId: access.tenant.id,
        workspaceURL: access.workspace.url,
        client,
      }),
    );
    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

export type TicketActionProps = {
  data: {id: string; version: number};
};

export async function closeTicket(
  props: TicketActionProps,
  config?: ActionConfig,
): ActionResponse<true> {
  const {data} = props;
  const {force} = config || {};

  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getTicketingConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const {workspaceUser} = access.workspace;

  if (!workspaceConfig.isDisplayCloseBtn) {
    return {
      error: true,
      message: await t('Closing ticket not allowed'),
    };
  }

  try {
    const status = await findTicketDoneStatus(client);

    if (!status) {
      return {
        error: true,
        message: await t('Done status not configured'),
      };
    }

    const updateData = UpdateTicketSchema.parse({
      id: data.id,
      version: data.version,
      status,
    });

    if (force) {
      const version = await findTicketVersion(updateData.id, client);
      updateData.version = version;
    }

    const fromWS =
      workspaceConfig.ticketStatusChangeMethod === STATUS_CHANGE_METHOD.WS;

    const {ticket, tracks, contacts} = await updateTicket({
      data: updateData,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace: access.workspace,
      tenant: access.tenant,
      fromWS,
    });
    after(() =>
      notifyTicketChange({
        type: 'update',
        ticket,
        tracks,
        contacts,
        user: access.user,
        workspaceUserId: fromWS ? undefined : workspaceUser?.id,
        tenantId: access.tenant.id,
        workspaceURL: access.workspace.url,
        client,
      }),
    );

    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

export async function cancelTicket(
  props: TicketActionProps,
  config?: ActionConfig,
): ActionResponse<true> {
  const {data} = props;
  const {force} = config || {};

  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getTicketingConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const {workspaceUser} = access.workspace;

  if (!workspaceConfig.isDisplayCancelBtn) {
    return {
      error: true,
      message: await t('Cancelling ticket not allowed'),
    };
  }

  try {
    const status = await findTicketCancelledStatus(client);
    if (!status) {
      return {
        error: true,
        message: await t('Cancelled status not configured'),
      };
    }

    const updateData = UpdateTicketSchema.parse({
      id: data.id,
      version: data.version,
      status,
    });

    if (force) {
      const version = await findTicketVersion(updateData.id, client);
      updateData.version = version;
    }

    const fromWS =
      workspaceConfig.ticketStatusChangeMethod === STATUS_CHANGE_METHOD.WS;

    const {ticket, tracks, contacts} = await updateTicket({
      data: updateData,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace: access.workspace,
      tenant: access.tenant,
      fromWS,
    });
    after(() =>
      notifyTicketChange({
        type: 'update',
        ticket,
        tracks,
        contacts,
        user: access.user,
        workspaceUserId: fromWS ? undefined : workspaceUser?.id,
        tenantId: access.tenant.id,
        workspaceURL: access.workspace.url,
        client,
      }),
    );

    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

type CreateRelatedLinkProps = {
  data: {currentTicketId: ID; linkTicketId: ID; linkType: ID};
};

export async function createRelatedLink(
  props: CreateRelatedLinkProps,
): ActionResponse<true> {
  const {data} = props;

  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getTicketingConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  if (!workspaceConfig.isDisplayRelatedTicket) {
    return {error: true, message: await t('Related tickets are not enabled')};
  }

  try {
    /* createRelatedTicketLink creates two link records + back-reference update,
       so we wrap in a transaction to keep them atomic. */
    const {user, subapp} = access;
    await access.tenant.client.$transaction(txClient =>
      createRelatedTicketLink({
        data,
        client: txClient,
        user,
        subapp,
        workspace: access.workspace,
      }),
    );
    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

type CreateChildLinkProps = {
  data: {currentTicketId: ID; linkTicketId: ID};
};

export async function createChildLink(
  props: CreateChildLinkProps,
): ActionResponse<true> {
  const {data} = props;

  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getTicketingConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  if (
    !workspaceConfig.isDisplayChildTicket &&
    !workspaceConfig.isDisplayTicketParent
  ) {
    return {error: true, message: await t('Parent child relation not enabled')};
  }
  try {
    await createChildTicketLink({
      data,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace: access.workspace,
    });

    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

export async function createParentLink(
  props: CreateChildLinkProps,
): ActionResponse<true> {
  const {data} = props;

  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getTicketingConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  if (
    !workspaceConfig.isDisplayChildTicket &&
    !workspaceConfig.isDisplayTicketParent
  ) {
    return {error: true, message: await t('Parent child relation not enabled')};
  }

  try {
    await createParentTicketLink({
      data,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace: access.workspace,
    });
    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

type DeleteChildLinkProps = {
  data: {currentTicketId: ID; linkTicketId: ID};
};

export async function deleteChildLink(
  props: DeleteChildLinkProps,
): ActionResponse<true> {
  const {data} = props;

  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getTicketingConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  if (
    !workspaceConfig.isDisplayChildTicket &&
    !workspaceConfig.isDisplayTicketParent
  ) {
    return {error: true, message: await t('Parent child relation not enabled')};
  }

  try {
    await deleteChildTicketLink({
      data,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace: access.workspace,
    });
    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

type DeleteParentLinkProps = {
  data: {currentTicketId: ID; linkTicketId: ID};
};

export async function deleteParentLink(
  props: DeleteParentLinkProps,
): ActionResponse<true> {
  const {data} = props;

  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getTicketingConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  if (
    !workspaceConfig.isDisplayChildTicket &&
    !workspaceConfig.isDisplayTicketParent
  ) {
    return {error: true, message: await t('Parent child relation not enabled')};
  }

  try {
    await deleteParentTicketLink({
      data,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace: access.workspace,
    });
    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}
type DeleteRelatedLinkProps = {
  data: {currentTicketId: ID; linkTicketId: ID; linkId: ID};
};

export async function deleteRelatedLink(
  props: DeleteRelatedLinkProps,
): ActionResponse<number> {
  const {data} = props;

  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getTicketingConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  if (!workspaceConfig.isDisplayRelatedTicket) {
    return {error: true, message: await t('Related tickets are not enabled')};
  }

  try {
    const count = await deleteRelatedTicketLink({
      data,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace: access.workspace,
    });

    return {success: true, data: count};
  } catch (e) {
    return handleError(e);
  }
}

export async function searchTickets({
  search,
  projectId,
  excludeList,
}: {
  search?: string;
  projectId?: ID;
  excludeList?: ID[];
}): ActionResponse<Cloned<TicketSearch>[]> {
  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const tickets = await findTicketsBySearch({
    search,
    projectId,
    excludeList,
    client: access.tenant.client,
    user: access.user,
    subapp: access.subapp,
    workspace: access.workspace,
  });

  return {success: true, data: clone(tickets)};
}

export const createComment: CreateComment = async props => {
  const parsed = CreateCommentPropsSchema.safeParse(props);
  if (!parsed.success) {
    return {error: true, message: await t('Invalid request')};
  }
  const commentProps = parsed.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const tenantId = access.tenant.id;
  const workspaceURL = access.workspace.url;
  const {user, subapp} = access;
  const {client} = access.tenant;
  const workspaceConfig = await getTicketingConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const {workspaceUser} = access.workspace;

  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (
    !isCommentEnabled({
      subapp: SUBAPP_CODES.ticketing,
      config: workspaceConfig,
    })
  ) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.ticketing];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const ticket = await findTicketAccess({
    recordId: commentProps.recordId,
    client,
    user,
    subapp,
    workspace: access.workspace,
    select: {
      name: true,
      project: {id: true, name: true},
      managedByContact: {id: true, localization: {code: true}},
      createdByContact: {id: true, localization: {code: true}},
    },
  });

  if (!ticket) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    // keeps attachment tokens redeemable if creation fails
    const res = await access.tenant.client.$transaction(txClient =>
      addComment({
        modelName,
        userId: user.id,
        workspaceUserId: workspaceUser.id,
        client: txClient,
        commentField: 'note',
        trackingField: 'publicBody',
        subject: `${user.simpleFullName || user.name} added a comment`,
        ...commentProps,
      }),
    );

    const [comment, parentComment] = res;

    const commentBody = sanitize(comment.note || '', {
      allowedTags: [],
      allowedAttributes: {},
    })
      .replace(/\s+/g, ' ')
      .trim();

    const ticketSubPath: WorkspaceSubPath = `/${SUBAPP_CODES.ticketing}/projects/${ticket.project?.id}/tickets/${ticket.id}`;
    const userName = user.simpleFullName || user.name || '';

    const contacts = uniqueById(
      parentComment?.partner
        ? [parentComment.partner]
        : [ticket.createdByContact, ticket.managedByContact],
    ).filter(c => c.id !== user.id); // exclude the commenter from the list

    if (parentComment) {
      const [partner] = contacts;
      if (partner) {
        const tr = getTranslation.bind(null, {
          locale: partner.localization?.code || DEFAULT_LOCALE,
          tenant: tenantId,
        });
        after(async () => {
          await notifyUser({
            userId: partner.id,
            tenantId: access.tenant.id,
            workspaceURL: access.workspace.url,
            client,
            payload: {
              title: await tr(
                '{0} replied to your comment on {1}',
                userName,
                ticket.name,
              ),
              body: commentBody,
              link: `${ticketSubPath}#comment-${comment.id}`,
              tag: NotificationTag.ticketReply(parentComment.id),
            },
            getReplacementTitle: count =>
              tr(
                'You have {0} new replies to your comment on "{1}"',
                String(count),
                ticket.name,
              ),
          });
        });
      }
    } else {
      after(() =>
        notifyAll(contacts, async contact => {
          const tr = getTranslation.bind(null, {
            locale: contact.localization?.code || DEFAULT_LOCALE,
            tenant: tenantId,
          });

          return {
            userId: contact.id,
            tenantId: access.tenant.id,
            workspaceURL: access.workspace.url,
            client,
            payload: {
              title: await tr(
                '{0} added a comment on {1}',
                userName,
                String(ticket.name),
              ),
              body: commentBody,
              link: `${ticketSubPath}#comment-${comment.id}`,
              tag: NotificationTag.ticketComment(ticket.id),
            },
            getReplacementTitle: (count: number) =>
              tr(
                'You have {0} new comments on "{1}"',
                String(count),
                String(ticket.name),
              ),
          };
        }),
      );
    }

    after(async () => {
      try {
        const reciepients = await getMailRecipients({
          contacts,
          client,
          workspaceURL,
        });
        if (reciepients.length) {
          await sendCommentMail({
            comment,
            parentComment,
            ticketLink: access.url.forExternal(
              `/${SUBAPP_CODES.ticketing}/projects/${ticket.project?.id}/tickets/${ticket.id}`,
            ),
            projectName: ticket.project?.name || '',
            ticketName: ticket.name,
            reciepients,
            tenant: tenantId,
          });
        }
      } catch (e) {
        console.error('Error sending comment email: ');
        console.error(e);
      }
    });

    return {success: true, data: clone(res)};
  } catch (e) {
    return {
      error: true,
      message:
        e instanceof Error
          ? e.message
          : await t('An unexpected error occurred while fetching comments.'),
    };
  }
};

export const fetchComments: FetchComments = async props => {
  const commentQuery = FetchCommentsPropsSchema.parse(props);

  const access = await ensureAccess({
    code: SUBAPP_CODES.ticketing,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getTicketingConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const {workspaceUser} = access.workspace;

  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (
    !isCommentEnabled({
      subapp: SUBAPP_CODES.ticketing,
      config: workspaceConfig,
    })
  ) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.ticketing];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const ticket = await findTicketAccess({
    recordId: commentQuery.recordId,
    client,
    user: access.user,
    subapp: access.subapp,
    workspace: access.workspace,
  });

  if (!ticket) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    const data = await findComments({
      modelName,
      client,
      commentField: 'note',
      trackingField: 'publicBody',
      ...commentQuery,
    });
    return {success: true, data: clone(data)};
  } catch (e) {
    return {
      error: true,
      message:
        e instanceof Error
          ? e.message
          : await t('An unexpected error occurred while fetching comments.'),
    };
  }
};
