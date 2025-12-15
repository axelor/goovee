import type {Entity, ID, Payload, SelectOptions, UpdateArgs} from '@goovee/orm';
import axios from 'axios';

// ---- CORE IMPORTS ---- //
import {MAIL_MESSAGE_TYPE, type Track} from '@/comments';
import {addComment} from '@/comments/orm';
import {ModelMap, ORDER_BY, SUBAPP_CODES} from '@/constants';
import type {AOSProjectTask} from '@/goovee/.generated/models';
import {t} from '@/locale/server';
import {manager, type Tenant} from '@/tenant';
import {sql} from '@/utils/template-string';

// ---- LOCAL IMPORTS ---- //
import {
  ASSIGNMENT,
  INVOICING_TYPE,
  TYPE_SELECT,
  VERSION_MISMATCH_CAUSE_CLASS,
  VERSION_MISMATCH_ERROR,
} from '../constants';
import type {
  ChildTicket,
  LinkType,
  ParentTicket,
  Ticket,
  TicketLink,
  TicketListTicket,
  TicketSearch,
} from '../types';
import type {AuthProps} from '../utils/auth-helper';
import {sendTrackMail} from '../utils/mail';
import type {CreateTicketInfo, UpdateTicketInfo} from '../utils/validators';
import type {QueryProps} from './helpers';
import {getProjectAccessFilter, withTicketAccessFilter} from './helpers';
import {getMailRecipients} from './mail';

export type TicketProps<T extends Entity> = QueryProps<T> & {
  projectId: ID;
};

export async function findTicketAccess<
  T extends SelectOptions<AOSProjectTask>,
>({
  recordId: ticketId,
  auth,
  select,
  projectId,
}: {
  recordId: ID;
  auth: AuthProps;
  projectId?: ID;
  select?: T;
}): Promise<Payload<AOSProjectTask, {select: T}> | null> {
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(auth.tenantId);

  const ticket = await client.aOSProjectTask.findOne({
    where: withTicketAccessFilter(auth)({
      id: ticketId,
      project: {
        ...(projectId && {id: projectId}),
        ...getProjectAccessFilter(auth),
      },
    }),
    select: select as T,
  });

  return ticket;
}

