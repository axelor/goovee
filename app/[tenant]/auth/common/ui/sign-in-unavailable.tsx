// ---- LOCAL IMPORTS ---- //
import {AuthShell} from './auth-shell';

/** What a sign-in or registration screen shows in place of its form when the
 * tenant offers no way to do what the screen is for. */
export function SignInUnavailable({
  title,
  description,
  workspaceName,
}: {
  title: string;
  description: string;
  workspaceName: string | null;
}) {
  return (
    <AuthShell workspaceName={workspaceName}>
      <div className="mb-7">
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-ink-500">{description}</p>
      </div>
    </AuthShell>
  );
}
