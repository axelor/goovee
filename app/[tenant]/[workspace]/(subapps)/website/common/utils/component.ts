import dynamic from 'next/dynamic';
import {type ComponentType} from 'react';

// ---- CORE IMPORTS ---- //
import type {WebsiteComponent} from '@/types';

// ---- LOCAL IMPORTS ---- //
import type {TemplateProps} from '@/subapps/website/common/types';
import {PluginsMap} from '../templates/plugins-map';

export function getWebsiteComponent(
  component?: WebsiteComponent,
): ComponentType<TemplateProps> {
  const Fallback = () => null;
  Fallback.displayName = 'ComponentFallback';

  if (!component?.code) {
    return Fallback;
  }

  const {code, title} = component;
  const displayName = title || code;
  Fallback.displayName = displayName;

  return dynamic(
    () =>
      import('../templates').then(mod => {
        let Component = mod?.ComponentMap?.[code];

        if (!Component) {
          return Fallback;
        }

        //TODO: figure out how to add this later
        // Component.displayName = displayName;
        return Component;
      }),
    {
      loading: () => null,
      ssr: false,
    },
  );
}

export function getWebsitePlugins(code: string[]): ComponentType[] {
  const uniquePlugins = Array.from(
    new Set(code.map(code => PluginsMap[code]).flat()),
  ).filter(Boolean);
  return uniquePlugins.map(plugin =>
    dynamic(() =>
      import('../templates/plugins').then(mod => mod.plugins[plugin]),
    ),
  );
}
