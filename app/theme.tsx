'use client';

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {generateCSSVariableString} from '@/utils/css';
import type {Theme} from '@/types/theme';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';

const ThemeContext = React.createContext({});

export default function Theme({
  children,
  theme: themeProp,
}: {
  children: React.ReactElement<any>;
  theme: Theme;
}) {
  const [theme, setTheme] = useState(themeProp);

  const updateTheme = useCallback((theme: Theme) => {
    setTheme(theme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      updateTheme,
    }),
    [theme, updateTheme],
  );

  useEffect(() => {
    if (!theme) return;

    if (Object.keys(theme).length === 0) {
      return;
    }

    const cssVariables = generateCSSVariableString(theme);

    const styleElement = document.createElement('style');
    styleElement.textContent = cssVariables;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): any {
  return useContext(ThemeContext);
}
