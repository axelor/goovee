import {FC, useEffect, ReactNode} from 'react';
import changeTheme from './themeOptions';
import {usePathname} from 'next/navigation';

const ThemeProvider: FC<{children: ReactNode}> = ({children}) => {
  const pathname = usePathname();

  const removePageLoader = () => {
    const pageLoader = document.querySelector('.page-loader');
    if (pageLoader) {
      pageLoader.remove();
    }
  };

  useEffect(() => {
    if (typeof window === undefined) return;

    // Change the color and font based on route
    changeTheme(pathname);

    // Hide loader
    // If you don't want loader remove <div className="page-loader" /> element form _app.tsx
    let timer: NodeJS.Timeout;
    timer = setTimeout(() => removePageLoader(), 1000);
    return () => clearTimeout(timer);
  }, [pathname]);

  return <>{children}</>;
};

export default ThemeProvider;
