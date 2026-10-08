import type {Partner} from '@/orm/partner';
import {EventsConfig} from '@/subapps/events/common/orm/config';
import type {Cloned} from '@/types/util';
import type {FullEvent} from '@/subapps/events/common/orm/event';
import type {ModelField} from '@/orm/model-fields';
import type {OfferedGateway} from '@/payment/offer';

export interface EventPageCardProps {
  eventDetails: Cloned<FullEvent>;
  metaFields?: ModelField[];
  config: EventsConfig | Cloned<EventsConfig>;
  user?: Partner | null;
  /** The payment methods a priced registration may be paid with, decided on the server. */
  gateways: OfferedGateway[];
  checkoutToken: string;
}
