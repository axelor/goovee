'use client';

import type {ReactNode} from 'react';

// ---- CORE IMPORTS ---- //
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import type {EditorCommands} from '../types';
import {cancelEvent} from '../dom';
import styles from '../editor.module.css';

export interface DropdownProps {
  commands: EditorCommands;
  choices: Record<string, ReactNode>;
  onSelect: (commands: EditorCommands, value: string) => void;
}

export function Dropdown({commands, choices, onSelect}: DropdownProps) {
  return (
    <div className={cn(styles.sample, 'flex flex-col')}>
      {Object.entries(choices).map(([value, label]) => (
        <button
          key={value}
          type="button"
          className="px-2 py-1 text-start hover:bg-muted"
          onMouseDown={cancelEvent}
          onClick={event => {
            cancelEvent(event);
            onSelect(commands, value);
          }}>
          {label}
        </button>
      ))}
    </div>
  );
}