export async function createTicket({
  data,
  workspaceUserId,
  auth,
}: {
  data: CreateTicketInfo;
  workspaceUserId?: ID;
  auth: AuthProps;
}) {
  const {
    priority,
    subject,
    description,
    category,
    project: projectId,
    parentId,
  } = data;
  let {managedBy} = data;
  managedBy = managedBy || String(auth.userId);

  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(auth.tenantId);

  const project = await client.aOSProject.findOne({
    where: {
      id: projectId,
      ...getProjectAccessFilter(auth),
    },
    select: {
      assignedTo: {id: true},
      projectTaskStatusSet: {
        select: {id: true},
        take: 1,
        orderBy: {sequence: ORDER_BY.ASC},
      } as unknown as {select: {id: true}}, // type cast to prevent orm type error
    },
  });

  if (!project) {
    throw new Error(await t('Project not found'));
  }

  if (parentId) {
    const parentTicket = await findTicketAccess({
      recordId: parentId,
      select: {project: {id: true}},
      auth,
    });

    if (!parentTicket) {
      throw new Error(await t('Parent ticket not found'));
    }

    if (parentTicket?.project?.id !== projectId) {
      throw new Error(await t('Parent ticket not in this project'));
    }
  }

  const projectManager = project.assignedTo?.id;
  const defaultStatus = project?.projectTaskStatusSet?.[0]?.id;

  let ticketWithoutFullName = await client.aOSProjectTask.create({
    data: {
      createdOn: new Date(),
      updatedOn: new Date(),
      taskDate: new Date().toISOString().slice(0, 10),
      assignment: ASSIGNMENT.CUSTOMER,
      typeSelect: TYPE_SELECT.TICKET,
      invoicingType: INVOICING_TYPE.NO_INVOICING,
      isPrivate: false,
      isInternal: false,
      progress: '0.00',
      createdByContact: {select: {id: auth.userId}},
      project: {select: {id: projectId}},
      name: subject,
      description: description,
      ...(managedBy && {managedByContact: {select: {id: managedBy}}}),
      ...(defaultStatus && {status: {select: {id: defaultStatus}}}),
      ...(category && {projectTaskCategory: {select: {id: category}}}),
      ...(projectManager && {assignedTo: {select: {id: projectManager}}}),
      ...(priority && {priority: {select: {id: priority}}}),
      ...(parentId && {parentTask: {select: {id: parentId}}}),
    },
    select: {name: true},
  });

  const newTicket = await client.aOSProjectTask.update({
    data: {
      id: ticketWithoutFullName.id,
      version: ticketWithoutFullName.version,
      fullName: `#${ticketWithoutFullName.id} ${ticketWithoutFullName.name}`,
      updatedOn: new Date(),
    },
    select: {
      name: true,
      taskDate: true,
      assignment: true,
      typeSelect: true,
      invoicingType: true,
      isPrivate: true,
      isInternal: true,
      progress: true,
      createdByContact: {name: true},
      project: {name: true},
      ...(managedBy && {
        managedByContact: {name: true},
      }),
      ...(category && {projectTaskCategory: {name: true}}),
      ...(priority && {priority: {name: true}}),
      ...(defaultStatus && {status: {name: true}}),
      ...(projectManager && {assignedTo: {name: true}}),
    },
  });

  const tracks: Track[] = [
    {name: 'name', title: 'Subject', value: newTicket.name},
    {
      name: 'assignment',
      title: 'Assignment',
      value: newTicket.assignment?.toString() ?? '',
    },
    {name: 'typeSelect', title: 'Type', value: newTicket.typeSelect ?? ''},
    {name: 'isPrivate', title: 'Private', value: String(newTicket.isPrivate)},
    {
      name: 'isInternal',
      title: 'Internal',
      value: String(newTicket.isInternal),
    },
    {
      name: 'progress',
      title: 'Progress',
      value: newTicket.progress?.toString() ?? '',
    },
    {name: 'project', title: 'Project', value: newTicket.project?.name ?? ''},
    {
      name: 'taskDate',
      title: 'Task Date',
      value: newTicket.taskDate ?? '',
    },
    {
      name: 'invoicingType',
      title: 'Invoicing Type',
      value: String(newTicket.invoicingType),
    },
    {
      name: 'createdByContact',
      title: 'Created by',
      value: newTicket.createdByContact?.name ?? '',
    },
  ];

  if (category) {
    tracks.push({
      name: 'projectTaskCategory',
      title: 'Category',
      value: newTicket.projectTaskCategory?.name ?? '',
    });
  }

  if (priority) {
    tracks.push({
      name: 'priority',
      title: 'Priority',
      value: newTicket.priority?.name ?? '',
    });
  }

  if (defaultStatus) {
    tracks.push({
      name: 'status',
      title: 'Status',
      value: newTicket.status?.name ?? '',
    });
  }

  if (managedBy) {
    tracks.push({
      name: 'managedByContact',
      title: 'Managed by',
      value: newTicket.managedByContact?.name ?? '',
    });
  }
  try {
    if (workspaceUserId) {
      addComment({
        modelName: ModelMap[SUBAPP_CODES.ticketing]!,
        userId: auth.userId,
        workspaceUserId: workspaceUserId,
        recordId: newTicket.id,
        subject: `Record Created by ${auth.simpleFullName}`,
        messageBody: {title: 'Record created', tracks: tracks, tags: []},
        messageType: MAIL_MESSAGE_TYPE.notification,
        tenantId: auth.tenantId,
        trackingField: 'publicBody',
        commentField: 'note',
      });
    }
  } catch (e) {
    console.error('Error adding comment');
    console.error(e);
  }

  getMailRecipients({
    userId: auth.userId,
    contacts: new Set([
      newTicket.createdByContact?.id,
      newTicket.managedByContact?.id,
    ]),
    tenantId: auth.tenantId,
    workspaceURL: auth.workspaceURL,
  })
    .then(reciepients => {
      if (reciepients.length) {
        return sendTrackMail({
          author: auth.simpleFullName,
          type: 'create',
          tracks,
          projectName: newTicket.project?.name!,
          ticketName: newTicket.name,
          ticketLink: `${auth.workspaceURL}/${SUBAPP_CODES.ticketing}/projects/${newTicket.project?.id}/tickets/${newTicket.id}`,
          reciepients,
          tenant: auth.tenantId,
        });
      }
    })
    .catch(e => {
      console.error('Error sending tracking email: ');
      console.error(e);
    });

  return newTicket;
}

