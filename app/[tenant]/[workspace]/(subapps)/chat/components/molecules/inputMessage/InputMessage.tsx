'use client';

import React, {useRef, useEffect, useState} from 'react';
import {
  SendHorizontal,
  Paperclip,
  Type,
  X,
  Eye,
  EyeOff,
  SmilePlus,
} from 'lucide-react';
import {MarkdownRenderer, FormattingToolbar, EmojiPopup} from '../../atoms';
import {Post} from '../../../types/types';
import {emojis} from '../../../constants/emojis';
import {i18n} from '@/locale';

const fileNameToUnicode = (fileName: string): string => {
  const codePoint = parseInt(fileName.split('.')[0], 16);
  return String.fromCodePoint(codePoint);
};

const inputMessagePlaceHolder = i18n.t('Write a message');

export const InputMessage = ({
  messageText,
  setMessageText,
  fileInputRef,
  handleFileSelect,
  triggerFileInput,
  isSendEnabled,
  handleMessageSend,
  chatContainerRef,
  postReply,
  setPostReply,
}: {
  messageText: string;
  setMessageText: (value: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
  isSendEnabled: boolean;
  handleMessageSend: () => void;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  postReply: any;
  setPostReply: (post: Post) => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(20);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef(null);
  const MIN_HEIGHT = 20;
  const MAX_HEIGHT = 150;

  const doFocus = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  useEffect(() => {
    const handleFocusEvent = () => {
      doFocus();
    };

    window.addEventListener('focus-input-message', handleFocusEvent);

    return () => {
      window.removeEventListener('focus-input-message', handleFocusEvent);
    };
  }, []);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      const {scrollTop, scrollHeight, clientHeight} = chatContainer;
      const isScrolledToBottom = scrollHeight - scrollTop === clientHeight;
      adjustTextareaHeight();
      if (isScrolledToBottom) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messageText, chatContainerRef]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const currentHeight = textarea.style.height;
      textarea.style.height = `${MIN_HEIGHT}px`;
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.max(
        MIN_HEIGHT,
        Math.min(scrollHeight, MAX_HEIGHT),
      );
      textarea.style.height = `${newHeight}px`;
      if (newHeight !== parseInt(currentHeight)) {
        setTextareaHeight(newHeight);
      }
    }
  };

  const send = () => {
    handleMessageSend();
    setShowPopup(false);
    setShowPreview(false);
  };

  const onClickSend = () => {
    send();
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLDivElement>,
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const toggleFormatting = () => {
    setShowFormatting(!showFormatting);
    setShowPreview(false);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
    setTimeout(() => {
      if (showPreview) {
        textareaRef.current?.focus();
      } else {
        previewRef.current?.focus();
      }
    }, 0);
  };

  const handleCancelReply = () => {
    setPostReply(null);
  };

  const onEmojiClick = (name: string) => {
    const emojiFileName = emojis[name as keyof typeof emojis];
    if (emojiFileName) {
      const emojiUnicode = fileNameToUnicode(emojiFileName);
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText =
          messageText.substring(0, start) +
          emojiUnicode +
          messageText.substring(end);
        setMessageText(newText);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd =
            start + emojiUnicode.length;
        }, 0);
      }
    }
  };

  return (
    <div className="p-4 border-t">
      {postReply && (
        <div className="mb-2 p-2 bg-gray-200 rounded-lg flex justify-between items-center">
          <div className="truncate">
            {i18n.t('Response to')} {postReply.message}
          </div>
          <X
            size={16}
            className="text-gray-500 cursor-pointer"
            onClick={handleCancelReply}
          />
        </div>
      )}
      <div className="flex flex-col bg-gray-100 rounded-lg p-2">
        <div className="flex items-end">
          {!showPreview ? (
            <textarea
              ref={textareaRef}
              placeholder={inputMessagePlaceHolder}
              className="flex-grow bg-transparent focus:outline-none resize-none overflow-y-auto"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                height: `${textareaHeight}px`,
                minHeight: `${MIN_HEIGHT}px`,
                maxHeight: `${MAX_HEIGHT}px`,
              }}
            />
          ) : (
            <div
              ref={previewRef}
              className="flex-grow bg-transparent focus:outline-none resize-none overflow-y-auto"
              style={{maxHeight: `${MAX_HEIGHT}px`}}
              tabIndex={0}
              onKeyPress={handleKeyPress}>
              <MarkdownRenderer content={messageText} />
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            multiple
          />
          <Paperclip
            size={20}
            className="text-gray-400 cursor-pointer mr-2"
            onClick={triggerFileInput}
          />
          <Type
            size={20}
            className={`text-gray-400 cursor-pointer mr-2 ${
              showFormatting ? 'text-blue-500' : ''
            }`}
            onClick={() => {
              setShowPopup(false);
              toggleFormatting();
            }}
          />
          {showPreview ? (
            <EyeOff
              size={20}
              className={`text-gray-400 cursor-pointer mr-2 ${
                showPreview ? 'text-blue-500' : ''
              }`}
              onClick={togglePreview}
            />
          ) : (
            <Eye
              size={20}
              className={`text-gray-400 cursor-pointer mr-2 ${
                showPreview ? 'text-blue-500' : ''
              }`}
              onClick={togglePreview}
            />
          )}
          <SmilePlus
            ref={triggerRef}
            size={20}
            className={`cursor-pointer mr-2 transition-colors duration-200 ${
              showPopup ? 'text-blue-500' : 'text-gray-400'
            }`}
            onClick={() => {
              setShowPopup(!showPopup);
              doFocus();
            }}
          />
          <SendHorizontal
            size={20}
            className={`cursor-pointer transition-colors duration-200 ${
              isSendEnabled ? 'text-blue-500' : 'text-gray-400'
            }`}
            onClick={onClickSend}
          />
        </div>
        {showFormatting && (
          <FormattingToolbar
            textareaRef={textareaRef}
            messageText={messageText}
            setMessageText={setMessageText}
          />
        )}
        {showPopup && (
          <EmojiPopup
            onEmojiClick={onEmojiClick}
            onClose={() => {
              setShowPopup(false);
              doFocus();
            }}
            triggerRef={triggerRef}
            input={true}
          />
        )}
      </div>
    </div>
  );
};
