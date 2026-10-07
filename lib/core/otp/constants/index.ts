export enum Scope {
  Registration = 'registration',
  EmailUpdate = 'email_update',
  ResetPassword = 'reset_password',
}

export const DEFAULT_OTP_DIGIT = 6;

export const DEFAULT_OTP_EXPIRY = 10;

export const MAX_OTP_FAILED_ATTEMPTS = 5;
