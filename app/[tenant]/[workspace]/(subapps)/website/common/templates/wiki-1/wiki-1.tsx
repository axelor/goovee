'use client';
import type {TemplateProps} from '@/subapps/website/common/types';
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import {$isTextNode, DOMConversionMap, TextNode} from 'lexical';
import Editor from './Editor';
import {FlashMessageContext} from './context/FlashMessageContext';
import {SharedHistoryContext} from './context/SharedHistoryContext';
import {ToolbarContext} from './context/ToolbarContext';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import TableOfContentsPlugin from './plugins/TableOfContentsPlugin';
import {TableContext} from './plugins/TablePlugin';
import {parseAllowedFontSize} from './plugins/ToolbarPlugin/fontSize';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import {parseAllowedColor} from './ui/ColorPicker';

import type {Wiki1Data} from './meta';

import './index.css';

function getExtraStyles(element: HTMLElement): string {
  // Parse styles from pasted input, but only if they match exactly the
  // sort of styles that would be produced by exportDOM
  let extraStyles = '';
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);
  if (fontSize !== '' && fontSize !== '15px') {
    extraStyles += `font-size: ${fontSize};`;
  }
  if (backgroundColor !== '' && backgroundColor !== 'rgb(255, 255, 255)') {
    extraStyles += `background-color: ${backgroundColor};`;
  }
  if (color !== '' && color !== 'rgb(0, 0, 0)') {
    extraStyles += `color: ${color};`;
  }
  return extraStyles;
}

function buildImportMap(): DOMConversionMap {
  const importMap: DOMConversionMap = {};

  // Wrap all TextNode importers with a function that also imports
  // the custom styles implemented by the playground
  for (const [tag, fn] of Object.entries(TextNode.importDOM() || {})) {
    importMap[tag] = importNode => {
      const importer = fn(importNode);
      if (!importer) {
        return null;
      }
      return {
        ...importer,
        conversion: element => {
          const output = importer.conversion(element);
          if (
            output === null ||
            output.forChild === undefined ||
            output.after !== undefined ||
            output.node !== null
          ) {
            return output;
          }
          const extraStyles = getExtraStyles(element);
          if (extraStyles) {
            const {forChild} = output;
            return {
              ...output,
              forChild: (child, parent) => {
                const textNode = forChild(child, parent);
                if ($isTextNode(textNode)) {
                  textNode.setStyle(textNode.getStyle() + extraStyles);
                }
                return textNode;
              },
            };
          }
          return output;
        },
      };
    };
  }

  return importMap;
}

export function Wiki1(props: TemplateProps<Wiki1Data>) {
  const {data, contentId, contentVersion, canEditWiki} = props;
  const {wiki1Content: content} = data || {};

  const initialConfig: InitialConfigType = {
    html: {import: buildImportMap()},
    namespace: 'Playground',
    nodes: [...PlaygroundNodes],
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme,
    editable: false,
  };

  return (
    <div className="lexical relative h-full">
      <FlashMessageContext>
        <LexicalComposer initialConfig={initialConfig}>
          <SharedHistoryContext>
            <TableContext>
              <ToolbarContext>
                <div className="lexical-container">
                  <div className="editor-shell">
                    <Editor
                      content={content}
                      contentId={String(contentId!)}
                      contentVersion={contentVersion!}
                      canEditWiki={!!canEditWiki}
                    />
                  </div>
                  <aside className="lexical-sidebar">
                    <TableOfContentsPlugin />
                  </aside>
                </div>
              </ToolbarContext>
            </TableContext>
          </SharedHistoryContext>
        </LexicalComposer>
      </FlashMessageContext>
    </div>
  );
}
