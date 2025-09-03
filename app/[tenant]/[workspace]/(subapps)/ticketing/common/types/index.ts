import {type BigDecimal} from '@goovee/orm';

export type * from './search-param';

export type Company = {id: string; version: number; name?: string};
export type Category = {id: string; version: number; name?: string};
export type Priority = {id: string; version: number; name?: string};
export type LinkType = {id: string; version: number; name: string};
export type TicketSearch = {
  id: string;
  version: number;
  fullName?: string;
  name?: string;
};

export type Status = {
  id: string;
  version: number;
  name?: string;
  sequence?: number;
  isCompleted?: boolean;
};

export type ClientPartner = {
  id: string;
  version: number;
  simpleFullName?: string;
};

export type ContactPartner = {
  id: string;
  version: number;
  simpleFullName?: string;
};

export type TicketListTicket = {
  id: string;
  version: number;
  name?: string;
  assignment?: number;
  assignedTo?: {id: string; version: number; name?: string};
  priority?: {id: string; version: number; name?: string};
  managedByContact?: {
    id: string;
    version: number;
    simpleFullName?: string;
  };
  createdByContact?: {
    id: string;
    version: number;
    simpleFullName?: string;
  };
  project?: {
    id: string;
    version: number;
    name?: string;
    company?: {
      id: string;
      version: number;
      name?: string;
    };
    clientPartner?: {id: string; version: number; simpleFullName?: string};
  };
  status?: {id: string; version: number; name?: string};
  projectTaskCategory?: {id: string; version: number; name?: string};
  updatedOn?: Date;
  _count?: string;
};

export type TicketLink = {
  id: string;
  version: number;
  projectTaskLinkType?: {id: string; version: number; name: string};
  relatedTask?: {
    id: string;
    version: number;
    name: string;
    assignment?: number | undefined;
    assignedTo?: {id: string; version: number; name?: string};
    managedByContact?: {
      id: string;
      version: number;
      simpleFullName?: string;
    };
    createdByContact?: {
      id: string;
      version: number;
      simpleFullName?: string;
    };
    priority?: {id: string; version: number; name?: string};
    project?: {
      id: string;
      version: number;
      name?: string;
      company?: {
        id: string;
        version: number;
        name?: string;
      };
      clientPartner?: {id: string; version: number; simpleFullName?: string};
    };
    status?: {id: string; version: number; name?: string};
    projectTaskCategory?: {id: string; version: number; name?: string};
    updatedOn?: Date | undefined;
  };
};

export type ChildTicket = {
  id: string;
  version: number;
  name: string;
  assignment?: number | undefined;
  assignedTo?: {id: string; version: number; name?: string};
  managedByContact?: {
    id: string;
    version: number;
    simpleFullName?: string;
  };
  createdByContact?: {
    id: string;
    version: number;
    simpleFullName?: string;
  };
  priority?: {id: string; version: number; name?: string};
  project?: {
    id: string;
    version: number;
    name?: string;
    company?: {
      id: string;
      version: number;
      name?: string;
    };
    clientPartner?: {id: string; version: number; simpleFullName?: string};
  };
  status?: {id: string; version: number; name?: string};
  projectTaskCategory?: {id: string; version: number; name?: string};
  updatedOn?: Date | undefined;
};

export type ParentTicket = {
  id: string;
  version: number;
  name?: string;
  assignment?: number | undefined;
  assignedTo?: {id: string; version: number; name?: string};
  managedByContact?: {
    id: string;
    version: number;
    simpleFullName?: string;
  };
  createdByContact?: {
    id: string;
    version: number;
    simpleFullName?: string;
  };
  priority?: {id: string; version: number; name?: string};
  project?: {
    id: string;
    version: number;
    name?: string;
    company?: {
      id: string;
      version: number;
      name?: string;
    };
    clientPartner?: {id: string; version: number; simpleFullName?: string};
  };
  status?: {id: string; version: number; name?: string};
  projectTaskCategory?: {id: string; version: number; name?: string};
  updatedOn?: Date | undefined;
};

export type Ticket = {
  id: string;
  version: number;
  name?: string;
  invoicingType?: number | undefined;
  invoicingUnit?: {id: string; version: number; name?: string};
  taskEndDate?: Date | undefined;
  displayFinancialData?: boolean | undefined;
  description?: string | undefined;
  assignment?: number | undefined;
  assignedTo?: {id: string; version: number; name?: string};
  managedByContact?: {
    id: string;
    version: number;
    simpleFullName?: string;
  };
  createdByContact?: {
    id: string;
    version: number;
    simpleFullName?: string;
  };
  priority?: {id: string; version: number; name?: string};
  project?: {
    id: string;
    version: number;
    name?: string;
    company?: {
      id: string;
      version: number;
      name?: string;
    };
    clientPartner?: {id: string; version: number; simpleFullName?: string};
  };
  status?: {id: string; version: number; name?: string; isCompleted?: boolean};
  targetVersion?: {id: string; version: number; title?: string};
  projectTaskCategory?: {id: string; version: number; name?: string};
  progress?: BigDecimal | undefined;
  quantity?: BigDecimal | undefined;
  createdOn?: Date | undefined;
};
