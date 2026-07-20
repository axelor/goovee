import {RESPONSIVE_SIZES} from '@/constants';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
} from '@/ui/components/responsive-dialog';
import {useResponsive} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {useRouter} from 'next/navigation';
import {
  ProductEditDialogBody,
  type ProductEditDialogBodyProps,
} from './product-edit-dialog-body';

/* Public API is unchanged: the data props the triggers pass, plus dialog
 * visibility. The host-injected chrome (Title/Description/scroll classes) and
 * the close/save handlers are supplied internally, not by callers. */
type ProductFormDialogProps = Omit<
  ProductEditDialogBodyProps,
  'onClose' | 'onSaved' | 'Title' | 'Description' | 'scrollContainerClassName'
> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Dialog shell: owns visibility and the listing refresh. The combined editor
 * lives in `ProductEditDialogBody`, mounted only while open (so it resets by
 * fresh-mount) and host-agnostic — the shell injects the Radix heading
 * primitives and the capped scroll container. The save is atomic, so the
 * listing only needs refreshing after a successful save, not on cancel.
 */
export function ProductFormDialog({
  open,
  onOpenChange,
  ...body
}: ProductFormDialogProps) {
  const router = useRouter();
  const responsive = useResponsive();
  const isSmall = RESPONSIVE_SIZES.some(size => responsive[size]);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} isSmall={isSmall}>
      <ResponsiveDialogContent className="max-w-6xl gap-0 p-0">
        <ProductEditDialogBody
          {...body}
          Title={ResponsiveDialogTitle}
          Description={ResponsiveDialogDescription}
          /* Desktop dialog is a fixed 90vh so its height stays steady while the
           * user works in it — collapsing/expanding the product or paging
           * between versions (incl. the brief loading state at the frontier);
           * the drawer (mobile) sizes to content, capped at 90vh. Custom thin
           * scrollbar, native arrow buttons hidden. */
          scrollContainerClassName={cn(
            'overflow-y-auto overscroll-contain',
            '[scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border',
            isSmall ? 'max-h-[90vh]' : 'h-[90vh]',
          )}
          onClose={() => onOpenChange(false)}
          onSaved={() => {
            onOpenChange(false);
            router.refresh();
          }}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
