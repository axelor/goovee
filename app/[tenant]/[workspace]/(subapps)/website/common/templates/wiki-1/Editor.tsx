import type {JSX} from 'react';

import {CheckListPlugin} from '@lexical/react/LexicalCheckListPlugin';
import {ClickableLinkPlugin} from '@lexical/react/LexicalClickableLinkPlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {HashtagPlugin} from '@lexical/react/LexicalHashtagPlugin';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {TablePlugin} from '@lexical/react/LexicalTablePlugin';
import {useLexicalEditable} from '@lexical/react/useLexicalEditable';
import {CAN_USE_DOM} from '@lexical/utils';
import dynamic from 'next/dynamic';
import * as React from 'react';
import {useEffect, useState} from 'react';

import {useSharedHistoryContext} from './context/SharedHistoryContext';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import CollapsiblePlugin from './plugins/CollapsiblePlugin';
import EmojisPlugin from './plugins/EmojisPlugin';
import KeywordsPlugin from './plugins/KeywordsPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import SpecialTextPlugin from './plugins/SpecialTextPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';
import ContentEditable from './ui/ContentEditable';

const EditingPlugins = dynamic(() => import('./plugins/EditingPlugins'), {
  ssr: false,
});
const ToolbarPlugin = dynamic(() => import('./plugins/ToolbarPlugin'), {
  ssr: false,
});
const ActionsPlugin = dynamic(() => import('./plugins/ActionsPlugin'), {
  ssr: false,
});

export default function Editor(props: {
  contentId: string;
  contentVersion: number;
  content: string | undefined;
  canEditWiki: boolean;
}): JSX.Element {
  const {contentId, contentVersion, content, canEditWiki} = props;
  const {historyState} = useSharedHistoryContext();
  const isEditable = useLexicalEditable();
  const placeholder = isEditable
    ? 'Enter some text...'
    : 'No content available';
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  useEffect(() => {
    if (content) {
      const editorState = editor.parseEditorState(content);
      editor.update(() => {
        editor.setEditorState(editorState);
      });
    }
  }, [content, editor]);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia('(max-width: 1025px)').matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener('resize', updateViewPortWidth);

    return () => {
      window.removeEventListener('resize', updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  return (
    <>
      {isEditable && (
        <ToolbarPlugin
          editor={editor}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          setIsLinkEditMode={setIsLinkEditMode}
        />
      )}
      <div className="editor-container">
        <EmojisPlugin />
        <HashtagPlugin />
        <KeywordsPlugin />
        <SpecialTextPlugin />
        <RichTextPlugin
          contentEditable={
            <div className="editor-scroller">
              <div className="editor" ref={onRef}>
                <ContentEditable placeholder={placeholder} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <CodeHighlightPlugin />
        <ListPlugin hasStrictIndent={false} />
        <CheckListPlugin />
        <TablePlugin
          hasCellMerge={true}
          hasCellBackgroundColor={true}
          hasHorizontalScroll={true}
        />
        <LinkPlugin hasLinkAttributes={true} />
        <ClickableLinkPlugin disabled={isEditable} />
        <TabFocusPlugin />
        <CollapsiblePlugin />
        {isEditable && (
          <EditingPlugins
            historyState={historyState}
            activeEditor={activeEditor}
            isLinkEditMode={isLinkEditMode}
            setIsLinkEditMode={setIsLinkEditMode}
            floatingAnchorElem={floatingAnchorElem}
            isSmallWidthViewport={isSmallWidthViewport}
          />
        )}
        {canEditWiki && (
          <ActionsPlugin
            contentId={contentId}
            contentVersion={contentVersion}
          />
        )}
      </div>
    </>
  );
}
