'use client';

import React, { useState, type JSX } from 'react';
import {cva, VariantProps} from 'class-variance-authority';
import {MdInfoOutline, MdClose, MdCheckCircleOutline} from 'react-icons/md';

import {cn} from '@/utils/css';

const alertToastVariants = cva(
  'flex items-center gap-4 justify-between py-4 px-8 rounded border transition-all',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800 border-gray-300',
        info: 'bg-palette-purple text-palette-purple-dark border-palette-purple-dark',
        success: 'bg-palette-green-light text-success-dark border-success-dark',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const variantIcons: Record<'default' | 'info' | 'success', JSX.Element> = {
  default: <MdInfoOutline size={24} />,
  info: <MdInfoOutline size={24} />,
  success: <MdCheckCircleOutline size={24} />,
};

export interface AlertToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertToastVariants> {
  show: boolean;
  title: string;
  description?: string;
}

function AlertToast({
  show,
  title,
  description,
  variant = 'default',
  className,
  ...props
}: AlertToastProps) {
  const [open, setOpen] = useState(show);

  const handleClose = () => setOpen(false);
  if (!open) return null;

  const icon = variantIcons[variant ?? 'default'];

  return (
    <div className={cn(alertToastVariants({variant}), className)} {...props}>
      <div className="flex gap-4">
        {icon}
        <div>
          <div className="font-medium text-lg">{title}</div>
          {description && <div className="text-sm">{description}</div>}
        </div>
      </div>
      <MdClose size={24} className="cursor-pointer" onClick={handleClose} />
    </div>
  );
}

export {AlertToast, alertToastVariants};
