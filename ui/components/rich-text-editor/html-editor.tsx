'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {ClipboardEvent, KeyboardEvent, MouseEvent} from 'react';

// ---- CORE IMPORTS ---- //
import {cn} from '@/utils/css';
import {Popover, PopoverContent, PopoverTrigger} from '@/ui/components/popover';

// ---- LOCAL IMPORTS ---- //
import type {EditorAction, EditorCommands, ToolbarCommandName} from './types';
import {isDivider} from './types';
import {getToolbarItems} from './actions';
import {
  cancelEvent,
  collapseSelectionEnd,
  isMediaNode,
  isOrContainsNode,
  getSelectionHtml,
  normalizeEmptyHtml,
  normalizeHTML,
  pasteHtmlAtCaret,
  selectionInside,
} from './dom';
import {readImageContents} from './image-file';
import {sanitizeHtml} from './sanitize';
import contentStyles from './html-content.module.css';
import styles from './editor.module.css';

/* Commands that apply to the selection and leave the caret at its end. */
const COLLAPSING_COMMANDS = [
  'bold',
  'italic',
  'underline',
  'strikeThrough',
  'justifyLeft',
  'justifyRight',
  'justifyCenter',
  'justifyFull',
  'indent',
  'outdent',
  'insertOrderedList',
  'insertUnorderedList',
] as const satisfies readonly ToolbarCommandName[];

export interface HtmlEditorProps {
  /*
   * Whatever a caller holds this value in must give back exactly what the
   * editor last reported. The content belongs to the browser rather than to
   * React, so the only way to tell an echo of our own value from content the
   * caller wants put there instead is that the echo is identical — and the
   * second is written into the field, which sends the caret back to the end.
   * A caller that trims, re-serializes or otherwise reshapes the value on the
   * way through would do that on every keystroke.
   */
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  lite?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  toolbarClassName?: string;
  contentClassName?: string;
}

