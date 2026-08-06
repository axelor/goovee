'use client';

import {forwardRef, useState} from 'react';
import {MdOutlineVisibility, MdOutlineVisibilityOff} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';

/** Royal-charter CTA button class shared across the auth screens. */
export const authButtonClass =
  'inline-flex w-full items-center justify-center gap-2 rounded-[11px] bg-royal px-4 py-3.5 text-[15px] font-bold text-white shadow-[0_1px_2px_rgba(13,30,75,0.15),0_6px_16px_rgba(13,30,75,0.18)] transition-colors hover:bg-royal-dark disabled:cursor-not-allowed disabled:opacity-60';

function BrandPanel() {
  return (
    <div className="relative hidden lg:flex flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-royal-dark via-royal to-[#2f74d6] p-12 xl:p-14 text-white">
      {/* texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.10) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* glow orbs */}
      <div className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full bg-[radial-gradient(circle,rgba(127,182,255,0.45),transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 size-80 rounded-full bg-[radial-gradient(circle,rgba(46,163,107,0.25),transparent_70%)]" />

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-[10px] bg-gradient-to-br from-[#4ebd87] to-[#1f8556] text-white font-extrabold shadow-lg">
          ⌬
        </div>
        <div>
          <div className="text-[17px] font-extrabold tracking-[-0.01em]">
            {i18n.t('Goovee')}
          </div>
          <div className="text-[11.5px] text-white/70">
            {i18n.t('Client portal')}
          </div>
        </div>
      </div>

      {/* Headline */}
      <div className="relative max-w-[420px]">
        <h1 className="m-0 text-[34px] font-extrabold leading-[1.2] tracking-[-0.025em]">
          {i18n.t('Your client space, all in one place.')}
        </h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-white/80">
          {i18n.t(
            'Orders, quotes, invoices, support and documentation — manage your whole relationship from a single portal.',
          )}
        </p>
      </div>

      <div className="relative text-[12px] text-white/60">
        {i18n.t('Powered by Goovee')}
      </div>
    </div>
  );
}

export function AuthShell({children}: {children: React.ReactNode}) {
  return (
    <div className="flex min-h-screen w-full bg-white">
      <BrandPanel />
      <div className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-[46%] lg:shrink-0 lg:px-14 xl:px-20">
        <div className="w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      <label className="text-[13px] font-semibold text-ink-800">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {hint && <span className="text-[11.5px] text-ink-500">{hint}</span>}
    </div>
  );
}

export const authInputClass =
  'w-full rounded-[11px] border border-ink-150 bg-white px-[15px] py-3 text-sm text-ink-800 outline-none transition-colors placeholder:text-ink-400 focus:border-royal focus:ring-4 focus:ring-royal-pale disabled:cursor-not-allowed disabled:bg-ink-25';

export const AuthInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({className, ...props}, ref) => (
  <input ref={ref} {...props} className={cn(authInputClass, className)} />
));
AuthInput.displayName = 'AuthInput';

export const PasswordInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({className, ...props}, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        type={show ? 'text' : 'password'}
        className={cn(authInputClass, 'pr-11', className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(s => !s)}
        aria-label={show ? i18n.t('Hide password') : i18n.t('Show password')}
        className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700">
        {show ? (
          <MdOutlineVisibility className="size-[18px]" />
        ) : (
          <MdOutlineVisibilityOff className="size-[18px]" />
        )}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';
