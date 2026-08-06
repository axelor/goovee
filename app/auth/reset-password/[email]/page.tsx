'use client';

import {z} from 'zod';
import {useRouter, useSearchParams} from 'next/navigation';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import {MdArrowBack} from 'react-icons/md';
import {useState, use, useRef, useEffect, useMemo} from 'react';

// ---- CORE IMPORTS ---- //
import {SEARCH_PARAMS} from '@/constants';
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {useToast} from '@/ui/hooks';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/ui/components/form';
import {Link} from '@/ui/components/link';
import {authClient} from '@/lib/auth-client';
import {PasswordSchema} from '@/utils/validators';

// ---- LOCAL IMPORTS ---- //
import {
  AuthShell,
  AuthField,
  PasswordInput,
  authButtonClass,
} from '../../common/ui/auth-shell';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const formSchema = z
  .object({
    email: z.email().min(1, i18n.t('Email is required')),
    otp: z.string().min(OTP_LENGTH, i18n.t('OTP is required')),
    password: PasswordSchema,
    confirmPassword: z.string().min(1, i18n.t('Confirm password is required')),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: i18n.t("Passwords don't match"),
    path: ['confirmPassword'],
  });

function OtpInput({
  value = '',
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({length: OTP_LENGTH}, (_, i) => value[i] ?? '');

  const setAt = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...chars];
    next[i] = digit;
    onChange(next.join(''));
    if (digit && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chars[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (digits) {
      onChange(digits);
      refs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
    }
  };

  return (
    <div className="flex gap-2.5">
      {chars.map((d, i) => (
        <input
          key={i}
          ref={el => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          maxLength={1}
          onChange={e => setAt(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          onPaste={onPaste}
          size={1}
          className={cn(
            'h-[54px] min-w-0 flex-1 rounded-[11px] border text-center font-mono text-[22px] font-bold text-ink-900 outline-none transition-colors focus:border-royal focus:ring-4 focus:ring-royal-pale',
            d ? 'border-royal bg-royal-pale' : 'border-ink-150 bg-white',
          )}
        />
      ))}
    </div>
  );
}

function passwordStrength(pwd: string) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

const STRENGTH_LABEL = [
  'Very weak',
  'Weak',
  'Medium',
  'Good',
  'Excellent',
] as const;
const STRENGTH_BAR = [
  'bg-destructive',
  'bg-destructive',
  'bg-palette-orange',
  'bg-mint-500',
  'bg-mint-500',
];
const STRENGTH_TEXT = [
  'text-destructive',
  'text-destructive',
  'text-palette-orange',
  'text-mint-600',
  'text-mint-600',
];

export default function Page(props: {params: Promise<{email: string}>}) {
  const params = use(props.params);
  const email = decodeURIComponent(params.email);
  const {data: session} = authClient.useSession();
  const searchParams = useSearchParams();
  const searchQuery = new URLSearchParams(searchParams).toString();
  const tenantId = searchParams.get(SEARCH_PARAMS.TENANT_ID);

  const {toast} = useToast();
  const router = useRouter();

  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    const id = setInterval(() => setSeconds(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {email, otp: '', password: '', confirmPassword: ''},
  });

  const pwd = form.watch('password');
  const strength = useMemo(() => passwordStrength(pwd || ''), [pwd]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const {password, confirmPassword, otp} = values;

    try {
      const res = await authClient.credentials.resetPassword({
        email,
        password,
        confirmPassword,
        otp,
        tenantId: tenantId!,
      });

      if (!res.error) {
        toast({
          variant: 'success',
          title: res.data?.message,
        });
        router.push(`/auth/login?${searchQuery}`);
      } else {
        toast({
          variant: 'destructive',
          title:
            res.error.message || i18n.t('Error resetting password. Try again.'),
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: i18n.t('Error resetting password. Try again.'),
      });
    }
  };

  const onResend = async () => {
    if (seconds > 0) return;
    try {
      const res = await authClient.credentials.resetPassword.request({
        email,
        tenantId: tenantId!,
        searchQuery,
      });
      if (!res.error) {
        setSeconds(RESEND_SECONDS);
        toast({variant: 'success', title: i18n.t('A new code has been sent.')});
      } else {
        toast({
          variant: 'destructive',
          title: res.error?.message
            ? i18n.t(res.error.message)
            : i18n.t('Error resetting password. Try again.'),
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: i18n.t('Error resetting password. Try again.'),
      });
    }
  };

  if (session?.user) {
    return (
      <AuthShell>
        <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink-900">
          {i18n.t('Reset Password')}
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          {i18n.t('You are currently loggedin. Logout to reset your password.')}
        </p>
      </AuthShell>
    );
  }

  const countdown = `${String(Math.floor(seconds / 60)).padStart(
    2,
    '0',
  )}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <AuthShell>
      <Link
        href={`/auth/reset-password?${searchQuery}`}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-royal">
        <MdArrowBack className="size-4" />
        {i18n.t('Back')}
      </Link>

      <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink-900">
        {i18n.t('New password')}
      </h2>
      <p className="mt-2 mb-6 text-sm leading-[1.55] text-ink-500">
        {i18n.t('A 6-digit code has been sent to')}{' '}
        <strong className="text-ink-800">{email}</strong>.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5">
          {/* OTP */}
          <FormField
            control={form.control}
            name="otp"
            render={({field}) => (
              <FormItem className="space-y-0">
                <AuthField label={i18n.t('Verification code')} required>
                  <OtpInput value={field.value} onChange={field.onChange} />
                  <div className="mt-0.5 text-[12px] text-ink-500">
                    {i18n.t('Code not received?')}{' '}
                    <button
                      type="button"
                      onClick={onResend}
                      disabled={seconds > 0}
                      className="font-semibold text-royal hover:underline disabled:cursor-not-allowed disabled:text-ink-400 disabled:no-underline">
                      {i18n.t('Resend')}
                    </button>
                    {seconds > 0 && (
                      <span className="text-ink-300"> · {countdown}</span>
                    )}
                  </div>
                </AuthField>
                <FormMessage className="mt-1.5" />
              </FormItem>
            )}
          />

          {/* New password */}
          <FormField
            control={form.control}
            name="password"
            render={({field}) => (
              <FormItem className="space-y-0">
                <AuthField label={i18n.t('Password')} required>
                  <FormControl>
                    <PasswordInput
                      placeholder={i18n.t('Enter password')}
                      {...field}
                    />
                  </FormControl>
                  {pwd && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map(i => (
                          <div
                            key={i}
                            className={cn(
                              'h-1 flex-1 rounded-full',
                              i < strength
                                ? STRENGTH_BAR[strength]
                                : 'bg-ink-100',
                            )}
                          />
                        ))}
                      </div>
                      <div
                        className={cn(
                          'mt-1.5 text-[11.5px] font-semibold',
                          STRENGTH_TEXT[strength],
                        )}>
                        {i18n.t(STRENGTH_LABEL[strength])}
                      </div>
                    </div>
                  )}
                </AuthField>
                <FormMessage className="mt-1.5" />
              </FormItem>
            )}
          />

          {/* Confirm */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({field}) => (
              <FormItem className="space-y-0">
                <AuthField label={i18n.t('Confirm the password')} required>
                  <FormControl>
                    <PasswordInput
                      placeholder={i18n.t('Confirm the password')}
                      {...field}
                    />
                  </FormControl>
                </AuthField>
                <FormMessage className="mt-1.5" />
              </FormItem>
            )}
          />

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={authButtonClass}>
            {i18n.t('Reset Password')}
          </button>

          <div className="text-center text-[13.5px] text-ink-500">
            <Link
              href={`/auth/login?${searchQuery}`}
              className="font-bold text-royal hover:underline">
              {i18n.t('Log In')}
            </Link>
          </div>
        </form>
      </Form>
    </AuthShell>
  );
}
