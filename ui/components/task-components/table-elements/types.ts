import type {SortType} from '@/ui/hooks/use-sort-by';
import type {ReactNode} from 'react';

export type Getter<T extends any> = (ticket: T) => unknown;

export type Column<T extends Record<string, any>> = {
  key: string;
  content: (record: T) => ReactNode;
  label: string;
  mobile?: boolean;
  getter?: string | Getter<T>;
  type?: SortType;
  required?: boolean;
};
