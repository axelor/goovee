'use client';

import * as React from 'react';
import {createContext, useContext} from 'react';
import {Popover, PopoverContent, PopoverTrigger} from '../popover';
import {Drawer, DrawerContent, DrawerTrigger} from '../drawer';

type PopoverResponsiveProps = React.ComponentProps<typeof Popover> &
  React.ComponentProps<typeof Drawer> & {
    isSmall: boolean;
  };

type PopoverTriggerResponsiveProps = React.ComponentProps<
  typeof PopoverTrigger
> &
  React.ComponentProps<typeof DrawerTrigger>;

type PopoverContentResponsiveProps = React.ComponentProps<
  typeof PopoverContent
> &
  React.ComponentProps<typeof DrawerContent>;

const ResponsiveContext = createContext<{isSmall: boolean} | null>(null);

const useResponsiveContext = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error(
      'useResponsiveContext must be used within a PopoverResponsive',
    );
  }
  return context;
};

const PopoverResponsive = ({
  children,
  isSmall,
  ...props
}: PopoverResponsiveProps) => {
  const Component = isSmall ? Drawer : Popover;
  return (
    <ResponsiveContext.Provider value={{isSmall}}>
      <Component {...props}>{children}</Component>
    </ResponsiveContext.Provider>
  );
};

const PopoverTriggerResponsive = React.forwardRef<
  HTMLButtonElement,
  PopoverTriggerResponsiveProps
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
    <PopoverTrigger {...props} ref={ref}>
      {children}
    </PopoverTrigger>
  );
});
PopoverTriggerResponsive.displayName = 'PopoverTriggerResponsive';

const PopoverContentResponsive = React.forwardRef<
  HTMLDivElement,
  PopoverContentResponsiveProps
>(({children, ...props}, ref) => {
  const {isSmall} = useResponsiveContext();
  if (isSmall) {
    return (
      <DrawerContent {...props} ref={ref}>
        {children}
      </DrawerContent>
    );
  }
  return (
    <PopoverContent {...props} ref={ref}>
      {children}
    </PopoverContent>
  );
});
PopoverContentResponsive.displayName = 'PopoverContentResponsive';

export {PopoverResponsive, PopoverTriggerResponsive, PopoverContentResponsive};

