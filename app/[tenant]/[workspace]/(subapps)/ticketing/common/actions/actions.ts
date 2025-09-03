'use server';

import {revalidatePath} from 'next/cache';
import {headers} from 'next/headers';
import {ZodIssueCode} from 'zod';

// ---- CORE IMPORTS ---- //
import {TENANT_HEADER} from '@/middleware';
import {t} from '@/locale/server';
import {clone} from '@/utils';
import type {ID} from '@goovee/orm';
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
import {zodParseFormData} from '@/utils/formdata';
import {ModelMap, SUBAPP_CODES} from '@/constants';

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
import {ensureAuth} from '../utils/auth-helper';
import {CreateTicketSchema, UpdateTicketSchema} from '../utils/validators';
import {handleError} from './helpers';
import type {ActionConfig, MutateProps} from './types';
import {getMailRecipients} from '../orm/mail';
import {sendCommentMail} from '../utils/mail';

export type MutateResponse = {id: string; version: number};

export async function mutate(
  props: MutateProps,
  config?: ActionConfig,
): ActionResponse<MutateResponse> {
  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const {workspaceURL, workspaceURI, action} = props;

  const {force} = config || {};

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) return {error: true, message};

  const {auth, workspace} = info;

  const allowedFields = new Set(
    workspace.config.ticketingFormFieldSet
      ?.map(f => f.name)
      .filter(name => UPDATABLE_FIELDS.includes(name)),
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
      ticket = await createTicket({
        data: createData,
        workspaceUserId: workspace.workspaceUser?.id,
        auth,
      });
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
        const version = await findTicketVersion(updateData.id, tenantId);
        updateData.version = version;
      }
      ticket = await updateTicket({
        data: updateData,
        workspaceUserId: workspace.workspaceUser?.id,
        auth,
      });
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

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) return {error: true, message};

  const {workspace, auth} = info;
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
      const version = await findTicketVersion(updateData.id, tenantId);
      updateData.version = version;
    }

    const fromWS =
      workspace.config.ticketStatusChangeMethod === STATUS_CHANGE_METHOD.WS;

    await updateTicket({
      data: updateData,
      workspaceUserId: workspaceUser?.id,
      auth,
      fromWS,
    });
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

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) return {error: true, message};

  const {workspace, auth} = info;
  const {workspaceUser} = workspace;

  if (!workspace.config.isDisplayCloseBtn) {
    return {
      error: true,
      message: await t('Closing ticket not allowed'),
    };
  }

  try {
    const status = await findTicketDoneStatus(tenantId);

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
      const version = await findTicketVersion(updateData.id, tenantId);
      updateData.version = version;
    }

    const fromWS =
      workspace.config.ticketStatusChangeMethod === STATUS_CHANGE_METHOD.WS;

    await updateTicket({
      data: updateData,
      workspaceUserId: workspaceUser?.id,
      auth,
      fromWS,
    });

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

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) return {error: true, message};

  const {workspace, auth} = info;
  const {workspaceUser} = workspace;

  if (!workspace.config.isDisplayCancelBtn) {
    return {
      error: true,
      message: await t('Cancelling ticket not allowed'),
    };
  }

  try {
    const status = await findTicketCancelledStatus(tenantId);
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
      const version = await findTicketVersion(updateData.id, tenantId);
      updateData.version = version;
    }

    const fromWS =
      workspace.config.ticketStatusChangeMethod === STATUS_CHANGE_METHOD.WS;

    await updateTicket({
      data: updateData,
      workspaceUserId: workspaceUser?.id,
      auth,
      fromWS,
    });

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

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) return {error: true, message};

  const {auth, workspace} = info;
  if (!workspace.config.isDisplayRelatedTicket) {
    return {error: true, message: await t('Related tickets are not enabled')};
  }

  try {
    await createRelatedTicketLink({data, auth});
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

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) return {error: true, message};

  const {auth, workspace} = info;
  if (
    !workspace.config.isDisplayChildTicket &&
    !workspace.config.isDisplayTicketParent
  ) {
    return {error: true, message: await t('Parent child relation not enabled')};
  }
  try {
    await createChildTicketLink({data, auth});

    return {success: true, data: true};
  } catch (e) {
    return handleError(e);
  }
}

