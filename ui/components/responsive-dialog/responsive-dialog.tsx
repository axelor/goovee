'use client';

import * as React from 'react';
import {createContext, useContext} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '../dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '../drawer';

type ResponsiveDialogProps = React.ComponentProps<typeof Dialog> &
  React.ComponentProps<typeof Drawer> & {
    isSmall: boolean;
  };

type ResponsiveDialogTriggerProps = React.ComponentProps<typeof DialogTrigger> &
  React.ComponentProps<typeof DrawerTrigger>;

type ResponsiveDialogContentProps = React.ComponentProps<typeof DialogContent> &
  React.ComponentProps<typeof DrawerContent>;

const ResponsiveContext = createContext<{isSmall: boolean} | null>(null);

const useResponsiveContext = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error(
      'useResponsiveContext must be used within a ResponsiveDialog',
    );
  }
  return context;
};

const ResponsiveDialog = ({
  children,
  isSmall,
  ...props
}: ResponsiveDialogProps) => {
  const Component = isSmall ? Drawer : Dialog;
  return (
    <ResponsiveContext.Provider value={{isSmall}}>
      <Component {...props}>{children}</Component>
    </ResponsiveContext.Provider>
  );
};

const ResponsiveDialogTrigger = React.forwardRef<
  HTMLButtonElement,
  ResponsiveDialogTriggerProps
>(({children, ...props}, ref) => {
  const {isSmall} = useResponsiveContext();
  if (isSmall) {
    return (
      <DrawerTrigger {...props} ref={ref}>
        {children}
      </DrawerTrigger>
    );
  }
  return (
    <DialogTrigger {...props} ref={ref}>
      {children}
    </DialogTrigger>
  );
});
ResponsiveDialogTrigger.displayName = 'ResponsiveDialogTrigger';

const ResponsiveDialogContent = React.forwardRef<
  HTMLDivElement,
  ResponsiveDialogContentProps
>(({children, className, ...props}, ref) => {
  const {isSmall} = useResponsiveContext();
  if (isSmall) {
    return (
      <DrawerContent {...props} ref={ref}>
        {children}
      </DrawerContent>
    );
  }
  return (
    <DialogContent {...props} className={className} ref={ref}>
      {children}
    </DialogContent>
  );
});
ResponsiveDialogContent.displayName = 'ResponsiveDialogContent';

const ResponsiveDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof DialogTitle> &
    React.ComponentPropsWithoutRef<typeof DrawerTitle>
>(({children, ...props}, ref) => {
  const {isSmall} = useResponsiveContext();
  const Comp = isSmall ? DrawerTitle : DialogTitle;
  return (
    <Comp {...props} ref={ref}>
      {children}
    </Comp>
  );
});
ResponsiveDialogTitle.displayName = 'ResponsiveDialogTitle';

const ResponsiveDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof DialogDescription> &
    React.ComponentPropsWithoutRef<typeof DrawerDescription>
>(({children, ...props}, ref) => {
  const {isSmall} = useResponsiveContext();
  const Comp = isSmall ? DrawerDescription : DialogDescription;
  return (
    <Comp {...props} ref={ref}>
      {children}
    </Comp>
  );
});
ResponsiveDialogDescription.displayName = 'ResponsiveDialogDescription';

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
};
