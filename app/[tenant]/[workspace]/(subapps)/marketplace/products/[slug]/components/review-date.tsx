'use client';

import {formatRelativeTime, formatDateTime} from '@/locale/formatters';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/components';

interface ReviewDateProps {
  createdOn: Date | null;
}

export function ReviewDate({createdOn}: ReviewDateProps) {
  if (!createdOn) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="text-xs text-muted-foreground cursor-pointer">
            • {formatRelativeTime(createdOn)}
          </p>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="text-xs">
          {formatDateTime(createdOn, {
            dateFormat: 'MMMM DD YYYY',
            timeFormat: 'h:mm a',
          })}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
