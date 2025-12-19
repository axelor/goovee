'use client';

import React, {useRef} from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Link,
  Code,
  List,
  ListOrdered,
  Heading,
} from 'lucide-react';

export const FormattingToolbar = ({
  textareaRef,
  messageText,
  setMessageText,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  messageText: string;
  setMessageText: (value: string) => void;
}) => {
  const selectionRef = useRef<{start: number; end: number} | null>(null);

  const applyFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    selectionRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };

    const start = selectionRef.current.start;
    const end = selectionRef.current.end;
    const selectedText = messageText.substring(start, end);
    let formattedText = '';
    let cursorPos = 0;

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorPos = 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorPos = 1;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        cursorPos = 2;
        break;
      case 'heading':
        formattedText = `# ${selectedText}`;
        cursorPos = 2;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        cursorPos = 1;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        cursorPos = 1;
        break;
      case 'unorderedList':
        formattedText = `- ${selectedText}`;
        cursorPos = 2;
        break;
      case 'orderedList':
        formattedText = `1. ${selectedText}`;
        cursorPos = 3;
        break;
      default:
        formattedText = selectedText;
    }

    const newText =
      messageText.substring(0, start) +
      formattedText +
      messageText.substring(end);

    setMessageText(newText);

    setTimeout(() => {
      textarea.focus();
      let newCursorPosition;
      if (selectedText !== '') {
        newCursorPosition = start + formattedText.length;
      } else {
        newCursorPosition = start + cursorPos;
      }
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  return (
    <div className="flex mt-2 space-x-1 bg-gray-100 p-1 rounded-md">
      <button
        onClick={() => applyFormatting('bold')}
        className="p-1 hover:bg-gray-300 rounded">
        <Bold size={16} />
      </button>
      <button
        onClick={() => applyFormatting('italic')}
        className="p-1 hover:bg-gray-300 rounded">
        <Italic size={16} />
      </button>
      <button
        onClick={() => applyFormatting('strikethrough')}
        className="p-1 hover:bg-gray-300 rounded">
        <Strikethrough size={16} />
      </button>
      <button
        onClick={() => applyFormatting('heading')}
        className="p-1 hover:bg-gray-300 rounded">
        <Heading size={16} />
      </button>
      <button
        onClick={() => applyFormatting('link')}
        className="p-1 hover:bg-gray-300 rounded">
        <Link size={16} />
      </button>
      <button
        onClick={() => applyFormatting('code')}
        className="p-1 hover:bg-gray-300 rounded">
        <Code size={16} />
      </button>
      <button
        onClick={() => applyFormatting('unorderedList')}
        className="p-1 hover:bg-gray-300 rounded">
        <List size={16} />
      </button>
      <button
        onClick={() => applyFormatting('orderedList')}
        className="p-1 hover:bg-gray-300 rounded">
        <ListOrdered size={16} />
      </button>
    </div>
  );
};
