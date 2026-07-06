import type {Entity, Payload, SelectOptions, UpdateArgs} from '@goovee/orm';
import type {ID} from '@/types';

// ---- CORE IMPORTS ---- //
import {aosClient, AOSError} from '@/service';
import {type Track} from '@/comments';
import {ORDER_BY} from '@/constants';
import type {AOSProjectTask} from '@/goovee/.generated/models';
import {t} from '@/locale/server';
import type {Client} from '@/goovee/.generated/client';
import {uniqueById} from '@/utils';
import {sql} from '@/utils/template-string';

// ---- LOCAL IMPORTS ---- //
import {
  ASSIGNMENT,
  INVOICING_TYPE,
  TYPE_SELECT,
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
import {findTicketStatuses} from './projects';
import type {CreateTicketInfo, UpdateTicketInfo} from '../utils/validators';
import type {QueryProps, UserCtx, SubappCtx, WorkspaceCtx} from './helpers';
import {getProjectAccessFilter, withTicketAccessFilter} from './helpers';
import type {Tenant} from '@/tenant';

export type TicketProps<T extends Entity> = QueryProps<T> & {
  projectId: ID;
};

export async function findTicketAccess<
  T extends SelectOptions<AOSProjectTask>,
>({
  recordId: ticketId,
  client,
  user,
  subapp,
  workspace,
  select,
  projectId,
}: {
  recordId: ID;
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
  workspace: WorkspaceCtx;
  projectId?: ID;
  select?: T;
}): Promise<Payload<AOSProjectTask, {select: T}> | null> {
  const ticket = await client.aOSProjectTask.findOne({
    where: withTicketAccessFilter({user, subapp})({
      id: ticketId,
      project: {
        ...(projectId && {id: projectId}),
        ...getProjectAccessFilter({user, workspace}),
      },
    }),
    select: select as T,
  });

  return ticket;
}

export async function createTicket({
  data,
  client,
  user,
  subapp,
  workspace,
}: {
  data: CreateTicketInfo;
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
  workspace: WorkspaceCtx;
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
  managedBy = managedBy || String(user.id);
  const project = await client.aOSProject.findOne({
    where: {
      id: projectId,
      ...getProjectAccessFilter({user, workspace}),
    },
    select: {
      assignedTo: {id: true},
      projectTaskStatusSet: {
        select: {id: true},
        take: 1,
        orderBy: {sequence: ORDER_BY.ASC},
      },
    },
  });

  if (!project) {
    throw new Error(await t('Project not found'));
  }

  if (parentId) {
    const parentTicket = await findTicketAccess({
      recordId: parentId,
      select: {project: {id: true}},
      client,
      user,
      subapp,
      workspace,
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

  const ticketWithoutFullName = await client.aOSProjectTask.create({
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
      createdByContact: {select: {id: user.id}},
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
      createdByContact: {id: true, name: true, localization: {code: true}},
      project: {id: true, name: true},
      ...(managedBy && {
        managedByContact: {id: true, name: true, localization: {code: true}},
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
  const contacts = uniqueById([
    newTicket.createdByContact,
    newTicket.managedByContact,
  ]).filter(c => String(c.id) !== String(user.id)); // exclude the ticket creator — they performed the action

  return {ticket: newTicket, tracks, contacts};
}

const updateSelect = {
  id: true,
  project: {id: true, name: true},
  name: true,
  projectTaskCategory: {name: true},
  priority: {name: true},
  status: {name: true},
  assignment: true,
  managedByContact: {id: true, name: true, localization: {code: true}},
  createdByContact: {id: true, name: true, localization: {code: true}},
} satisfies SelectOptions<AOSProjectTask>;

export type UTicket = Payload<AOSProjectTask, {select: typeof updateSelect}>;

export async function updateTicket({
  data,
  client,
  user,
  subapp,
  workspace,
  tenant,
  fromWS,
}: {
  data: UpdateTicketInfo;
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
  workspace: WorkspaceCtx;
  tenant: Tenant;
  fromWS?: boolean;
}) {
  const {priority, category, status, assignment, managedBy, id, version} = data;

  const oldTicket = await findTicketAccess({
    recordId: id,
    select: updateSelect,
    client,
    user,
    subapp,
    workspace,
  });

  if (!oldTicket) {
    // To make sure the user has access to the ticket.
    throw new Error(await t('Ticket not found'));
  }

  if (status && oldTicket.project?.id) {
    const projectStatuses = await findTicketStatuses(
      oldTicket.project.id,
      client,
    );
    if (!projectStatuses.some(s => s.id === status)) {
      throw new Error(await t('Selected status is not valid for this project'));
    }
  }

  let newTicket: UTicket | null;
  if (fromWS) {
    if (!tenant?.config?.aos?.url) {
      throw new Error(await t('Rest API URL not set'));
    }

    const {aos} = tenant.config;

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

    try {
      await aosClient(aos).save(
        'com.axelor.apps.project.db.ProjectTask',
        {id, version, ...toUpdate},
        {fields: ['project']},
      );
    } catch (err) {
      if (err instanceof AOSError) {
        if (err.isConcurrentUpdate) {
          const mismatch = new Error(err.message);
          mismatch.name = VERSION_MISMATCH_ERROR;
          throw mismatch;
        }
        throw new Error(await t('Failed to update ticket'));
      }
      throw err;
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

  const contacts = uniqueById([
    newTicket.createdByContact,
    newTicket.managedByContact,
    oldTicket?.managedByContact,
  ]).filter(c => String(c.id) !== String(user.id)); // exclude the user who performed the update

  return {ticket: newTicket, tracks, contacts};
}

export async function getAllTicketCount(props: {
  projectId: ID;
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
}): Promise<number> {
  const {projectId, client, user, subapp} = props;
  const count = await client.aOSProjectTask.count({
    where: withTicketAccessFilter({user, subapp})({
      project: {id: projectId},
      status: {isCompleted: false},
    }),
  });

  return Number(count);
}

export async function getMyTicketCount(props: {
  projectId: ID;
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
}): Promise<number> {
  const {projectId, client, user, subapp} = props;
  const count = await client.aOSProjectTask.count({
    where: withTicketAccessFilter({user, subapp})({
      project: {id: projectId},
      status: {isCompleted: false},
      OR: [
        {managedByContact: {id: user.id}},
        {createdByContact: {id: user.id}},
      ],
    }),
  });
  return Number(count);
}

export async function getManagedTicketCount(props: {
  projectId: ID;
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
}): Promise<number> {
  const {projectId, client, user, subapp} = props;
  const count = await client.aOSProjectTask.count({
    where: withTicketAccessFilter({user, subapp})({
      project: {id: projectId},
      status: {isCompleted: false},
      managedByContact: {id: user.id},
    }),
  });

  return Number(count);
}

export async function getCreatedTicketCount(props: {
  projectId: ID;
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
}): Promise<number> {
  const {projectId, client, user, subapp} = props;
  const count = await client.aOSProjectTask.count({
    where: withTicketAccessFilter({user, subapp})({
      project: {id: projectId},
      status: {isCompleted: false},
      createdByContact: {id: user.id},
    }),
  });

  return Number(count);
}

export async function getResolvedTicketCount(props: {
  projectId: ID;
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
}): Promise<number> {
  const {projectId, client, user, subapp} = props;
  const count = await client.aOSProjectTask.count({
    where: withTicketAccessFilter({user, subapp})({
      project: {id: projectId},
      status: {isCompleted: true},
    }),
  });

  return Number(count);
}

export async function findTickets(
  props: TicketProps<AOSProjectTask> & {
    client: Client;
    user: UserCtx;
    subapp: SubappCtx;
  },
): Promise<TicketListTicket[]> {
  const {projectId, take, skip, where, orderBy, client, user, subapp} = props;

  const tickets = await client.aOSProjectTask.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: withTicketAccessFilter({user, subapp})({
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
  client: Client,
): Promise<TicketLink[] | null | undefined> {
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
  client: Client,
): Promise<ChildTicket[]> {
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
  client: Client,
): Promise<ParentTicket | null | undefined> {
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
  client,
  user,
  subapp,
  workspace,
}: {
  ticketId: ID;
  projectId: ID;
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
  workspace: WorkspaceCtx;
}): Promise<Ticket | null> {
  const ticket = await client.aOSProjectTask.findOne({
    where: withTicketAccessFilter({user, subapp})({
      id: ticketId,
      project: {id: projectId, ...getProjectAccessFilter({user, workspace})},
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
  client: Client,
): Promise<number> {
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
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
  workspace: WorkspaceCtx;
}): Promise<TicketSearch[]> {
  const {search, projectId, excludeList, client, user, subapp, workspace} =
    props;

  const tickets = await client.aOSProjectTask.find({
    where: withTicketAccessFilter({user, subapp})({
      project: {
        ...(projectId && {id: projectId}),
        ...getProjectAccessFilter({user, workspace}),
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
  client: Client,
): Promise<string[]> {
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
  client: Client,
): Promise<string[]> {
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
  client,
  user,
  subapp,
  workspace,
}: {
  data: {currentTicketId: ID; linkTicketId: ID};
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
  workspace: WorkspaceCtx;
}) {
  const {currentTicketId, linkTicketId} = data;

  const [currentTicket, linkTicket] = await Promise.all([
    findTicketAccess({
      recordId: currentTicketId,
      client,
      user,
      subapp,
      workspace,
    }),
    findTicketAccess({recordId: linkTicketId, client, user, subapp, workspace}),
  ]);

  if (!currentTicket || !linkTicket) {
    // To make sure the user has access to the ticket.
    throw new Error(await t('Ticket not found'));
  }

  const parentTickets = await findParentTicketIds(currentTicketId, client);

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
  client,
  user,
  subapp,
  workspace,
}: {
  data: {currentTicketId: ID; linkTicketId: ID};
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
  workspace: WorkspaceCtx;
}) {
  const {currentTicketId, linkTicketId} = data;

  const [currentTicket, linkTicket] = await Promise.all([
    findTicketAccess({
      recordId: currentTicketId,
      client,
      user,
      subapp,
      workspace,
    }),
    findTicketAccess({recordId: linkTicketId, client, user, subapp, workspace}),
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
  client,
  user,
  subapp,
  workspace,
}: {
  data: {currentTicketId: ID; linkTicketId: ID};
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
  workspace: WorkspaceCtx;
}) {
  const {currentTicketId, linkTicketId} = data;

  const [currentTicket, linkTicket] = await Promise.all([
    findTicketAccess({
      recordId: currentTicketId,
      client,
      user,
      subapp,
      workspace,
    }),
    findTicketAccess({recordId: linkTicketId, client, user, subapp, workspace}),
  ]);

  if (!currentTicket || !linkTicket) {
    // To make sure the user has access to the ticket.
    throw new Error(await t('Ticket not found'));
  }

  const childTickets = await findChildTicketIds(currentTicketId, client);

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
  client,
  user,
  subapp,
  workspace,
}: {
  data: {currentTicketId: ID; linkTicketId: ID};
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
  workspace: WorkspaceCtx;
}) {
  const {currentTicketId, linkTicketId} = data;

  const [currentTicket, linkTicket] = await Promise.all([
    findTicketAccess({
      recordId: currentTicketId,
      client,
      user,
      subapp,
      workspace,
    }),
    findTicketAccess({recordId: linkTicketId, client, user, subapp, workspace}),
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
  client: Client,
): Promise<LinkType[]> {
  if (projectId) {
    const project = await client.aOSProject.findOne({
      where: {id: projectId},
      select: {
        projectTaskLinkTypeSet: {
          where: {OR: [{archived: false}, {archived: null}]},
          select: {name: true},
        },
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
  client,
  user,
  subapp,
  workspace,
}: {
  data: {currentTicketId: ID; linkTicketId: ID; linkType: ID};
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
  workspace: WorkspaceCtx;
}): Promise<[string, string]> {
  const {currentTicketId, linkTicketId, linkType} = data;

  const [currentTicket, linkTicket] = await Promise.all([
    findTicketAccess({
      recordId: currentTicketId,
      select: {
        name: true,
        project: {name: true, projectTaskLinkTypeSet: {select: {id: true}}},
      },
      client,
      user,
      subapp,
      workspace,
    }),
    findTicketAccess({
      recordId: linkTicketId,
      select: {
        name: true,
        project: {name: true, projectTaskLinkTypeSet: {select: {id: true}}},
      },
      client,
      user,
      subapp,
      workspace,
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
        await t(
          'Please configure the project "{0}" with project task link type "{1}" if you want to create this link.',
          currentTicket.project?.name || '',
          type.name || '',
        ),
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
        await t(
          'Please configure the project "{0}" with project task link type "{1}" if you want to create this link.',
          linkTicket.project?.name || '',
          oppositeType.name || '',
        ),
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
  client,
  user,
  subapp,
  workspace,
}: {
  data: {currentTicketId: ID; linkTicketId: ID; linkId: ID};
  client: Client;
  user: UserCtx;
  subapp: SubappCtx;
  workspace: WorkspaceCtx;
}): Promise<number> {
  const {currentTicketId, linkTicketId, linkId} = data;

  const [hasCurrentTicketAccess, hasLinkTicketAccess] = await Promise.all([
    findTicketAccess({
      recordId: currentTicketId,
      client,
      user,
      subapp,
      workspace,
    }),
    findTicketAccess({recordId: linkTicketId, client, user, subapp, workspace}),
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
  return Number(deleteCount);
}
