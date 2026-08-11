import {Skeleton} from '@/ui/components/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto flex flex-col gap-6 pt-6 pb-24 lg:pb-6">
      <div className="w-full rounded-2xl p-4 flex flex-col gap-4">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-[15.625rem] w-full rounded-lg" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    </div>
  );
}
