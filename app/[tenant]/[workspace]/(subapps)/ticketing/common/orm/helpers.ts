import type {Entity, OrderByArg, WhereOptions} from '@goovee/orm';

export type QueryProps<T extends Entity> = {
  where?: WhereOptions<T> | null;
  take?: number;
  orderBy?: OrderByArg<T> | null;
  skip?: number;
};
