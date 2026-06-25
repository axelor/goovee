import type {Partner} from '@/orm/partner';
import {PortalAppConfig} from '@/orm/workspace';
import type {Cloned} from '@/types/util';
import type {FullEvent} from '@/subapps/events/common/orm/event';
import type {ModelField} from '@/orm/model-fields';

export interface EventPageCardProps {
  eventDetails: Cloned<FullEvent>;
  metaFields?: ModelField[];
  config: PortalAppConfig | Cloned<PortalAppConfig>;
  user?: Partner | null;
}
