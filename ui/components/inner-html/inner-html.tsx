'use client';
import DOMPurify from 'dompurify';
import {ComponentPropsWithoutRef, forwardRef} from 'react';

import type {Maybe} from '@/types/util';

export type InnerHTMLProps = {
  content: Maybe<string>;
} & Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'dangerouslySetInnerHTML'
>;

export const InnerHTML = forwardRef<HTMLDivElement, InnerHTMLProps>(
  (props, ref) => {
    const {content, ...rest} = props;
    return (
      <div
        dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(content || '')}}
        ref={ref}
        {...rest}
      />
    );
  },
);

InnerHTML.displayName = 'InnerHTML';
