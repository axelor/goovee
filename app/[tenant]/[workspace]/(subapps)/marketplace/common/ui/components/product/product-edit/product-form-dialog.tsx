import {RESPONSIVE_SIZES} from '@/constants';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
} from '@/ui/components/responsive-dialog';
import {useResponsive} from '@/ui/hooks';
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
          scrollContainerClassName="max-h-[90vh] overflow-y-auto overscroll-contain"
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
