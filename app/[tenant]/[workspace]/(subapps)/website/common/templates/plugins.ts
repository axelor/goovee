import dynamic from 'next/dynamic';
import {ComponentType} from 'react';

export const plugins = {
  'progress-bar': dynamic(() =>
    import('../hooks/progress-bar').then(mod => mod.ProgressBar),
  ),
  lightbox: dynamic(() =>
    import('../hooks/lightbox').then(mod => mod.LightBox),
  ),
  tooltip: dynamic(() => import('../hooks/tooltip').then(mod => mod.Tooltip)),
  'nested-dropdown': dynamic(() =>
    import('../hooks/nested-dropdown').then(mod => mod.NestedDropdown),
  ),
  clipboard: dynamic(() =>
    import('../hooks/clipboard').then(mod => mod.Clipboard),
  ),
  'replace-me': dynamic(() =>
    import('../hooks/replace-me').then(mod => mod.ReplaceMe),
  ),
} as Record<string, ComponentType>;
