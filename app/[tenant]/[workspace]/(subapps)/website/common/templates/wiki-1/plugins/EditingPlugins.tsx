import type {HistoryState} from '@lexical/react/LexicalHistoryPlugin';
import type {LexicalEditor} from 'lexical';

import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {ClearEditorPlugin} from '@lexical/react/LexicalClearEditorPlugin';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {TabIndentationPlugin} from '@lexical/react/LexicalTabIndentationPlugin';
import * as React from 'react';

import AutoEmbedPlugin from './AutoEmbedPlugin';
import AutoLinkPlugin from './AutoLinkPlugin';
import CodeActionMenuPlugin from './CodeActionMenuPlugin';
import ComponentPickerPlugin from './ComponentPickerPlugin';
import ContextMenuPlugin from './ContextMenuPlugin';
import DragDropPaste from './DragDropPastePlugin';
import DraggableBlockPlugin from './DraggableBlockPlugin';
import EmojiPickerPlugin from './EmojiPickerPlugin';
import EquationsPlugin from './EquationsPlugin';
import ExcalidrawPlugin from './ExcalidrawPlugin';
import FigmaPlugin from './FigmaPlugin';
import FloatingLinkEditorPlugin from './FloatingLinkEditorPlugin';
import FloatingTextFormatToolbarPlugin from './FloatingTextFormatToolbarPlugin';
import ImagesPlugin from './ImagesPlugin';
import InlineImagePlugin from './InlineImagePlugin';
import {LayoutPlugin} from './LayoutPlugin/LayoutPlugin';
import MarkdownShortcutPlugin from './MarkdownShortcutPlugin';
import MentionsPlugin from './MentionsPlugin';
import PageBreakPlugin from './PageBreakPlugin';
import ShortcutsPlugin from './ShortcutsPlugin';
import SpeechToTextPlugin from './SpeechToTextPlugin';
import TableCellActionMenuPlugin from './TableActionMenuPlugin';
import TableCellResizer from './TableCellResizer';
import TableHoverActionsPlugin from './TableHoverActionsPlugin';
import TwitterPlugin from './TwitterPlugin';
import YouTubePlugin from './YouTubePlugin';
import {HorizontalRulePlugin} from '@lexical/react/LexicalHorizontalRulePlugin';

import type { JSX } from "react";

export default function EditingPlugins(props: {
  historyState?: HistoryState;
  activeEditor: LexicalEditor;
  isLinkEditMode: boolean;
  setIsLinkEditMode: (isLinkEditMode: boolean) => void;
  floatingAnchorElem: HTMLDivElement | null;
  isSmallWidthViewport: boolean;
}): JSX.Element {
  const {
    historyState,
    activeEditor,
    isLinkEditMode,
    setIsLinkEditMode,
    floatingAnchorElem,
    isSmallWidthViewport,
  } = props;

  return (
    <>
      <DragDropPaste />
      <AutoFocusPlugin />
      <ClearEditorPlugin />
      <ComponentPickerPlugin />
      <EmojiPickerPlugin />
      <AutoEmbedPlugin />
      <MentionsPlugin />
      <SpeechToTextPlugin />
      <AutoLinkPlugin />
      <EquationsPlugin />
      <ExcalidrawPlugin />
      <FigmaPlugin />
      <HorizontalRulePlugin />
      <ImagesPlugin />
      <InlineImagePlugin />
      <LayoutPlugin />
      <PageBreakPlugin />
      <TwitterPlugin />
      <YouTubePlugin />
      <HistoryPlugin externalHistoryState={historyState} />
      <ShortcutsPlugin
        editor={activeEditor}
        setIsLinkEditMode={setIsLinkEditMode}
      />
      <MarkdownShortcutPlugin />
      <TabIndentationPlugin maxIndent={7} />
      <TableCellResizer />
      <ContextMenuPlugin />
      {floatingAnchorElem && (
        <>
          <FloatingLinkEditorPlugin
            anchorElem={floatingAnchorElem}
            isLinkEditMode={isLinkEditMode}
            setIsLinkEditMode={setIsLinkEditMode}
          />
          <TableCellActionMenuPlugin
            anchorElem={floatingAnchorElem}
            cellMerge={true}
          />
        </>
      )}
      {floatingAnchorElem && !isSmallWidthViewport && (
        <>
          <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
          <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
          <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
          <FloatingTextFormatToolbarPlugin
            anchorElem={floatingAnchorElem}
            setIsLinkEditMode={setIsLinkEditMode}
          />
        </>
      )}
    </>
  );
}