const updateSelect = {
  id: true,
  project: {id: true, name: true},
  name: true,
  projectTaskCategory: {name: true},
  priority: {name: true},
  status: {name: true},
  assignment: true,
  managedByContact: {name: true},
  createdByContact: {name: true},
} satisfies SelectOptions<AOSProjectTask>;

export type UTicket = Payload<AOSProjectTask, {select: typeof updateSelect}>;

export async function updateTicket({
  data,
  auth,
  fromWS,
  workspaceUserId,
}: {
  data: UpdateTicketInfo;
  workspaceUserId?: ID;
  fromWS?: boolean;
  auth: AuthProps;
}): Promise<UTicket> {
  const {priority, category, status, assignment, managedBy, id, version} = data;

  const client = await manager.getClient(auth.tenantId);

  const oldTicket = await findTicketAccess({
    recordId: id,
    select: updateSelect,
    auth,
  });

  if (!oldTicket) {
    // To make sure the user has access to the ticket.
    throw new Error(await t('Ticket not found'));
  }

  let newTicket: UTicket | null;
  if (fromWS) {
    const tenant = await manager.getTenant(auth.tenantId);

    if (!tenant?.config?.aos?.url) {
      throw new Error(await t('Rest API URL not set'));
    }

    const {aos} = tenant.config;

    const ws = `${aos.url}/ws/rest/com.axelor.apps.project.db.ProjectTask`;

    const toUpdate = {
      ...(category && {projectTaskCategory: {id: category}}),
      ...(priority && {priority: {id: priority}}),
      ...(status && {status: {id: status}}),
      ...(assignment && {assignment: assignment}),
      ...(managedBy && {managedByContact: {id: managedBy}}),
    };

    if (!Object.keys(toUpdate).length) {
      throw new Error(await t('Nothing to update'));
    }

    const res = await axios
      .post(
        ws,
        {
          data: {
            id,
            version,
            ...toUpdate,
          },
          fields: ['project'],
        },
        {auth: {username: aos.auth.username, password: aos.auth.password}},
      )
      .then(({data}) => data);

    if (!res.data || res?.status === -1) {
      if (res.data?.causeClass === VERSION_MISMATCH_CAUSE_CLASS) {
        const e = new Error(res.data.message);
        e.name = VERSION_MISMATCH_ERROR;
        throw e;
      }
      throw new Error(await t('Failed to update ticket'));
    }

    newTicket = await client.aOSProjectTask.findOne({
      where: {id},
      select: updateSelect,
    });

    if (!newTicket) {
      throw new Error(await t('Ticket not found'));
    }
  } else {
    const toUpdate = {
      ...(category && {projectTaskCategory: {select: {id: category}}}),
      ...(priority && {priority: {select: {id: priority}}}),
      ...(status && {status: {select: {id: status}}}),
      ...(assignment && {assignment}),
      ...(managedBy && {managedByContact: {select: {id: managedBy}}}),
    } satisfies Omit<UpdateArgs<AOSProjectTask>, 'id' | 'version'>;

    if (!Object.keys(toUpdate).length) {
      throw new Error(await t('Nothing to update'));
    }

    newTicket = await client.aOSProjectTask.update({
      data: {
        id,
        version,
        updatedOn: new Date(),
        ...toUpdate,
      },
      select: updateSelect,
    });
  }

  const tracks: Track[] = [];

  if (
    category &&
    oldTicket.projectTaskCategory?.name !== newTicket.projectTaskCategory?.name
  ) {
    tracks.push({
      name: 'projectTaskCategory',
      title: 'Category',
      value: newTicket.projectTaskCategory?.name ?? '',
      ...(oldTicket.projectTaskCategory?.name && {
        oldValue: oldTicket.projectTaskCategory.name,
      }),
    });
  }
  if (priority && oldTicket.priority?.name !== newTicket.priority?.name) {
    tracks.push({
      name: 'priority',
      title: 'Priority',
      value: newTicket.priority?.name ?? '',
      ...(oldTicket.priority?.name && {oldValue: oldTicket.priority.name}),
    });
  }

  if (status && oldTicket.status?.name !== newTicket.status?.name) {
    tracks.push({
      name: 'status',
      title: 'Status',
      value: newTicket.status?.name ?? '',
      ...(oldTicket.status?.name && {oldValue: oldTicket.status.name}),
    });
  }

  if (assignment && oldTicket.assignment !== newTicket.assignment) {
    tracks.push({
      name: 'assignment',
      title: 'Assignment',
      value: newTicket.assignment?.toString() ?? '',
      ...(oldTicket.assignment && {
        oldValue: oldTicket.assignment.toString(),
      }),
    });
  }

  if (
    managedBy &&
    oldTicket.managedByContact?.name !== newTicket.managedByContact?.name
  ) {
    tracks.push({
      name: 'managedByContact',
      title: 'Managed by',
      value: newTicket.managedByContact?.name ?? '',
      ...(oldTicket.managedByContact?.name && {
        oldValue: oldTicket.managedByContact.name,
      }),
    });
  }

  try {
    if (workspaceUserId && !fromWS) {
      addComment({
        modelName: ModelMap[SUBAPP_CODES.ticketing]!,
        userId: auth.userId,
        workspaceUserId: workspaceUserId,
        recordId: newTicket.id,
        subject: `Record Updated by ${auth.simpleFullName}`,
        messageBody: {title: 'Record updated', tracks: tracks, tags: []},
        messageType: MAIL_MESSAGE_TYPE.notification,
        tenantId: auth.tenantId,
        trackingField: 'publicBody',
        commentField: 'note',
      });
    }
  } catch (e) {
    console.log('Error adding comment');
    console.error(e);
  }

  getMailRecipients({
    userId: auth.userId,
    contacts: new Set([
      newTicket.createdByContact?.id,
      newTicket.managedByContact?.id,
      oldTicket?.managedByContact?.id,
    ]),
    tenantId: auth.tenantId,
    workspaceURL: auth.workspaceURL,
  })
    .then(reciepients => {
      if (reciepients.length) {
        return sendTrackMail({
          author: auth.simpleFullName,
          type: 'update',
          tracks,
          projectName: newTicket.project?.name!,
          ticketName: newTicket.name,
          ticketLink: `${auth.workspaceURL}/${SUBAPP_CODES.ticketing}/projects/${newTicket.project?.id}/tickets/${newTicket.id}`,
          reciepients,
          tenant: auth.tenantId,
        });
      }
    })
    .catch(e => {
      console.error('Error sending tracking email: ');
      console.error(e);
    });
  return newTicket;
}

