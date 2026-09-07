export * from './common';

import type {PublicConfig} from '@/tenant/types';

export function getSocialURL(code: string, env: PublicConfig) {
  switch (code) {
    case 'linkedin':
      return getLinkedinURL(env);
    case 'twitter':
      return getTwitterURL(env);
    case 'instagram':
      return getInstagramURL(env);
    case 'whatsapp':
      return getWhatsappURL(env);
    default:
      return '';
  }
}

export function getLinkedinURL(env: PublicConfig) {
  return env.links?.linkedin;
}

export function getTwitterURL(env: PublicConfig) {
  return env.links?.twitter;
}

export function getInstagramURL(env: PublicConfig) {
  return env.links?.instagram;
}

export function getWhatsappURL(env: PublicConfig) {
  return env.links?.whatsapp;
}
