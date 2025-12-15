// ---- CORE IMPORTS ---- //
import {Container} from '@/ui/components/container';
import {Separator} from '@/ui/components/separator';
import {Skeleton} from '@/ui/components/skeleton';

export function OrderSkeleton() {
  const columns = Array.from({length: 5});
  const rows = Array.from({length: 5});

  return (
    <Container title="">
      <div className="grid grid-col-4 gap-4">
        <span className="col-span-4">
          <Skeleton className="h-8 w-44 bg-white rounded-full" />
        </span>
        <div className="flex flex-col gap-4 col-span-4 bg-white p-4">
          <Skeleton className="h-8 w-44  rounded-full" />
          <Separator />
          <Skeleton className="h-4 w-32  rounded-full" />
          <Skeleton className="h-4 w-32  rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="col-span-3 flex flex-col gap-4 p-4 bg-white">
          <Skeleton className="h-8 w-44  rounded-full" />
          <div className="border rounded-md grid grid-cols-2 p-2">
            <div className="gap-y-2">
              <Skeleton className="h-6 w-44 rounded-full mb-2" />
              <Skeleton className="h-4 w-60  rounded-full" />
              <Skeleton className="h-4 w-60  rounded-full" />
            </div>
            <div className="gap-y-2">
              <Skeleton className="h-6 w-44 rounded-full mb-2" />
              <Skeleton className="h-4 w-60  rounded-full" />
              <Skeleton className="h-4 w-60  rounded-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-44  rounded-full" />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-medium text-muted-foreground border-b">
                {columns.map((header, idx) => (
                  <th key={idx} className="p-3">
                    <Skeleton className="h-6 w-32" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b">
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="p-3">
                      <Skeleton className="h-6 w-28" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 bg-white p-4 h-fit">
            <Skeleton className="h-6 w-44  rounded-full" />
            <Separator />
            <Skeleton className="h-4 w-32  rounded-full" />
            <Skeleton className="h-4 w-32  rounded-full" />
            <Skeleton className="h-4 w-32  rounded-full" />
          </div>
          <div className="flex flex-col gap-4 bg-white p-4 h-fit">
            <Skeleton className="h-6 w-44  rounded-full" />
            <Separator />
            <Skeleton className="h-4 w-32  rounded-full" />
            <Skeleton className="h-4 w-32  rounded-full" />
          </div>
          <div className="flex flex-col gap-4 bg-white p-4 h-fit">
            <Skeleton className="h-6 w-44  rounded-full" />
            <Separator />
            <Skeleton className="h-4 w-32  rounded-full" />
            <Skeleton className="h-4 w-32  rounded-full" />
          </div>
        </div>
      </div>
    </Container>
  );
}
