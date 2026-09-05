import {z} from 'zod';
import {UserType} from './types';
import {
  OTPSchema,
  PasswordSchema,
  WorkspaceURLSchema,
} from '@/utils/validators';

const LocaleSchema = z.string().optional();

export const OAuthInviteRegisterSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.email(),
  inviteId: z.string().min(1, 'Invite ID is required'),
  locale: LocaleSchema,
});

export type OAuthInviteRegister = z.infer<typeof OAuthInviteRegisterSchema>;

const RegisterBaseSchema = z
  .object({
    type: z.enum([UserType.company, UserType.individual]),
    name: z.string().optional(),
    email: z.email(),
    workspaceURL: WorkspaceURLSchema,
    companyName: z.string().optional(),
    identificationNumber: z.string().optional(),
    companyNumber: z.string().optional(),
    firstName: z.string().optional(),
    locale: LocaleSchema,
  })
  .refine(data => data.type !== UserType.company || !!data.companyName, {
    message: 'Company name is required',
    path: ['companyName'],
  })
  .refine(data => data.type !== UserType.individual || !!data.name, {
    message: 'Name is required',
    path: ['name'],
  });

export const OAuthRegisterSchema = RegisterBaseSchema;

export type OAuthRegister = z.infer<typeof OAuthRegisterSchema>;

export const EmailRegisterSchema = RegisterBaseSchema.safeExtend({
  otp: OTPSchema,
  password: PasswordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type EmailRegister = z.infer<typeof EmailRegisterSchema>;

export const KeycloakRegisterSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
  workspaceURI: z.string().min(1),
  locale: z.string().optional(),
});

export type KeycloakRegister = z.infer<typeof KeycloakRegisterSchema>;

/* Server action input schemas */

export const SubscribeSchema = z.object({
  workspace: z.object({
    id: z.string().min(1, 'Workspace ID is required'),
    url: WorkspaceURLSchema,
  }),
});

export type Subscribe = z.infer<typeof SubscribeSchema>;

export const EmailInviteRegisterSchema = OAuthInviteRegisterSchema.extend({
  otp: OTPSchema,
  password: PasswordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type InviteEmailRegister = z.infer<typeof EmailInviteRegisterSchema>;

export const InviteSubscribeSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  inviteId: z.string().min(1, 'Invite ID is required'),
});

export type InviteSubscribe = z.infer<typeof InviteSubscribeSchema>;

export const EmailRegisterOTPSchema = z.object({
  email: z.email(),
  workspaceURL: WorkspaceURLSchema.optional(),
});

export type EmailRegisterOTP = z.infer<typeof EmailRegisterOTPSchema>;

export const InviteEmailRegisterOTPSchema = z.object({
  inviteId: z.string().min(1, 'Invite ID is required'),
});

export type EmailInviteOTP = z.infer<typeof InviteEmailRegisterOTPSchema>;

export const RequestResetPasswordSchema = z.object({
  email: z.email(),
  searchQuery: z.string(),
});

export type RequestResetPassword = z.infer<typeof RequestResetPasswordSchema>;

export const ResetPasswordSchema = z
  .object({
    email: z.email(),
    otp: OTPSchema,
    password: PasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPassword = z.infer<typeof ResetPasswordSchema>;

export const EmailUpdateOTPSchema = z.object({
  email: z.email(),
});

export type EmailUpdateOTP = z.infer<typeof EmailUpdateOTPSchema>;

export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: PasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
