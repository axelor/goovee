import * as React from 'react';
import {cva, type VariantProps} from 'class-variance-authority';

import {cn} from '@/utils/css';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        tag_default:
          'border-0 px-4 py-[0.4375rem] capitalize text-base font-semibold',
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:brightness-125',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-success text-success-foreground hover:bg-success/80',
        ['success-inverse']:
          'bg-success-foreground text-success hover:bg-success-foreground/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({className, variant, ...props}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({variant}), className)} {...props} />
  );
}

export {Badge, badgeVariants};
