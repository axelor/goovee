import type {ReactNode} from 'react';
import type {IconType} from 'react-icons';

/* Toolbar commands that take no argument and are named by an action. */
export type ToolbarCommandName =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'justifyFull'
  | 'indent'
  | 'outdent'
  | 'insertOrderedList'
  | 'insertUnorderedList'
  | 'removeFormat'
  | 'normalize'
  | 'toggleCode';

export interface EditorCommands extends Record<ToolbarCommandName, () => void> {
  format: (tag: string) => void;
  fontName: (font: string) => void;
  fontSize: (size: string) => void;
  foreColor: (color: string) => void;
  highlight: (color: string) => void;
  insertLink: (url: string) => void;
  insertImage: (url: string) => void;
  insertHTML: (html: string) => void;
  /* Reports content a command changed by hand, which raises no input event. */
  reportChange: () => void;
  getSelectedHTML: () => string | null;
  collapseSelection: () => void;
  closePopup: () => void;
}

export interface PopupProps {
  commands: EditorCommands;
  getEditor: () => HTMLElement | null;
}

export interface EditorAction {
  title: string;
  icon: IconType;
  /* `lite: false` drops the action from the reduced toolbar; without the flag it appears in both. */
  lite?: boolean;
  hotkey?: string;
  command?: ToolbarCommandName;
  popup?: (props: PopupProps) => ReactNode;
}

export interface ToolbarDivider {
  divider: true;
  lite?: boolean;
}

export type ToolbarItem = EditorAction | ToolbarDivider;

export function isDivider(item: ToolbarItem): item is ToolbarDivider {
  return 'divider' in item;
}
