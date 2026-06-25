'use server';

import {after} from 'next/server';
import {revalidatePath} from 'next/cache';
import {headers} from 'next/headers';
import {ZodIssueCode} from 'zod';

// ---- CORE IMPORTS ---- //
import {TENANT_HEADER} from '@/proxy';
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
import {withBasePath} from '@/lib/core/path/base-path';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessMessage} from '@/lib/core/access/denial';
import {getWorkspaceConfig} from '@/orm/workspace';

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
import {notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';
import sanitize from 'sanitize-html';

export type MutateResponse = {id: string; version: number};

export async function mutate(
  props: MutateProps,
  config?: ActionConfig,
): ActionResponse<MutateResponse> {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const {workspaceURL, workspaceURI, action} = props;

  const {force} = config || {};

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const workspace = {...access.workspace, config: workspaceConfig};

  const allowedFields = new Set(
    workspace.config.ticketingFormFieldSet
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
            !workspace.config.isDisplayChildTicket &&
            !workspace.config.isDisplayTicketParent &&
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
          workspace,
        }),
      );
      after(() =>
        notifyTicketChange({
          type: 'create',
          ticket: created,
          tracks,
          contacts,
          user,
          workspaceUserId: workspace.workspaceUser?.id,
          workspaceURL,
          tenantId,
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
        workspace,
        tenant: access.tenant,
      });
      after(() =>
        notifyTicketChange({
          type: 'update',
          ticket: updated,
          tracks,
          contacts,
          user: access.user,
          workspaceUserId: workspace.workspaceUser?.id,
          workspaceURL,
          tenantId,
          client,
        }),
      );
      ticket = updated;
    }

    if (ticket.project?.id) {
      revalidatePath(
        `${workspaceURI}/ticketing/projects/${ticket.project.id}/tickets`,
      );
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
  workspaceURL: string;
  data: {id: string; version: number; assignment: number};
};

