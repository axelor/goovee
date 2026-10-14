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
  /* Tags to drop on top of what the sanitizer already removes. */
  forbidTags?: string[];
} & Omit<
  ComponentProps<T>,
  'children' | 'content' | 'dangerouslySetInnerHTML' | 'as'
>;

type HTMLElementProps = HTMLAttributes<HTMLElement> & {ref?: Ref<HTMLElement>};

export function InnerHTML<T extends ElementType = 'div'>({
  content,
  as: Tag = 'div' as T,
  forbidTags,
  ...rest
}: InnerHTMLProps<T>) {
  const Component = Tag as ElementType<HTMLElementProps>;
  return (
    <Component
      {...rest}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(content || '', {FORBID_TAGS: forbidTags}),
      }}
    />
  );
}