export async function getAllTicketCount(props: {
  projectId: ID;
  auth: AuthProps;
}): Promise<number> {
  const {projectId, auth} = props;
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }
  const client = await manager.getClient(auth.tenantId);

  const count = await client.aOSProjectTask.count({
    where: withTicketAccessFilter(auth)({
      project: {id: projectId},
      status: {isCompleted: false},
    }),
  });

  return Number(count);
}

export async function getMyTicketCount(props: {
  projectId: ID;
  auth: AuthProps;
}): Promise<number> {
  const {projectId, auth} = props;
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }
  const client = await manager.getClient(auth.tenantId);

  const count = await client.aOSProjectTask.count({
    where: withTicketAccessFilter(auth)({
      project: {id: projectId},
      status: {isCompleted: false},
      OR: [
        {managedByContact: {id: auth.userId}},
        {createdByContact: {id: auth.userId}},
      ],
    }),
  });
  return Number(count);
}

export async function getManagedTicketCount(props: {
  projectId: ID;
  auth: AuthProps;
}): Promise<number> {
  const {projectId, auth} = props;
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }
  const client = await manager.getClient(auth.tenantId);

  const count = await client.aOSProjectTask.count({
    where: withTicketAccessFilter(auth)({
      project: {id: projectId},
      status: {isCompleted: false},
      managedByContact: {id: auth.userId},
    }),
  });

  return Number(count);
}

export async function getCreatedTicketCount(props: {
  projectId: ID;
  auth: AuthProps;
}): Promise<number> {
  const {projectId, auth} = props;
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }
  const client = await manager.getClient(auth.tenantId);

  const count = await client.aOSProjectTask.count({
    where: withTicketAccessFilter(auth)({
      project: {id: projectId},
      status: {isCompleted: false},
      createdByContact: {id: auth.userId},
    }),
  });

  return Number(count);
}
export async function getResolvedTicketCount(props: {
  projectId: ID;
  auth: AuthProps;
}): Promise<number> {
  const {projectId, auth} = props;
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }
  const client = await manager.getClient(auth.tenantId);

  const count = await client.aOSProjectTask.count({
    where: withTicketAccessFilter(auth)({
      project: {id: projectId},
      status: {isCompleted: true},
    }),
  });

  return Number(count);
}

