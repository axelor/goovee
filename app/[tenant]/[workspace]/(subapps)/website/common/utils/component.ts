import {type ComponentType} from 'react';

// ---- LOCAL IMPORTS ---- //
import type {TemplateProps} from '@/subapps/website/common/types';
import {PluginsMap} from '../templates/plugins-map';
import {plugins} from '../templates/plugins';
import {ComponentMap} from '../templates';

export function getWebsiteComponent(
  code: string,
): ComponentType<TemplateProps> {
  return ComponentMap[code];
}

export function getWebsitePlugins(code: string[]): ComponentType[] {
  const uniquePlugins = Array.from(
    new Set(code.map(code => PluginsMap[code]).flat()),
  ).filter(Boolean);
  return uniquePlugins.map(plugin => plugins[plugin]);
}
