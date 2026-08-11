import {Skeleton} from '@/ui/components/skeleton';
import {Separator} from '@/ui/components/separator';

export function CartItemSkeleton() {
  return (
    <div className="flex-col md:flex-row flex items-start gap-6 bg-card text-card-foreground p-4 rounded-lg">
      <Skeleton
        className="rounded-lg h-[12.5rem] md:w-[12.5rem] w-full min-w-[12.5rem]"
        style={{backgroundSize: 'cover'}}
      />
      <div className="flex-col md:flex-row flex items-start justify-between w-full h-full">
        <div className="flex flex-col items-start justify-between py-2 h-full">
          <Skeleton className="h-6 w-44" />
          <div className="flex flex-col mt-auto gap-4">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end ml-auto py-2 h-full">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="w-6 h-4 p-0 ml-auto mt-auto" />
        </div>
      </div>
    </div>
  );
}

export function CartItemsSkeleton() {
  const items = Array.from({length: 5});

  return (
    <div className="flex flex-col gap-6">
      {items?.map((_, i) => <CartItemSkeleton key={i} />)}
    </div>
  );
}

export function CartSummarySkeleton() {
  return (
    <div className="p-4 bg-card text-card-foreground rounded-lg h-fit">
      <Skeleton className="h-6 mb-6" />
      <Separator className="mb-2" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Separator className="my-2" />
      <div className="flex flex-col gap-4 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-full rounded-full" />
        <Skeleton className="h-8 w-full rounded-full" />
      </div>
      <Separator className="mb-4" />
      <Skeleton className="h-8 w-full rounded-full" />
    </div>
  );
}

export function CartSkeleton() {
  return (
    <>
      <Skeleton className="h-4 w-32 mb-6" />
      <div className="grid mb-[5rem] lg:mb-0 lg:grid-cols-[1fr_25%] xl:grid-cols-[1fr_21%] grid-cols-1 gap-4">
        <CartItemsSkeleton />
        <CartSummarySkeleton />
      </div>
    </>
  );
}

export function CheckoutSummarySkeleton() {
  const items = Array.from({length: 3});
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg">
      <Skeleton className="h-6 w-32 mb-6" />
      <div className="flex flex-col gap-4 pt-4">
        {items.map((it, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="rounded-lg w-[5rem] h-[5rem]" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-44" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CheckoutTotalSkeleton() {
  return (
    <div className="rounded-lg p-4 bg-card text-card-foreground">
      <Skeleton className="h-6 w-32" />
      <Separator className="my-4" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-4 w-32" />
        <div>
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

export function CheckoutShippingSkeleton() {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg">
      <Skeleton className="h-6 w-32" />
      <Separator className="my-4" />
      <div className="border rounded-lg flex p-4 gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-40" />
        </div>

        <Skeleton className="h-4 w-32 ml-auto" />
      </div>

      <div className="border rounded-lg flex p-4 gap-4 mt-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <Skeleton className="h-4 w-32 ml-auto" />
      </div>
    </div>
  );
}

export function AddressSelectionSkeleton() {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg">
      <Skeleton className="h-6 w-32" />
      <Separator className="my-4" />

      <div className="space-y-2 divide-y">
        <div className="border p-4 rounded-lg space-y-2">
          <Skeleton className="h-6 w-32 mb-4" />
          <div>
            <Skeleton className="h-6 w-60 mb-4" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    </div>
  );
}

export function CheckoutPaymentSkeleton() {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg">
      <Skeleton className="h-6 w-32" />
      <Separator className="my-4" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <>
      <Skeleton className="h-6 w-44 mb-6" />
      <div className="grid lg:grid-cols-[1fr_25%] xl:grid-cols-[1fr_21%] grid-cols-1 gap-4">
        <div>
          <div className="flex flex-col gap-6">
            <AddressSelectionSkeleton />
            <AddressSelectionSkeleton />
            <CheckoutShippingSkeleton />
            <CheckoutPaymentSkeleton />
          </div>
        </div>
        <div>
          <div className="flex flex-col gap-6">
            <CheckoutSummarySkeleton />
            <CheckoutTotalSkeleton />
          </div>
        </div>
      </div>
    </>
  );
}