export async function findTickets(
  props: TicketProps<AOSProjectTask> & {auth: AuthProps},
): Promise<TicketListTicket[]> {
  const {projectId, take, skip, where, orderBy, auth} = props;

  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(auth.tenantId);

  const tickets = await client.aOSProjectTask.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: withTicketAccessFilter(auth)({
      project: {id: projectId},
      ...where,
    }),
    select: {
      name: true,
      updatedOn: true,
      assignment: true,
      managedByContact: {simpleFullName: true},
      createdByContact: {simpleFullName: true},
      status: {name: true},
      projectTaskCategory: {name: true},
      priority: {name: true},
      project: {
        name: true,
        company: {name: true},
        clientPartner: {simpleFullName: true},
      },
      assignedTo: {name: true},
    },
  });

  return tickets;
}

export async function findRelatedTicketLinks(
  ticketId: ID,
  tenantId: Tenant['id'],
): Promise<TicketLink[] | undefined> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(tenantId);

  const ticket = await client.aOSProjectTask.findOne({
    where: {id: ticketId},
    select: {
      projectTaskLinkList: {
        select: {
          projectTaskLinkType: {name: true},
          relatedTask: {
            name: true,
            updatedOn: true,
            status: {name: true},
            projectTaskCategory: {name: true},
            priority: {name: true},
            project: {
              name: true,
              company: {name: true},
              clientPartner: {simpleFullName: true},
            },
            assignedTo: {name: true},
            managedByContact: {simpleFullName: true},
            createdByContact: {simpleFullName: true},
            assignment: true,
          },
        },
      },
    },
  });

  return ticket?.projectTaskLinkList;
}

export async function findChildTickets(
  ticketId: ID,
  tenantId: Tenant['id'],
): Promise<ChildTicket[]> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(tenantId);

  const tickets = await client.aOSProjectTask.find({
    where: {
      parentTask: {
        id: ticketId,
      },
    },
    select: {
      name: true,
      updatedOn: true,
      status: {name: true},
      projectTaskCategory: {name: true},
      priority: {name: true},
      project: {
        name: true,
        company: {name: true},
        clientPartner: {simpleFullName: true},
      },
      assignedTo: {name: true},
      createdByContact: {simpleFullName: true},
      managedByContact: {simpleFullName: true},
      assignment: true,
    },
  });

  return tickets;
}

export async function findParentTicket(
  ticketId: ID,
  tenantId: Tenant['id'],
): Promise<ParentTicket | undefined> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(tenantId);

  const ticket = await client.aOSProjectTask.findOne({
    where: {
      id: ticketId,
    },
    select: {
      parentTask: {
        name: true,
        updatedOn: true,
        status: {name: true},
        projectTaskCategory: {name: true},
        priority: {name: true},
        project: {
          name: true,
          company: {name: true},
          clientPartner: {simpleFullName: true},
        },
        assignedTo: {name: true},
        managedByContact: {simpleFullName: true},
        createdByContact: {simpleFullName: true},
        assignment: true,
      },
    },
  });

  return ticket?.parentTask;
}

export async function findTicket({
  ticketId,
  projectId,
  auth,
}: {
  ticketId: ID;
  projectId: ID;
  auth: AuthProps;
}): Promise<Ticket | null> {
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(auth.tenantId);

  const ticket = await client.aOSProjectTask.findOne({
    where: withTicketAccessFilter(auth)({
      id: ticketId,
      project: {id: projectId, ...getProjectAccessFilter(auth)},
    }),
    select: {
      name: true,
      targetVersion: {title: true},
      progress: true,
      quantity: true,
      invoicingType: true,
      invoicingUnit: {name: true},
      description: true,
      taskEndDate: true,
      displayFinancialData: true,
      managedByContact: {simpleFullName: true},
      createdByContact: {simpleFullName: true},
      createdOn: true,
      project: {
        name: true,
        company: {name: true},
        clientPartner: {simpleFullName: true},
      },
      projectTaskCategory: {name: true},
      priority: {name: true},
      assignedTo: {name: true},
      status: {name: true, isCompleted: true},
      assignment: true,
    },
  });

  return ticket;
}

export async function findTicketVersion(
  ticketId: ID,
  tenantId: Tenant['id'],
): Promise<number> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(tenantId);

  const ticket = await client.aOSProjectTask.findOne({
    where: {id: ticketId},
    select: {version: true},
  });

  if (!ticket) {
    throw new Error('Ticket not found');
  }
  return ticket.version;
}