export function HtmlEditor({
  value = '',
  onChange,
  onBlur,
  lite = false,
  disabled = false,
  autoFocus = false,
  placeholder = '',
  className,
  toolbarClassName,
  contentClassName,
}: HtmlEditorProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const htmlRef = useRef('');
  const selectionRef = useRef<Range | null>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);
  /*
   * Whether the popup closed because someone turned to another part of the
   * page. Focus goes back to the content only when it did not: reaching for
   * a different field is not a request to return to the description.
   */
  const dismissedOutsideRef = useRef(false);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showCode, setShowCode] = useState(false);

  const getEditor = useCallback(() => contentRef.current, []);

  const emitChangeRef = useRef<() => void>(() => {});

  const {commands, saveSelection, updates} = useMemo(() => {
    function saveSelection() {
      const selection = window.getSelection();
      selectionRef.current =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    }

    function restoreSelection() {
      const saved = selectionRef.current;
      if (!saved) return;

      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(saved);
    }

    /*
     * A saved range is put back before every command, because opening a popup
     * or reaching for the toolbar can move the caret out of the content.
     */
    function execCommand(command: string, param?: string, force?: boolean) {
      const editor = getEditor();
      if (!editor) return false;

      restoreSelection();
      editor.focus();

      if (!selectionInside(editor, force)) return false;

      /* Browsers throw here rather than report an unsupported command. */
      try {
        if (
          document.queryCommandSupported &&
          !document.queryCommandSupported(command)
        ) {
          return false;
        }
        return document.execCommand(command, false, param);
      } catch {
        return false;
      }
    }

    function updates(clearSelection?: boolean) {
      if (clearSelection) {
        collapseSelectionEnd();
        selectionRef.current = null;
      } else if (selectionRef.current) {
        saveSelection();
      }
    }

    function collapseSelection() {
      collapseSelectionEnd();
      selectionRef.current = null;
    }

    function getHTML() {
      return getEditor()?.innerHTML ?? '';
    }

    function setHTML(html: string) {
      const editor = getEditor();
      if (editor) editor.innerHTML = html || '';
    }

    function insertHTML(html: string) {
      const editor = getEditor();
      if (!editor) return;

      if (!execCommand('insertHTML', html, true)) {
        restoreSelection();
        selectionInside(editor, true);
        pasteHtmlAtCaret(editor, html);
        emitChangeRef.current();
      }
      updates();
    }

    const commands: EditorCommands = {
      format: tag => execCommand('formatBlock', tag),
      fontName: font => execCommand('fontName', font),
      fontSize: size => execCommand('fontSize', size),
      foreColor: color => execCommand('foreColor', color),
      /* Some browsers apply `backColor` to the whole block instead of the selection. */
      highlight: color => {
        if (!execCommand('hiliteColor', color)) execCommand('backColor', color);
      },
      insertLink: url => execCommand('createLink', url),
      insertImage: url => execCommand('insertImage', url, true),
      insertHTML,
      reportChange: () => emitChangeRef.current(),
      getSelectedHTML: () => {
        restoreSelection();
        const editor = getEditor();
        if (!editor || !selectionInside(editor)) return null;
        return getSelectionHtml(editor);
      },
      collapseSelection,
      closePopup: () => setOpenIndex(null),
      removeFormat: () => {
        execCommand('removeFormat');
        execCommand('unlink');
      },
      normalize: () => {
        const editor = getEditor();
        if (!editor) return;
        const html = normalizeHTML(getHTML());
        editor.focus();
        setHTML(html);
        emitChangeRef.current();
      },
      toggleCode: () => setShowCode(current => !current),
      ...(Object.fromEntries(
        COLLAPSING_COMMANDS.map(command => [
          command,
          () => {
            execCommand(command);
            collapseSelection();
          },
        ]),
      ) as Record<(typeof COLLAPSING_COMMANDS)[number], () => void>),
    };

    return {commands, saveSelection, updates};
  }, [getEditor]);

  const setHtmlValue = useCallback((html: string) => {
    const editor = contentRef.current;
    if (editor) editor.innerHTML = sanitizeHtml(html || '');
  }, []);

  /*
   * Memoizing these would hold the titles at whatever the first render read.
   * They come from the translation bundle, which arrives after the first
   * paint and is replaced again when the language changes.
   */
  const items = getToolbarItems().filter(
    ({lite: itemLite = lite}) => Boolean(itemLite) === Boolean(lite),
  );

  const actions = items.filter(
    (item): item is EditorAction => !isDivider(item),
  );

  function emitChange(html: string) {
    const normalized = normalizeEmptyHtml(html);
    htmlRef.current = normalized;
    onChange?.(normalized);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    /* Ctrl shortcuts are claimed here so the browser does not act on them first. */
    if (event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
      const action = actions.find(
        ({hotkey}) => hotkey && hotkey === event.key.toLowerCase(),
      );
      if (action?.command) {
        commands[action.command]();
        updates();
        cancelEvent(event);
      }
    }

    if (selectionRef.current) saveSelection();
  }

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    mouseDownTargetRef.current = event.target;
  }

  /*
   * Clicking an image selects it whole, so the next command applies to the
   * image rather than landing beside it.
   */
  function handleMouseUp(event: MouseEvent<HTMLDivElement>) {
    const node = event.target;
    const editor = getEditor();

    if (
      editor &&
      node instanceof Element &&
      node === mouseDownTargetRef.current &&
      isMediaNode(node) &&
      isOrContainsNode(editor, node, true)
    ) {
      const range = document.createRange();
      range.setStartBefore(node);
      range.setEndAfter(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    saveSelection();
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const [item] = Array.from(event.clipboardData?.items ?? []);
    if (!item?.type.match(/^image\//)) return;

    const file = item.getAsFile();
    if (!file) return;

    void readImageContents(file, (_type, dataUrl) =>
      commands.insertImage(dataUrl),
    );
    cancelEvent(event);
  }

  function runAction(action: EditorAction) {
    if (!action.command) return;
    commands[action.command]();
    updates();
  }

  /* Kept on a ref so a command can report a change it made itself. */
  useEffect(() => {
    emitChangeRef.current = () =>
      emitChange(contentRef.current?.innerHTML ?? '');
  });

  useEffect(() => {
    if (showCode) {
      if (textareaRef.current) textareaRef.current.value = htmlRef.current;
    } else {
      setHtmlValue(htmlRef.current);
    }
  }, [showCode, setHtmlValue]);

  useEffect(() => {
    if (htmlRef.current !== value) {
      htmlRef.current = value;
      setHtmlValue(value);
      updates(true);
    }
  }, [value, setHtmlValue, updates]);

  useEffect(() => {
    /* Paragraphs rather than divs, and inline styles rather than deprecated tags. */
    document.execCommand('defaultParagraphSeparator', false, 'p');
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('insertBrOnReturn', false, 'false');
  }, []);

  useEffect(() => {
    if (!autoFocus) return;
    if (showCode) textareaRef.current?.focus();
    else contentRef.current?.focus();
  }, [showCode, autoFocus]);

  return (
    <div
      className={cn(
        'relative flex min-h-[100px] resize-y flex-col overflow-auto rounded-md border border-input ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className,
      )}>
      {items.length > 0 && (
        <div
          className={cn(
            /*
             * The corners are the toolbar's own rather than the container's
             * clip, because a caller can turn the clipping off, and several
             * do. Inheriting also follows a caller that squares the field
             * off. It does rely on the radius being the container's own: one
             * that lives on an ancestor cannot be inherited, and there the
             * clip has to stay.
             */
            'flex flex-wrap items-center rounded-t-[inherit] border-b border-input bg-ink-50',
            toolbarClassName,
          )}>
          {items.map((item, index) => {
            if (isDivider(item)) {
              return (
                <span
                  key={index}
                  className="mx-0 inline-block h-6 w-px self-center bg-input"
                />
              );
            }

            const Icon = item.icon;
            /* Only the code toggle stays live while the raw markup is shown. */
            const inactive = showCode && item.command !== 'toggleCode';
            const button = (
              <button
                key={index}
                type="button"
                title={item.title}
                disabled={inactive || disabled}
                className={cn(
                  'flex px-1.5 py-1 text-[0.85rem] opacity-70 hover:opacity-100 focus-visible:bg-accent hover:bg-accent',
                  (inactive || disabled) &&
                    'cursor-default opacity-30 hover:bg-transparent hover:opacity-30',
                )}
                onMouseDown={event => {
                  /*
                   * Keeps the caret in the content while the toolbar is used.
                   * A selection made elsewhere on the page is not the one a
                   * command should act on, so it never replaces the last one
                   * the content itself reported.
                   */
                  event.preventDefault();
                  const editor = getEditor();
                  if (editor && selectionInside(editor)) saveSelection();
                }}
                onClick={event => {
                  /*
                   * Radix opens a popover from the trigger's own click
                   * handler, and composes it so that it stands down once the
                   * event is defaultPrevented. Cancelling the event here
                   * would leave the popup shut, so only an action that runs
                   * a command does.
                   */
                  if (!item.popup) cancelEvent(event);
                  if (!inactive && !disabled) runAction(item);
                }}>
                <Icon />
              </button>
            );

            if (!item.popup) return button;

            return (
              <Popover
                key={index}
                open={openIndex === index}
                onOpenChange={open => {
                  if (open) dismissedOutsideRef.current = false;
                  setOpenIndex(open ? index : null);
                }}>
                <PopoverTrigger asChild>{button}</PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={0}
                  className="w-auto max-w-none p-1"
                  onOpenAutoFocus={event => event.preventDefault()}
                  onInteractOutside={() => {
                    dismissedOutsideRef.current = true;
                  }}
                  onCloseAutoFocus={event => {
                    event.preventDefault();
                    if (!dismissedOutsideRef.current) getEditor()?.focus();
                  }}>
                  {item.popup({commands, getEditor})}
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      )}

      {showCode ? (
        <textarea
          ref={textareaRef}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'flex-1 resize-none bg-inherit p-2 outline-none',
            contentClassName,
          )}
          onChange={event => emitChange(event.target.value)}
          onBlur={event => onBlur?.(normalizeEmptyHtml(event.target.value))}
        />
      ) : (
        <div
          ref={contentRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          data-placeholder={placeholder}
          className={cn(
            styles.content,
            contentStyles.htmlContent,
            'flex-1 overflow-auto p-2 outline-none',
            contentClassName,
          )}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onPaste={handlePaste}
          onInput={event => emitChange(event.currentTarget.innerHTML)}
          onBlur={event =>
            onBlur?.(normalizeEmptyHtml(event.currentTarget.innerHTML))
          }
        />
      )}
    </div>
  );
}
