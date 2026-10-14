'use client';

import {useState} from 'react';
import type {ChangeEvent} from 'react';
import {MdCheck} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {Input} from '@/ui/components/input';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {getFileSizeText} from '@/utils/files';

// ---- LOCAL IMPORTS ---- //
import type {PopupProps} from '../types';
import {cancelEvent} from '../dom';
import {MAX_IMAGE_SIZE, readImageContents} from '../image-file';
import {withScheme} from '../url';
import styles from '../editor.module.css';

export function CreateImage({commands}: PopupProps) {
  const [url, setUrl] = useState('');
  const {toast} = useToast();

  /*
   * An image picked here is bounded, while one pasted into the content is
   * left at its own size. That difference is the back-office's, and is kept
   * so a field written on either side reads the same on the other.
   */
  function addImage(source: string) {
    commands.insertHTML(
      ` <img src="${source}" style="max-width:100%;max-height:20em;"> <br><br> `,
    );
    commands.closePopup();
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    files.forEach(async file => {
      const read = await readImageContents(file, (type, dataUrl) => {
        if (type.match(/^image/i)) addImage(dataUrl);
      });
      if (!read) {
        toast({
          variant: 'destructive',
          title: i18n.t(
            'Image is bigger than {0}.',
            getFileSizeText(MAX_IMAGE_SIZE),
          ),
        });
      }
    });
    cancelEvent(event);
  }

  function handleSubmit() {
    if (!url) return;
    addImage(withScheme(url));
  }

  return (
    <div className="whitespace-nowrap">
      <div
        className={cn(
          styles.dropZone,
          'relative flex h-12 items-center justify-center border-2 border-dashed border-input p-2 mb-2 text-sm font-bold',
        )}>
        <span>{i18n.t('Click or drop image')}</span>
        <input type="file" accept="image/*" onChange={handleFiles} />
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="text"
          className="h-9 flex-1"
          placeholder={i18n.t('www.example.com')}
          value={url}
          onChange={event => setUrl(event.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          title={i18n.t('Insert image')}
          onClick={handleSubmit}>
          <MdCheck />
        </Button>
      </div>
    </div>
  );
}