export async function findTicketsBySearch(props: {
  search?: string;
  projectId?: ID;
  excludeList?: ID[];
  auth: AuthProps;
}): Promise<TicketSearch[]> {
  const {search, projectId, excludeList, auth} = props;

  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(auth.tenantId);

  const tickets = await client.aOSProjectTask.find({
    where: withTicketAccessFilter(auth)({
      project: {
        ...(projectId && {id: projectId}),
        ...getProjectAccessFilter(auth),
      },
      ...(search && {
        OR: [
          {fullName: {like: `%${search}%`}},
          {description: {like: `%${search}%`}},
        ],
      }),
      ...(Boolean(excludeList?.length) && {
        id: {notIn: excludeList},
      }),
    }),
    take: 10,
    select: {fullName: true, name: true},
  });

  return tickets;
}

export async function findParentTicketIds(
  ticketId: ID,
  tenantId: Tenant['id'],
): Promise<string[]> {
  if (!tenantId) {
    return [];
  }

  const client = await manager.getClient(tenantId);

  const res = await client.$raw(
    sql`
      WITH RECURSIVE
        parent_tickets AS (
          -- Base case: Select the initial ticket's parent
          SELECT
            id,
            parent_task,
            ARRAY[id] AS visited_ids -- Track visited tickets
          FROM
            project_project_task
          WHERE
            id = $1
          UNION ALL
          -- Recursive step: Select the parent of the current ticket
          SELECT
            pt.id,
            pt.parent_task,
            visited_ids || pt.id -- Append the current ticket to the visited list
          FROM
            project_project_task pt
            INNER JOIN parent_tickets p ON pt.id = p.parent_task
          WHERE
            pt.id IS NOT NULL
            AND NOT pt.id = ANY (p.visited_ids) -- Prevent circular reference
        )
      SELECT
        ARRAY_AGG(parent_task) AS ids
      FROM
        parent_tickets
      WHERE
        parent_task IS NOT NULL;
    `,
    ticketId,
  );

  if (Array.isArray(res)) {
    const parentTickets = res[0]?.ids;
    return parentTickets ?? [];
  }

  return [];
}

export async function findChildTicketIds(
  ticketId: ID,
  tenantId: Tenant['id'],
): Promise<string[]> {
  if (!tenantId) {
    return [];
  }

  const client = await manager.getClient(tenantId);

  const res = await client.$raw(
    sql`
      WITH RECURSIVE
        child_tickets AS (
          -- Base case: Select the initial ticket
          SELECT
            id,
            parent_task,
            ARRAY[id] AS visited_ids -- Track visited tickets
          FROM
            project_project_task
          WHERE
            id = $1
          UNION ALL
          -- Recursive step: Select the child tickets where the current ticket is the parent
          SELECT
            pt.id,
            pt.parent_task,
            visited_ids || pt.id -- Append the current ticket to the visited list
          FROM
            project_project_task pt
            INNER JOIN child_tickets ct ON pt.parent_task = ct.id
          WHERE
            pt.id IS NOT NULL
            AND NOT pt.id = ANY (ct.visited_ids) -- Prevent circular reference
        )
      SELECT
        ARRAY_AGG(id) AS ids
      FROM
        child_tickets
      WHERE
        -- Exclude the initial ticket itself from the results
        id != $1;
    `,
    ticketId,
  );

  if (Array.isArray(res)) {
    const childTickets = res[0]?.ids;
    return childTickets ?? [];
  }

  return [];
}

export async function createChildTicketLink({
  data,
  auth,
}: {
  data: {currentTicketId: ID; linkTicketId: ID};
  auth: AuthProps;
}) {
  const {currentTicketId, linkTicketId} = data;

  if (!auth.tenantId) {
    throw new Error('TenantId is required');
  }

  const client = await manager.getClient(auth.tenantId);

  const [currentTicket, linkTicket] = await Promise.all([
    findTicketAccess({recordId: currentTicketId, auth}),
    findTicketAccess({recordId: linkTicketId, auth}),
  ]);

  if (!currentTicket || !linkTicket) {
    // To make sure the user has access to the ticket.
    throw new Error(await t('Ticket not found'));
  }

  const parentTickets = await findParentTicketIds(
    currentTicketId,
    auth.tenantId,
  );

  if (parentTickets.includes(linkTicketId.toString())) {
    throw new Error(await t('Circular dependency'));
  }

  const ticket = await client.aOSProjectTask.update({
    data: {
      id: currentTicketId.toString(),
      version: currentTicket.version, //TODO: get the version from client
      childTasks: {select: {id: linkTicketId}},
    },
    select: {id: true},
  });

  return ticket;
}

