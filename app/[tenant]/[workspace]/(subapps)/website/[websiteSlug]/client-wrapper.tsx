'use client';

import {TemplateProps} from '../common/types';
import {
  getWebsiteComponent,
  getWebsitePlugins,
} from '../common/utils/component';

export function Template(props: TemplateProps) {
  if (!props.code) return null;
  const Component = getWebsiteComponent(props.code);
  return <Component {...props} />;
}

export function Plugins(props: {codes: string[]}) {
  const {codes} = props;
  const plugins = getWebsitePlugins(codes).map((Plugin, i) => (
    <Plugin key={i} />
  ));

  return plugins;
}
