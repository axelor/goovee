'use client';
import DOMPurify from 'dompurify';
import {
  type ComponentProps,
  type ElementType,
  type HTMLAttributes,
  type Ref,
} from 'react';

import type {Maybe} from '@/types/util';

export type InnerHTMLProps<T extends ElementType = 'div'> = {
  content: Maybe<string>;
  as?: T;
} & Omit<ComponentProps<T>, 'children' | 'dangerouslySetInnerHTML' | 'as'>;

type HTMLElementProps = HTMLAttributes<HTMLElement> & {ref?: Ref<HTMLElement>};

/*
 * Links in this content that lead to another site open in a new window, so
 * leaving the portal is visible: a new browser tab, or the system browser in
 * the mobile app. `noopener noreferrer` keeps the opened page from reaching
 * back into the portal. Set after sanitizing, which strips any `target` the
 * content itself carried. DOMPurify only runs where there is a DOM.
 */
if (DOMPurify.isSupported) {
  DOMPurify.addHook('afterSanitizeAttributes', node => {
    if (node.tagName !== 'A') return;
    const href = node.getAttribute('href');
    if (!href) return;
    let url: URL;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (url.origin === window.location.origin) return;
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  });
}

export function InnerHTML<T extends ElementType = 'div'>({
  content,
  as: Tag = 'div' as T,
  ...rest
}: InnerHTMLProps<T>) {
  const Component = Tag as ElementType<HTMLElementProps>;
  return (
    <Component
      {...rest}
      dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(content || '')}}
    />
  );
}
