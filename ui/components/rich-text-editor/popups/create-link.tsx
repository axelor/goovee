'use client';

import {useEffect, useRef, useState} from 'react';
import type {KeyboardEvent} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Input} from '@/ui/components/input';

// ---- LOCAL IMPORTS ---- //
import type {PopupProps} from '../types';
import {findClosestAnchorNode} from '../dom';
import {withScheme} from '../url';

function encodeHTML(text: string) {
  const replacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  };
  return text.replace(/[&<>"]/g, tag => replacements[tag] ?? tag);
}

export function CreateLink({commands, getEditor}: PopupProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLAnchorElement | null>(null);
  const [href, setHref] = useState('');

  /*
   * The link under the caret is found before the field takes focus. Once it
   * has focus the document's selection is the field's own, and the content's
   * caret is no longer reachable from here.
   */
  useEffect(() => {
    const anchor = findClosestAnchorNode(getEditor());
    anchorRef.current = anchor;
    setHref(anchor?.href ?? '');
    inputRef.current?.focus();
  }, [getEditor]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;

    /* The content takes focus below, and would otherwise take this Enter too. */
    event.preventDefault();

    const url = event.currentTarget.value.trim();
    const anchor = anchorRef.current;

    if (anchor) {
      /*
       * Setting the property changes the content without the browser raising
       * an input event, so the new address is reported by hand.
       */
      if (url) {
        anchor.href = withScheme(url);
        commands.reportChange();
      }
    } else if (url) {
      if (commands.getSelectedHTML()) {
        commands.insertLink(withScheme(url));
      } else {
        const target = encodeHTML(withScheme(url));
        commands.insertHTML(`<a href="${target}">${encodeHTML(url)}</a>`);
      }
    }

    commands.collapseSelection();
    commands.closePopup();
    getEditor()?.focus();
  }

  return (
    <Input
      ref={inputRef}
      type="text"
      className="h-9 w-full"
      placeholder={i18n.t('www.example.com')}
      value={href}
      onChange={event => setHref(event.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}
