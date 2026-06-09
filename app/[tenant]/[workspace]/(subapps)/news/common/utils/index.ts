export * from './common';

type Environment = Record<string, string | undefined>;

export function getSocialURL(code: string, env: Environment) {
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

export function getLinkedinURL(env: Environment) {
  return env?.GOOVEE_PUBLIC_LINKEDIN_URL;
}

export function getTwitterURL(env: Environment) {
  return env?.GOOVEE_PUBLIC_TWITTER_URL;
}

export function getInstagramURL(env: Environment) {
  return env?.GOOVEE_PUBLIC_INSTAGRAM_URL;
}

export function getWhatsappURL(env: Environment) {
  return env?.GOOVEE_PUBLIC_WHATSAPP_URL;
}
