'use client';

import type {ReactNode} from 'react';
import {
  MdAddLink,
  MdAddPhotoAlternate,
  MdAutoFixHigh,
  MdCode,
  MdColorize,
  MdFormatAlignCenter,
  MdFormatAlignJustify,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdFormatBold,
  MdFormatClear,
  MdFormatColorFill,
  MdFormatColorText,
  MdFormatIndentDecrease,
  MdFormatIndentIncrease,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatSize,
  MdFormatStrikethrough,
  MdFormatUnderlined,
  MdTextFormat,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import type {EditorCommands, ToolbarItem} from './types';
import {ColorPalette, CreateImage, CreateLink, Dropdown} from './popups';

const FONTS = [
  '"Times New Roman", Times, serif',
  'Arial, Helvetica, sans-serif',
  '"Courier New", Courier, monospace',
  'Comic Sans, Comic Sans MS, cursive',
  'Impact, fantasy',
];

/*
 * Font and size are the two commands the back-office applies as attributes
 * rather than as CSS, so the markup stays what a mail client or an export can
 * read. `styleWithCSS` is turned off around them and restored after.
 */
function withoutCssStyling(apply: () => void) {
  try {
    document.execCommand('styleWithCSS', false, 'false');
    apply();
  } finally {
    document.execCommand('styleWithCSS', false, 'true');
  }
}

function styleChoices(): Record<string, ReactNode> {
  return {
    '<p>': i18n.t('Normal'),
    '<pre>': <pre>{i18n.t('Formatted')}</pre>,
    '<blockquote>': <blockquote>{i18n.t('Blockquote')}</blockquote>,
    '<h1>': <h1>{i18n.t('Header 1')}</h1>,
    '<h2>': <h2>{i18n.t('Header 2')}</h2>,
    '<h3>': <h3>{i18n.t('Header 3')}</h3>,
    '<h4>': <h4>{i18n.t('Header 4')}</h4>,
    '<h5>': <h5>{i18n.t('Header 5')}</h5>,
    '<h6>': <h6>{i18n.t('Header 6')}</h6>,
  };
}

function fontChoices(): Record<string, ReactNode> {
  return Object.fromEntries(
    FONTS.map(font => [
      font,
      <span key={font} style={{fontFamily: font}}>
        {font.split(',')[0].replace(/"/g, '')}
      </span>,
    ]),
  );
}

function sizeChoices(): Record<string, ReactNode> {
  return {
    '1': <span style={{fontSize: 'x-small'}}>{i18n.t('Smaller')}</span>,
    '2': <span style={{fontSize: 'small'}}>{i18n.t('Small')}</span>,
    '3': <span style={{fontSize: 'medium'}}>{i18n.t('Medium')}</span>,
    '4': <span style={{fontSize: 'large'}}>{i18n.t('Large')}</span>,
    '5': <span style={{fontSize: 'x-large'}}>{i18n.t('Larger')}</span>,
  };
}

function applyColor(select: (commands: EditorCommands, color: string) => void) {
  return (commands: EditorCommands, color: string) => {
    select(commands, color);
    commands.collapseSelection();
    commands.closePopup();
  };
}

export function getToolbarItems(): ToolbarItem[] {
  return [
    {
      lite: false,
      title: i18n.t('Style'),
      icon: MdTextFormat,
      popup: ({commands}) => (
        <Dropdown
          commands={commands}
          choices={styleChoices()}
          onSelect={(editor, format) => {
            editor.format(format);
            editor.closePopup();
          }}
        />
      ),
    },
    {
      lite: false,
      title: i18n.t('Font'),
      icon: MdFormatColorText,
      popup: ({commands}) => (
        <Dropdown
          commands={commands}
          choices={fontChoices()}
          onSelect={(editor, font) =>
            withoutCssStyling(() => {
              editor.fontName(font);
              editor.closePopup();
            })
          }
        />
      ),
    },
    {
      lite: false,
      title: i18n.t('Font size'),
      icon: MdFormatSize,
      popup: ({commands}) => (
        <Dropdown
          commands={commands}
          choices={sizeChoices()}
          onSelect={(editor, size) =>
            withoutCssStyling(() => {
              editor.fontSize(size);
              editor.closePopup();
            })
          }
        />
      ),
    },
    {divider: true, lite: false},
    {
      title: i18n.t('Bold (Ctrl+B)'),
      icon: MdFormatBold,
      command: 'bold',
      hotkey: 'b',
    },
    {
      title: i18n.t('Italic (Ctrl+I)'),
      icon: MdFormatItalic,
      command: 'italic',
      hotkey: 'i',
    },
    {
      title: i18n.t('Underline (Ctrl+U)'),
      icon: MdFormatUnderlined,
      command: 'underline',
      hotkey: 'u',
    },
    {
      title: i18n.t('Strikethrough (Ctrl+S)'),
      icon: MdFormatStrikethrough,
      command: 'strikeThrough',
      hotkey: 's',
    },
    {
      title: i18n.t('Remove format'),
      icon: MdFormatClear,
      command: 'removeFormat',
    },
    {divider: true},
    {
      lite: false,
      title: i18n.t('Font color'),
      icon: MdColorize,
      popup: ({commands}) => (
        <ColorPalette
          commands={commands}
          onSelect={applyColor((editor, color) => editor.foreColor(color))}
        />
      ),
    },
    {
      lite: false,
      title: i18n.t('Background color'),
      icon: MdFormatColorFill,
      popup: ({commands}) => (
        <ColorPalette
          commands={commands}
          onSelect={applyColor((editor, color) => editor.highlight(color))}
        />
      ),
    },
    {divider: true, lite: false},
    {
      lite: false,
      title: i18n.t('Insert link'),
      icon: MdAddLink,
      popup: props => <CreateLink {...props} />,
    },
    {
      lite: false,
      title: i18n.t('Insert image'),
      icon: MdAddPhotoAlternate,
      popup: props => <CreateImage {...props} />,
    },
    {divider: true, lite: false},
    {
      title: i18n.t('Align left'),
      icon: MdFormatAlignLeft,
      command: 'justifyLeft',
    },
    {
      title: i18n.t('Center'),
      icon: MdFormatAlignCenter,
      command: 'justifyCenter',
    },
    {
      title: i18n.t('Align right'),
      icon: MdFormatAlignRight,
      command: 'justifyRight',
    },
    {
      title: i18n.t('Justify'),
      icon: MdFormatAlignJustify,
      command: 'justifyFull',
    },
    {divider: true},
    {
      title: i18n.t('Ordered list'),
      icon: MdFormatListNumbered,
      command: 'insertOrderedList',
    },
    {
      title: i18n.t('Unordered list'),
      icon: MdFormatListBulleted,
      command: 'insertUnorderedList',
    },
    {divider: true, lite: false},
    {
      lite: false,
      title: i18n.t('Indent'),
      icon: MdFormatIndentIncrease,
      command: 'indent',
    },
    {
      lite: false,
      title: i18n.t('Outdent'),
      icon: MdFormatIndentDecrease,
      command: 'outdent',
    },
    {divider: true, lite: false},
    {
      lite: false,
      title: i18n.t('Normalize'),
      icon: MdAutoFixHigh,
      command: 'normalize',
    },
    {
      lite: false,
      title: i18n.t('Code'),
      icon: MdCode,
      command: 'toggleCode',
    },
  ];
}