export async function deleteChildTicketLink({
  data,
  auth,
}: {
  data: {currentTicketId: ID; linkTicketId: ID};
  auth: AuthProps;
}) {
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const {currentTicketId, linkTicketId} = data;

  const client = await manager.getClient(auth.tenantId);

  const [currentTicket, linkTicket] = await Promise.all([
    findTicketAccess({recordId: currentTicketId, auth}),
    findTicketAccess({recordId: linkTicketId, auth}),
  ]);

  if (!currentTicket || !linkTicket) {
    // To make sure the user has access to the ticket.
    throw new Error(await t('Ticket not found'));
  }

  const ticket = await client.aOSProjectTask.update({
    data: {
      id: currentTicketId.toString(),
      version: currentTicket.version, //TODO: get the version from client
      childTasks: {remove: linkTicketId},
    },
    select: {id: true},
  });

  return ticket;
}

export async function createParentTicketLink({
  data,
  auth,
}: {
  data: {currentTicketId: ID; linkTicketId: ID};
  auth: AuthProps;
}) {
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const {currentTicketId, linkTicketId} = data;

  const client = await manager.getClient(auth.tenantId);

  const [currentTicket, linkTicket] = await Promise.all([
    findTicketAccess({recordId: currentTicketId, auth}),
    findTicketAccess({recordId: linkTicketId, auth}),
  ]);

  if (!currentTicket || !linkTicket) {
    // To make sure the user has access to the ticket.
    throw new Error(await t('Ticket not found'));
  }

  const childTickets = await findChildTicketIds(currentTicketId, auth.tenantId);

  if (childTickets.includes(linkTicketId.toString())) {
    throw new Error(await t('Circular dependency'));
  }

  const ticket = await client.aOSProjectTask.update({
    data: {
      id: currentTicketId.toString(),
      version: currentTicket.version, //TODO: get the version from client
      parentTask: {select: {id: linkTicketId}},
    },
    select: {id: true},
  });
  return ticket;
}

export async function deleteParentTicketLink({
  data,
  auth,
}: {
  data: {currentTicketId: ID; linkTicketId: ID};
  auth: AuthProps;
}) {
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const {currentTicketId, linkTicketId} = data;

  const client = await manager.getClient(auth.tenantId);

  const [currentTicket, linkTicket] = await Promise.all([
    findTicketAccess({recordId: currentTicketId, auth}),
    findTicketAccess({recordId: linkTicketId, auth}),
  ]);

  if (!currentTicket || !linkTicket) {
    // To make sure the user has access to the ticket.
    throw new Error(await t('Ticket not found'));
  }

  const ticket = await client.aOSProjectTask.update({
    data: {
      id: linkTicketId.toString(),
      version: linkTicket.version, //TODO: get the version from client
      childTasks: {remove: currentTicketId},
    },
    select: {id: true},
  });
  return ticket;
}

