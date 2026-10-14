'use client';

// ---- LOCAL IMPORTS ---- //
import {HtmlEditor} from './html-editor';
import {RichTextViewer} from './rich-text-viewer';

export interface RichTextEditorProps {
  content?: string | null;
  classNames?: {
    toolbarClassName?: string;
    wrapperClassName?: string;
    editorClassName?: string;
  };
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /* Drops the toolbar down to the commands that fit a narrow field. */
  lite?: boolean;
  onChange?: (content: string) => void;
}

export function RichTextEditor({
  content,
  classNames,
  readOnly,
  disabled,
  placeholder,
  lite,
  onChange,
}: RichTextEditorProps) {
  const {toolbarClassName, wrapperClassName, editorClassName} =
    classNames ?? {};

  /* A field that cannot be edited is shown the way it is shown everywhere else. */
  if (readOnly || disabled) {
    return (
      <RichTextViewer
        content={content}
        className={wrapperClassName}
        innerHTMLClassName={editorClassName}
      />
    );
  }

  return (
    <HtmlEditor
      value={content ?? ''}
      onChange={onChange}
      lite={lite}
      placeholder={placeholder}
      className={wrapperClassName}
      toolbarClassName={toolbarClassName}
      contentClassName={editorClassName}
    />
  );
}

export default RichTextEditor;
