import {experimental_taintUniqueValue} from 'react';
import type {GoogleOptions} from 'better-auth/types';

const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;

if (process.env.SHOW_GOOGLE_OAUTH === 'true') {
  experimental_taintUniqueValue(
    'Google Client Secret is an authentication secret. Do not pass to Client Components.',
    process,
    clientSecret,
  );
}

const google = {
  enabled: process.env.SHOW_GOOGLE_OAUTH === 'true',
  clientId: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret,
  /* Always show Google's account chooser: a user may sign in to different
   * tenants with different accounts, and auto-selecting the last-used one
   * would log them into the wrong tenant account. */
  prompt: 'select_account',
} satisfies GoogleOptions & {
  enabled?: boolean | undefined;
};

export default google;