export async function findTicketLinkTypes(
  projectId: ID,
  tenantId: Tenant['id'],
): Promise<LinkType[]> {
  if (!tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const client = await manager.getClient(tenantId);

  if (projectId) {
    const project = await client.aOSProject.findOne({
      where: {id: projectId},
      select: {
        projectTaskLinkTypeSet: {
          where: {OR: [{archived: false}, {archived: null}]},
          select: {name: true},
        } as {select: {name: true}},
      },
    });
    if (project?.projectTaskLinkTypeSet?.length) {
      return project?.projectTaskLinkTypeSet;
    }
  }
  const links = await client.aOSProjectTaskLinkType.find({
    where: {OR: [{archived: false}, {archived: null}]},
    select: {name: true},
  });

  return links;
}

export async function createRelatedTicketLink({
  data,
  auth,
}: {
  data: {currentTicketId: ID; linkTicketId: ID; linkType: ID};
  auth: AuthProps;
}): Promise<[string, string]> {
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const {currentTicketId, linkTicketId, linkType} = data;

  const client = await manager.getClient(auth.tenantId);

  const [currentTicket, linkTicket] = await Promise.all([
    findTicketAccess({
      recordId: currentTicketId,
      select: {
        name: true,
        project: {name: true, projectTaskLinkTypeSet: {select: {id: true}}},
      },
      auth,
    }),
    findTicketAccess({
      recordId: linkTicketId,
      select: {
        name: true,
        project: {name: true, projectTaskLinkTypeSet: {select: {id: true}}},
      },
      auth,
    }),
  ]);

  if (!currentTicket || !linkTicket) {
    // To make sure the user has access to the ticket.
    throw new Error(await t('Ticket not found'));
  }

  if (currentTicket.project?.id !== linkTicket.project?.id) {
    // This is enabled as per #85205
    // remove this check to enable cross project linking
    throw new Error(await t('Cross project linking not allowed'));
  }

  const type = await client.aOSProjectTaskLinkType.findOne({
    where: {id: linkType},
    select: {name: true, oppositeLinkType: {id: true, name: true}},
  });

  if (!type) {
    throw new Error(await t('Invalid link type'));
  }
  const currentTicketLinkTypes = currentTicket.project?.projectTaskLinkTypeSet;
  const linkTicketLinkTypes = linkTicket.project?.projectTaskLinkTypeSet;

  //NOTE: if the project has configured to use certain linkTypes , then only those linkTypes are allowed.
  //if not then all linkTypes are allowed

  if (currentTicketLinkTypes?.length) {
    const hasTypeAccess = currentTicketLinkTypes.some(
      link => link.id === type.id,
    );
    if (!hasTypeAccess) {
      //NOTE: this message is copied from backend
      throw new Error(
        `${await t('Please configure the project')} "${currentTicket.project?.name}" ${await t('with project task link type')} "${type.name}" ${await t('if you want to create this link')}.`,
      );
    }
  }
  const oppositeType = type?.oppositeLinkType ?? type;

  if (linkTicketLinkTypes?.length) {
    const hasTypeAccess = linkTicketLinkTypes.some(
      link => link.id === oppositeType.id,
    );
    if (!hasTypeAccess) {
      throw new Error(
        `${await t('Please configure the project')} "${linkTicket.project?.name}" ${await t('with project task link type')} "${oppositeType.name}" ${await t('if you want to create this link')}.`,
      );
    }
  }

  let link1 = await client.aOSProjectTaskLink.create({
    data: {
      createdOn: new Date(),
      updatedOn: new Date(),
      projectTask: {select: {id: currentTicketId}},
      relatedTask: {select: {id: linkTicketId}},
      projectTaskLinkType: {select: {id: type.id}},
    },
    select: {id: true},
  });

  const link2 = await client.aOSProjectTaskLink.create({
    data: {
      createdOn: new Date(),
      updatedOn: new Date(),
      projectTask: {select: {id: linkTicketId}},
      relatedTask: {select: {id: currentTicketId}},
      projectTaskLinkType: {select: {id: oppositeType.id}},
      projectTaskLink: {select: {id: link1.id}},
    },
    select: {id: true},
  });

  link1 = await client.aOSProjectTaskLink.update({
    data: {
      id: link1.id,
      version: link1.version,
      updatedOn: new Date(),
      projectTaskLink: {select: {id: link2.id}},
    },
    select: {id: true},
  });

  return [link1.id, link2.id];
}

export async function deleteRelatedTicketLink({
  data,
  auth,
}: {
  data: {currentTicketId: ID; linkTicketId: ID; linkId: ID};
  auth: AuthProps;
}): Promise<ID> {
  if (!auth.tenantId) {
    throw new Error(await t('TenantId is required'));
  }

  const {currentTicketId, linkTicketId, linkId} = data;

  const client = await manager.getClient(auth.tenantId);

  const [hasCurrentTicketAccess, hasLinkTicketAccess] = await Promise.all([
    findTicketAccess({recordId: currentTicketId, auth}),
    findTicketAccess({recordId: linkTicketId, auth}),
  ]);

  if (!hasCurrentTicketAccess || !hasLinkTicketAccess) {
    // To make sure the user has access to the ticket.
    throw new Error(await t('Ticket not found'));
  }

  const link = await client.aOSProjectTaskLink.findOne({
    where: {id: linkId},
    select: {projectTaskLink: {id: true}},
  });

  if (!link) {
    throw new Error(await t('Link does not exist'));
  }

  const linksToDelete = [linkId];
  if (link.projectTaskLink?.id) {
    linksToDelete.push(link.projectTaskLink.id);
  }
  const deleteCount = await client.aOSProjectTaskLink.deleteAll({
    where: {id: {in: linksToDelete}},
  });
  return deleteCount;
}
