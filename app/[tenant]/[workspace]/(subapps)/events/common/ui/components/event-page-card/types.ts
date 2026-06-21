import type {Partner} from '@/orm/partner';
import {PortalWorkspace} from '@/orm/workspace';
import type {Cloned} from '@/types/util';
import type {
  EventDefaultPrice,
  EventDetailData,
  FullEvent,
} from '@/subapps/events/common/orm/event';
import type {ModelField} from '@/orm/model-fields';

export interface EventPageCardProps {
  eventDetails: Cloned<EventDetailData>;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user?: Partner | null;
  pricePromise?: Promise<EventDefaultPrice>;
}

export interface RegistrationFormProps {
  eventDetails: Cloned<FullEvent>;
  metaFields?: ModelField[];
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user?: Partner | null;
}
