import {cn} from '@/utils/css';
import type {ReactNode} from 'react';
import {REVIEW_CARD_SHELL} from './shared';

type PromptCardProps = {
  title: string;
  description: string;
  action: ReactNode;
};

export function PromptCard({title, description, action}: PromptCardProps) {
  return (
    <div
      className={cn(
        REVIEW_CARD_SHELL,
        'flex items-center justify-between gap-4 flex-wrap',
      )}>
      <div>
        <h3 className="font-semibold text-ink-900">{title}</h3>
        <p className="text-sm text-ink-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
