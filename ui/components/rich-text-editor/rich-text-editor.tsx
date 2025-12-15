'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {convertToRaw, ContentState, EditorState} from 'draft-js';
import dynamic from 'next/dynamic';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';

// ---- CORE IMPORTS ---- //
import {cn} from '@/utils/css';
import {Skeleton} from '../skeleton';
import './rich-text-editor.css';

const Editor = dynamic(
  () => import('react-draft-wysiwyg').then(module => module.Editor),
  {
    ssr: false,
    loading: () => <Skeleton className={'min-h-[344px] xl:min-h-[244px]'} />,
  },
);

interface RichTextEditorProps {
  content?: string | any;
  classNames?: {
    toolbarClassName?: string;
    wrapperClassName?: string;
    editorClassName?: string;
  };
  readOnly?: boolean;
  disabled?: boolean;
  onChange?: (content: string) => void;
}

export const RichTextEditor = ({
  content,
  onChange,
  classNames,
  ...rest
}: RichTextEditorProps) => {
  const {
    toolbarClassName = '',
    wrapperClassName = '',
    editorClassName = '',
  } = classNames || {};

  const initiated = useRef(false);

  const convertHtmlToEditorState = (html?: string) => {
    if (!html) return EditorState.createEmpty();
    const blocksFromHtml = htmlToDraft(html);
    const contentState = ContentState.createFromBlockArray(
      blocksFromHtml.contentBlocks,
      blocksFromHtml.entityMap,
    );
    return EditorState.createWithContent(contentState);
  };

  const [editorState, setEditorState] = useState<EditorState>(() =>
    convertHtmlToEditorState(content),
  );

  const handleChange = useCallback(
    (newEditorState: EditorState) => {
      setEditorState(newEditorState);
      const contentStateRaw = convertToRaw(newEditorState.getCurrentContent());
      const htmlVersion = draftToHtml(contentStateRaw);

      onChange?.(htmlVersion);
    },
    [onChange],
  );

  useEffect(() => {
    if (initiated.current && content) {
      setEditorState(convertHtmlToEditorState(content));
    }
    initiated.current = true;
  }, [content]);

  return (
    <Editor
      editorState={editorState}
      toolbarClassName={cn('bg-gray-700 mt-2', toolbarClassName)}
      wrapperClassName={cn(
        'rounded-sm overflow-hidden max-h-fit overflow-x-hidden break-words resize-y border-gray-100 border rounded-md',
        wrapperClassName,
      )}
      editorClassName={cn('min-h-[300px] xl:min-h-[200px]', editorClassName)}
      onEditorStateChange={handleChange}
      editorStyle={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      }}
      mention={{
        separator: ' ',
      }}
      {...rest}
    />
  );
};

export default RichTextEditor;
