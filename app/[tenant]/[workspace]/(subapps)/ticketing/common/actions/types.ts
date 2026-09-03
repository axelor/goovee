import {MUTATE_TYPE} from '../constants';
import type {CreateTicketInfo, UpdateTicketInfo} from '../utils/validators';

export type MutateProps = {
  action:
    | {
        type: typeof MUTATE_TYPE.CREATE;
        data: CreateTicketInfo;
      }
    | {
        type: typeof MUTATE_TYPE.UPDATE;
        data: UpdateTicketInfo;
      };
};

export type ActionConfig = {
  force?: boolean;
};
