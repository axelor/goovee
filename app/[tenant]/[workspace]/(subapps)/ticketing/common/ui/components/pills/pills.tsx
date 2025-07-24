import {forwardRef} from 'react';
import {Maybe} from '@/types/util';
import {Tag} from '@/ui/components';
import {cn} from '@/utils/css';
import {taskPriorityMap, taskStatusMap} from '@/constants';

type PillProps = {
  name: Maybe<string>;
  className?: string;
};

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
