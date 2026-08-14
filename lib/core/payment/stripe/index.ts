import 'server-only';

import {taintSecret} from '@/lib/core/security/taint';
import Stripe from 'stripe';

const secret = process.env.STRIPE_CLIENT_SECRET;

taintSecret(
  'Stripe secret key is a server secret. Do not pass to Client Components.',
  secret,
);

export const stripe = new Stripe(secret as string);
