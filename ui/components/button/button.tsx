import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva, type VariantProps} from 'class-variance-authority';

import {cn} from '@/utils/css';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary h-10',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        outline:
          'border border-primary bg-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary',

        'outline-success':
          'border border-success bg-white text-success hover:bg-success-foreground hover:text-success',

        'outline-destructive':
          'border border-destructive bg-destructive-foreground text-destructive hover:bg-destructive-foreground hover:text-destructive',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-primary',
        link: 'text-primary underline-offset-4 hover:underline',

        // ---- New design system variants (additive) ----
        // Solid variants carry a transparent border so their content box
        // matches the *-outline variants → text stays vertically aligned
        // when both are placed side by side.
        royal:
          'bg-royal text-white border border-transparent hover:bg-royal-dark rounded-[10px] shadow-[0_1px_2px_rgba(13,30,75,0.15),0_4px_12px_rgba(13,30,75,0.12)]',
        'royal-outline':
          'bg-white text-royal border border-royal-border hover:bg-royal-pale rounded-[10px]',
        'royal-ghost':
          'bg-transparent text-royal border border-transparent hover:bg-royal-pale rounded-[10px]',
        dark: 'bg-ink-900 text-white border border-transparent hover:bg-ink-800 rounded-[10px]',
        mint: 'bg-mint-500 text-white border border-transparent hover:bg-mint-600 rounded-[10px] shadow-[0_1px_2px_rgba(20,63,46,0.15),0_4px_12px_rgba(20,63,46,0.10)]',
        'mint-outline':
          'bg-white text-mint-700 border border-mint-200 hover:bg-mint-50 rounded-[10px]',
        'ink-outline':
          'bg-white text-ink-700 border border-ink-150 hover:bg-ink-50 rounded-[10px]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({className, variant, size, asChild = false, ...props}, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({variant, size, className}))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export {Button, buttonVariants};
