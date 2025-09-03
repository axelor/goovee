import {forwardRef} from 'react';
import {Maybe} from '@/types/util';
import {Tag} from '@/ui/components';
import type {Variant} from '@/ui/components/tag';
import {cn} from '@/utils/css';

const statusMap = new Map<string, Variant>();
statusMap.set('New', 'default');
statusMap.set('In progress', 'yellow');
statusMap.set('Done', 'success');
statusMap.set('Canceled', 'destructive');

type PillProps = {
  name: Maybe<string>;
  className?: string;
};

export const Status = forwardRef<HTMLDivElement, PillProps>(({name}, ref) => {
  if (!name) return null;

  return (
    <Tag
      variant={statusMap.get(name) ?? 'default'}
      className="text-[10px] py-1 w-max"
      outline>
      {name}
    </Tag>
  );
});

Status.displayName = 'Status';

const priorityMap = new Map<string, Variant>();
priorityMap.set('High', 'orange');
priorityMap.set('Low', 'success');
priorityMap.set('Normal', 'yellow');
priorityMap.set('Urgent', 'destructive');

export const Priority = forwardRef<HTMLDivElement, PillProps>(({name}, ref) => {
  if (!name) return null;

  return (
    <Tag
      variant={priorityMap.get(name) ?? 'default'}
      className="text-[10px] py-1 w-max">
      {name}
    </Tag>
  );
});

Priority.displayName = 'Priority';

export const Category = forwardRef<HTMLDivElement, PillProps>(
  ({name, className}, ref) => {
    if (!name) return null;
    return (
      <Tag
        variant="purple"
        className={cn('text-[10px] py-1 rounded', className)}>
        {name}
      </Tag>
    );
  },
);

Category.displayName = 'Category';