export async function updateAssignment(
  props: UpdateAssignmentProps,
  config?: ActionConfig,
): ActionResponse<true> {
  const {workspaceURL, data} = props;
  const {force} = config || {};

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const workspace = {...access.workspace, config: workspaceConfig};
  const {workspaceUser} = workspace;

  if (!workspace.config.isDisplayAssignmentBtn) {
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
      workspace.config.ticketStatusChangeMethod === STATUS_CHANGE_METHOD.WS;

    const {ticket, tracks, contacts} = await updateTicket({
      data: updateData,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace,
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
        workspaceURL,
        tenantId,
        client,
      }),
    );
    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

export type TicketActionProps = {
  workspaceURL: string;
  data: {id: string; version: number};
};

export async function closeTicket(
  props: TicketActionProps,
  config?: ActionConfig,
): ActionResponse<true> {
  const {workspaceURL, data} = props;
  const {force} = config || {};

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const workspace = {...access.workspace, config: workspaceConfig};
  const {workspaceUser} = workspace;

  if (!workspace.config.isDisplayCloseBtn) {
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
      workspace.config.ticketStatusChangeMethod === STATUS_CHANGE_METHOD.WS;

    const {ticket, tracks, contacts} = await updateTicket({
      data: updateData,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace,
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
        workspaceURL,
        tenantId,
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
  const {workspaceURL, data} = props;
  const {force} = config || {};

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const workspace = {...access.workspace, config: workspaceConfig};
  const {workspaceUser} = workspace;

  if (!workspace.config.isDisplayCancelBtn) {
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
      workspace.config.ticketStatusChangeMethod === STATUS_CHANGE_METHOD.WS;

    const {ticket, tracks, contacts} = await updateTicket({
      data: updateData,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace,
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
        workspaceURL,
        tenantId,
        client,
      }),
    );

    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

type CreateRelatedLinkProps = {
  workspaceURL: string;
  data: {currentTicketId: ID; linkTicketId: ID; linkType: ID};
};

export async function createRelatedLink(
  props: CreateRelatedLinkProps,
): ActionResponse<true> {
  const {workspaceURL, data} = props;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const workspace = {...access.workspace, config: workspaceConfig};
  if (!workspace.config.isDisplayRelatedTicket) {
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
        workspace,
      }),
    );
    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

type CreateChildLinkProps = {
  workspaceURL: string;
  data: {currentTicketId: ID; linkTicketId: ID};
};

export async function createChildLink(
  props: CreateChildLinkProps,
): ActionResponse<true> {
  const {workspaceURL, data} = props;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const workspace = {...access.workspace, config: workspaceConfig};
  if (
    !workspace.config.isDisplayChildTicket &&
    !workspace.config.isDisplayTicketParent
  ) {
    return {error: true, message: await t('Parent child relation not enabled')};
  }
  try {
    await createChildTicketLink({
      data,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace,
    });

    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

export async function createParentLink(
  props: CreateChildLinkProps,
): ActionResponse<true> {
  const {workspaceURL, data} = props;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const workspace = {...access.workspace, config: workspaceConfig};
  if (
    !workspace.config.isDisplayChildTicket &&
    !workspace.config.isDisplayTicketParent
  ) {
    return {error: true, message: await t('Parent child relation not enabled')};
  }

  try {
    await createParentTicketLink({
      data,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace,
    });
    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

type DeleteChildLinkProps = {
  workspaceURL: string;
  data: {currentTicketId: ID; linkTicketId: ID};
};

export async function deleteChildLink(
  props: DeleteChildLinkProps,
): ActionResponse<true> {
  const {workspaceURL, data} = props;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const workspace = {...access.workspace, config: workspaceConfig};
  if (
    !workspace.config.isDisplayChildTicket &&
    !workspace.config.isDisplayTicketParent
  ) {
    return {error: true, message: await t('Parent child relation not enabled')};
  }

  try {
    await deleteChildTicketLink({
      data,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace,
    });
    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

type DeleteParentLinkProps = {
  workspaceURL: string;
  data: {currentTicketId: ID; linkTicketId: ID};
};

export async function deleteParentLink(
  props: DeleteParentLinkProps,
): ActionResponse<true> {
  const {workspaceURL, data} = props;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const workspace = {...access.workspace, config: workspaceConfig};
  if (
    !workspace.config.isDisplayChildTicket &&
    !workspace.config.isDisplayTicketParent
  ) {
    return {error: true, message: await t('Parent child relation not enabled')};
  }

  try {
    await deleteParentTicketLink({
      data,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace,
    });
    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}
type DeleteRelatedLinkProps = {
  workspaceURL: string;
  data: {currentTicketId: ID; linkTicketId: ID; linkId: ID};
};

export async function deleteRelatedLink(
  props: DeleteRelatedLinkProps,
): ActionResponse<number> {
  const {workspaceURL, data} = props;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const workspace = {...access.workspace, config: workspaceConfig};
  if (!workspace.config.isDisplayRelatedTicket) {
    return {error: true, message: await t('Related tickets are not enabled')};
  }

  try {
    const count = await deleteRelatedTicketLink({
      data,
      client,
      user: access.user,
      subapp: access.subapp,
      workspace,
    });

    return {success: true, data: count};
  } catch (e) {
    return handleError(e);
  }
}

export async function searchTickets({
  search,
  workspaceURL,
  projectId,
  excludeList,
}: {
  search?: string;
  workspaceURL: string;
  projectId?: ID;
  excludeList?: ID[];
}): ActionResponse<Cloned<TicketSearch>[]> {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
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
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const parsed = CreateCommentPropsSchema.safeParse(props);
  if (!parsed.success) {
    return {error: true, message: await t('Invalid request')};
  }
  const {workspaceURL, workspaceURI, ...rest} = parsed.data;

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user, subapp} = access;
  const {client} = access.tenant;
  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const workspace = {...access.workspace, config: workspaceConfig};

  const {workspaceUser} = workspace;

  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (
    !isCommentEnabled({
      subapp: SUBAPP_CODES.ticketing,
      config: workspace.config,
    })
  ) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.ticketing];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const ticket = await findTicketAccess({
    recordId: rest.recordId,
    client,
    user,
    subapp,
    workspace,
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
        ...rest,
      }),
    );

    const [comment, parentComment] = res;

    const commentBody = sanitize(comment.note || '', {
      allowedTags: [],
      allowedAttributes: {},
    })
      .replace(/\s+/g, ' ')
      .trim();

    const ticketUrl = withBasePath(
      `${workspaceURI}/${SUBAPP_CODES.ticketing}/projects/${ticket.project?.id}/tickets/${ticket.id}`,
    );
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
            tenantId,
            workspaceURL,
            client,
            payload: {
              title: await tr(
                '{0} replied to your comment on {1}',
                userName,
                ticket.name,
              ),
              body: commentBody,
              url: `${ticketUrl}#comment-${comment.id}`,
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
      for (const contact of contacts) {
        const tr = getTranslation.bind(null, {
          locale: contact.localization?.code || DEFAULT_LOCALE,
          tenant: tenantId,
        });
        after(async () => {
          await notifyUser({
            userId: contact.id,
            tenantId,
            workspaceURL,
            client,
            payload: {
              title: await tr(
                '{0} added a comment on {1}',
                userName,
                String(ticket.name),
              ),
              body: commentBody,
              url: `${ticketUrl}#comment-${comment.id}`,
              tag: NotificationTag.ticketComment(ticket.id),
            },
            getReplacementTitle: count =>
              tr(
                'You have {0} new comments on "{1}"',
                String(count),
                String(ticket.name),
              ),
          });
        });
      }
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
            ticketLink: `${workspaceURL}/${SUBAPP_CODES.ticketing}/projects/${ticket.project?.id}/tickets/${ticket.id}`,
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
  const {workspaceURL, ...rest} = FetchCommentsPropsSchema.parse(props);

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.ticketing,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });

  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );

  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const workspace = {...access.workspace, config: workspaceConfig};

  const {workspaceUser} = workspace;

  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (
    !isCommentEnabled({
      subapp: SUBAPP_CODES.ticketing,
      config: workspace.config,
    })
  ) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.ticketing];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const ticket = await findTicketAccess({
    recordId: rest.recordId,
    client,
    user: access.user,
    subapp: access.subapp,
    workspace,
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
      ...rest,
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
