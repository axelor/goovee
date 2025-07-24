import type {Entity, IdFilter, WhereArg, WhereOptions} from '@goovee/orm';

export type Where<T extends Entity> = {
  -readonly [K in keyof T]?: K extends 'id' ? IdFilter : WhereArg<T[K]>;
} & {
  OR?: WhereOptions<T>[];
  AND?: WhereOptions<T>[];
  NOT?: WhereOptions<T>[];
};
