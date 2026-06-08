// ---- CORE IMPORTS ---- //
import {getEnv} from '@/environment';

export * from './common';

export function getSocialURL(code: string) {
  switch (code) {
    case 'linkedin':
      return getLinkedinURL();
    case 'twitter':
      return getTwitterURL();
    case 'instagram':
      return getInstagramURL();
    case 'whatsapp':
      return getWhatsappURL();
    default:
      return '';
  }
}

export function getLinkedinURL() {
  return getEnv()?.GOOVEE_PUBLIC_LINKEDIN_URL;
}

export function getTwitterURL() {
  return getEnv()?.GOOVEE_PUBLIC_TWITTER_URL;
}

export function getInstagramURL() {
  return getEnv()?.GOOVEE_PUBLIC_INSTAGRAM_URL;
}

export function getWhatsappURL() {
  return getEnv()?.GOOVEE_PUBLIC_WHATSAPP_URL;
}
