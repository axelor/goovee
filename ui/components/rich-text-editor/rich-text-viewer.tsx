import {forwardRef} from 'react';

// ---- CORE IMPORTS ---- //
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {InnerHTML, type InnerHTMLProps} from '../inner-html';
import {FORBIDDEN_TAGS} from './sanitize';
import styles from './html-content.module.css';

export const RichTextViewer = forwardRef<
  HTMLDivElement,
  InnerHTMLProps & {innerHTMLClassName?: string}
>((props, ref) => {
  const {content, className, innerHTMLClassName, ...rest} = props;
  return (
    <div className={className}>
      <InnerHTML
        content={content}
        forbidTags={FORBIDDEN_TAGS}
        className={cn(styles.htmlContent, 'overflow-auto', innerHTMLClassName)}
        ref={ref}
        {...rest}
      />
    </div>
  );
});

RichTextViewer.displayName = 'RichTextViewer';
