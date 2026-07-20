import {FormMessage} from '@/ui/components/form';

/* Wrapper that positions error messages absolutely, so errors appear
 * without affecting layout or creating gaps between inputs. */
export function FormMessageSpace() {
  return (
    <div className="relative">
      <div className="absolute top-full left-0 right-0">
        <FormMessage />
      </div>
    </div>
  );
}
