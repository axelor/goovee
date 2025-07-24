import {forwardRef} from 'react';
import {Maybe} from '@/types/util';
import {cn} from '@/utils/css';
import {Tag} from '../../tag';
import type {Variant} from '../../tag';

type PillProps = {
  name: Maybe<string>;
  className?: string;
};

export const taskStatusMap = new Map<string, Variant>();
taskStatusMap.set('New', 'default');
taskStatusMap.set('In progress', 'yellow');
taskStatusMap.set('Done', 'success');
taskStatusMap.set('Canceled', 'destructive');

export const Status = forwardRef<HTMLDivElement, PillProps>(({name}, ref) => {
  if (!name) return null;

  return (
    <Tag
      variant={taskStatusMap.get(name) ?? 'default'}
      className="text-[10px] py-1 w-max"
      outline>
      {name}
    </Tag>
  );
});
Status.displayName = 'Status';

export const taskPriorityMap = new Map<string, Variant>();
taskPriorityMap.set('High', 'orange');
taskPriorityMap.set('Low', 'success');
taskPriorityMap.set('Normal', 'yellow');
taskPriorityMap.set('Urgent', 'destructive');

export const Priority = forwardRef<HTMLDivElement, PillProps>(({name}, ref) => {
  if (!name) return null;

  return (
    <Tag
      variant={taskPriorityMap.get(name) ?? 'default'}
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
