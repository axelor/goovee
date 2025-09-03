// NOTE: This is used for serverside sorting
export const sortKeyPathMap: Record<string, string> = {
  ticketId: 'id',
  createdBy: 'createdByContact.simpleFullName',
  subject: 'name',
  priority: 'priority.name',
  status: 'status.name',
  category: 'projectTaskCategory.name',
  managedBy: 'managedByContact.simpleFullName',
  assignedTo: 'assignment',
  updatedOn: 'updatedOn',
};

export const TYPE_SELECT = {
  TASK: 'task',
  TICKET: 'ticket',
} as const;

export const ASSIGNMENT = {
  CUSTOMER: 1,
  PROVIDER: 2,
} as const;

export const INVOICING_TYPE = {
  TIME_SPENT: 1,
  PACKAGE: 2,
  NO_INVOICING: 3,
  ON_PROGRESS: 4,
} as const;

export const VERSION_MISMATCH_ERROR = 'OptimisticLockVersionMismatchError';
export const VERSION_MISMATCH_CAUSE_CLASS =
  'javax.persistence.OptimisticLockException';

export const STATUS_CHANGE_METHOD = {
  DB: 'fromDB',
  WS: 'fromWS',
};

export const DEFAULT_SORT = 'updatedOn DESC';
export const COMPANY = 'company';

export const MUTATE_TYPE = {
  CREATE: 'create',
  UPDATE: 'update',
} as const;

export const ALL_TICKETS_TITLE = 'All tickets';
export const MY_TICKETS_TITLE = 'My tickets';
export const MANAGED_TICKETS_TITLE = 'Managed tickets';
export const CREATED_TICKETS_TITLE = 'Created tickets';
export const RESOLVED_TICKETS_TITLE = 'Resolved tickets';

export const FIELDS = {
  ID: 'id',
  PRIORITY: 'priority',
  STATUS: 'status',
  CATEGORY: 'projectTaskCategory',
  ASSIGNMENT: 'assignment',
  MANAGED_BY: 'managedByContact',
  CREATED_BY: 'createdByContact',
  UPDATED_ON: 'updatedOn',
  CREATED_ON: 'createdOn',
  PROGRESS: 'progress',
  TARGET_VERSION: 'targetVersion',
  TASK_END_DATE: 'taskEndDate',
};

export const UPDATABLE_FIELDS = [
  FIELDS.PRIORITY,
  FIELDS.CATEGORY,
  FIELDS.MANAGED_BY,
];
