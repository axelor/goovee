'use client';

import {
  formatRelativeTime,
  formatDateTime,
  formatDate,
} from '@/locale/formatters';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/components';

type DateOnlyFormat = {
  dateFormat?: string;
};

type DateTimeFormat = {
  dateFormat?: string;
  timeFormat?: string;
};

type ClientDateBaseProps = {
  date: string | Date | null;
  showTooltip?: boolean;
  className?: string;
  prefix?: string;
  lowercase?: boolean;
};

type ClientDateRelativeProps = ClientDateBaseProps & {
  displayType?: 'relative';
  format?: string | DateTimeFormat;
};

type ClientDateSimpleDateProps = ClientDateBaseProps & {
  displayType: 'simple';
  format?: string | DateOnlyFormat;
  includeTime?: false;
};

type ClientDateSimpleDateTimeProps = ClientDateBaseProps & {
  displayType: 'simple';
  format?: string | DateTimeFormat;
  includeTime: true;
};

type ClientDateProps =
  | ClientDateRelativeProps
  | ClientDateSimpleDateProps
  | ClientDateSimpleDateTimeProps;

export function ClientDate(props: ClientDateProps) {
  const {
    date,
    displayType = 'relative',
    format,
    showTooltip = displayType === 'relative',
    className = '',
    prefix,
    lowercase = false,
  } = props;

  if (!date) {
    return null;
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (displayType === 'relative') {
    const relativeText = formatRelativeTime(dateObj, {capitalize: !lowercase});

    if (!showTooltip) {
      return (
        <span className={className}>
          {prefix ? `${prefix} ${relativeText}` : relativeText}
        </span>
      );
    }

    const defaultFormat: DateTimeFormat = {
      dateFormat: 'MMMM DD YYYY',
      timeFormat: 'h:mm a',
    };
    const tooltipFormat =
      typeof format === 'object'
        ? {...defaultFormat, ...format}
        : defaultFormat;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`cursor-pointer ${className}`}>
              {prefix ? `${prefix} ${relativeText}` : relativeText}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="start" className="text-xs">
            {formatDateTime(dateObj, tooltipFormat)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Simple format - discriminated by includeTime
  const includeTime = 'includeTime' in props && props.includeTime;

  if (includeTime) {
    const opts: DateTimeFormat = {
      dateFormat: 'MMMM DD YYYY',
      timeFormat: 'h:mm a',
    };
    if (typeof format === 'object') {
      if (format.dateFormat) opts.dateFormat = format.dateFormat;
      if ('timeFormat' in format && format.timeFormat)
        opts.timeFormat = format.timeFormat;
    } else if (typeof format === 'string') {
      opts.dateFormat = format;
    }
    const formattedDate = formatDateTime(dateObj, opts);
    return (
      <span className={className}>
        {prefix ? `${prefix} ${formattedDate}` : formattedDate}
      </span>
    );
  }

  // Date-only format
  const opts: DateOnlyFormat = {dateFormat: 'MMMM DD YYYY'};
  if (typeof format === 'object') {
    if (format.dateFormat) opts.dateFormat = format.dateFormat;
  } else if (typeof format === 'string') {
    opts.dateFormat = format;
  }
  const formattedDate = formatDate(dateObj, opts);
  return (
    <span className={className}>
      {prefix ? `${prefix} ${formattedDate}` : formattedDate}
    </span>
  );
}
