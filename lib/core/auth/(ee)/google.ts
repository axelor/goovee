import type {GoogleOptions} from 'better-auth/types';

const google = {
  enabled: process.env.SHOW_GOOGLE_OAUTH === 'true',
  clientId: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
} satisfies GoogleOptions & {
  enabled?: boolean | undefined;
};

export default google;
