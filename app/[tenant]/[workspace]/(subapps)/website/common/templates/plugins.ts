import {ProgressBar} from '@/subapps/website/common/hooks/progress-bar';
import {ComponentType} from 'react';
import {LightBox} from '../hooks/lightbox';
import {Tooltip} from '../hooks/tooltip';
import {NestedDropdown} from '../hooks/nested-dropdown';
import {Clipboard} from '../hooks/clipboard';
import {ReplaceMe} from '../hooks/replace-me';

export const plugins = {
  'progress-bar': ProgressBar,
  lightbox: LightBox,
  tooltip: Tooltip,
  'nested-dropdown': NestedDropdown,
  clipboard: Clipboard,
  'replace-me': ReplaceMe,
} as Record<string, ComponentType>;
