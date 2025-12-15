import React from 'react';
import {forwardRef} from 'react';

// ---- CORE IMPORTS ---- //
import {cn} from '@/utils/css';
import {InnerHTML, InnerHTMLProps} from '../inner-html';
import '@/ui/components/rich-text-editor/rich-text-editor.css';

export const RichTextViewer = forwardRef<
  HTMLDivElement,
  InnerHTMLProps & {innerHTMLClassName?: string}
>((props, ref) => {
  const {content, className, innerHTMLClassName, ...rest} = props;
  return (
    <div className={cn('DraftEditor-editorContainer', className)}>
      <InnerHTML
        content={content}
        className={cn(
          'public-DraftEditor-content rdw-editor-wrapper overflow-auto relative',
          innerHTMLClassName,
        )}
        ref={ref}
        {...rest}
      />
    </div>
  );
});

RichTextViewer.displayName = 'RichTextViewer';
