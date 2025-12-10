'use client';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {formatDateTime, formatRelativeTime} from '@/lib/core/locale/formatters';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/components/tooltip';

export function ClientRedirection(props: {url: string}) {
  const router = useRouter();
  useEffect(() => {
    router.replace(props.url);
  }, [props.url, router]);
  return (
    <div className="grid grid-cols-1 p-4 h-full">
      <div className="flex items-center justify-center !border-0">
        <div className="w-6 h-6 border-2 border-t-transparent border-gray-400 rounded-full animate-spin-fast" />
      </div>
    </div>
  );
}

export function DateDisplay({
  date,
  dateFormat = 'MMMM D YYYY,',
  timeFormat = ' h:mm a',
}: {
  date: string | Date | null;
  dateFormat?: string;
  timeFormat?: string;
}) {
  if (typeof window === 'undefined')
    throw new Error('Render on client side only');
  if (!date) return null;
  return (
    <TooltipComponent
      triggerText={formatRelativeTime(date)}
      tooltipText={formatDateTime(date, {dateFormat, timeFormat})}
    />
  );
}

const TooltipComponent = ({
  triggerText,
  tooltipText,
}: {
  triggerText: string;
  tooltipText: string;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <div className="text-[10px] leading-3">{triggerText}</div>
      </TooltipTrigger>
      <TooltipContent align="start" className="px-4 py-1 text-[10px]">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