export async function createParentLink(
  props: CreateChildLinkProps,
): ActionResponse<true> {
  const {workspaceURL, data} = props;

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) return {error: true, message};

  const {auth, workspace} = info;
  if (
    !workspace.config.isDisplayChildTicket &&
    !workspace.config.isDisplayTicketParent
  ) {
    return {error: true, message: await t('Parent child relation not enabled')};
  }

  try {
    await createParentTicketLink({data, auth});
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

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) return {error: true, message};

  const {auth, workspace} = info;
  if (
    !workspace.config.isDisplayChildTicket &&
    !workspace.config.isDisplayTicketParent
  ) {
    return {error: true, message: await t('Parent child relation not enabled')};
  }

  try {
    await deleteChildTicketLink({data, auth});
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

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) return {error: true, message};

  const {auth, workspace} = info;
  if (
    !workspace.config.isDisplayChildTicket &&
    !workspace.config.isDisplayTicketParent
  ) {
    return {error: true, message: await t('Parent child relation not enabled')};
  }

  try {
    await deleteParentTicketLink({data, auth});
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
): ActionResponse<ID> {
  const {workspaceURL, data} = props;

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) return {error: true, message};

  const {auth, workspace} = info;
  if (!workspace.config.isDisplayRelatedTicket) {
    return {error: true, message: await t('Related tickets are not enabled')};
  }

  try {
    const count = await deleteRelatedTicketLink({data, auth});

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
  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) {
    return {error: true, message};
  }
  const {auth} = info;

  const tickets = await findTicketsBySearch({
    search,
    projectId,
    excludeList,
    auth,
  });

  return {success: true, data: clone(tickets)};
}

export const createComment: CreateComment = async formData => {
  const tenantId = headers().get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const {workspaceURL, ...rest} = zodParseFormData(
    formData,
    CreateCommentPropsSchema,
  );

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) {
    return {error: true, message};
  }
  const {auth, workspace, user} = info;

  const {workspaceUser} = workspace;

  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.ticketing, workspace})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.ticketing];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const ticket = await findTicketAccess({
    recordId: rest.recordId,
    auth,
    select: {
      name: true,
      project: {id: true, name: true},
      managedByContact: {id: true},
      createdByContact: {id: true},
    },
  });

  if (!ticket) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    const res = await addComment({
      modelName,
      userId: auth.userId,
      workspaceUserId: workspaceUser.id,
      tenantId,
      commentField: 'note',
      trackingField: 'publicBody',
      subject: `${user.simpleFullName || user.name} added a comment`,
      ...rest,
    });

    const [comment, parentComment] = res;

    getMailRecipients({
      userId: auth.userId,
      contacts: new Set([
        parentComment?.partner?.id,
        ticket.createdByContact?.id,
        ticket.managedByContact?.id,
      ]),
      tenantId,
      workspaceURL,
    })
      .then(reciepients => {
        if (reciepients.length) {
          return sendCommentMail({
            comment,
            parentComment,
            ticketLink: `${workspaceURL}/${SUBAPP_CODES.ticketing}/projects/${ticket.project?.id}/tickets/${ticket.id}`,
            projectName: ticket.project?.name || '',
            ticketName: ticket.name,
            reciepients,
            tenant: tenantId,
          });
        }
      })
      .catch(e => {
        console.error('Error sending comment email: ');
        console.error(e);
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

  const tenantId = headers().get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const {error, message, info} = await ensureAuth(workspaceURL, tenantId);

  if (error) {
    return {error: true, message};
  }
  const {auth, workspace} = info;

  const {workspaceUser} = workspace;

  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.ticketing, workspace})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.ticketing];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const ticket = await findTicketAccess({
    recordId: rest.recordId,
    auth,
  });

  if (!ticket) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    const data = await findComments({
      modelName,
      tenantId,
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
