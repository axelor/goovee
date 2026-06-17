import {BetterAuthPlugin, defineErrorCodes} from 'better-auth';
import {APIError, createAuthEndpoint} from 'better-auth/api';
import {setSessionCookie} from 'better-auth/cookies';
import {after} from 'next/server';
import {z} from 'zod';

import {compare, hash} from '@/auth/utils';
import {getPublicEnvironment} from '@/environment';
import {getTranslation} from '@/locale/server';
import {register} from '@/lib/core/auth/orm';
import {generateOTP as coreGenerateOTP} from '@/otp/actions';
import {Scope} from '@/otp/constants';
import {create as createOTP, findOne, isValid, markUsed} from '@/otp/orm';
import NotificationManager, {NotificationType} from '@/notification';
import {findGooveeUserByEmail} from '@/orm/partner';
import {
  findDefaultPartnerWorkspaceConfig,
  findWorkspace,
} from '@/orm/workspace';
import {manager} from '@/tenant';
import {withMattermostSync} from '@/lib/core/mattermost';
import {RESET_PASSWORD} from '@/constants';
import {findInviteById} from '@/app/auth/register/common/orm/register';
import {registerByInvite} from '@/lib/core/auth/orm';
import {withBasePath} from '@/lib/core/path/base-path';
import {
  EmailRegisterOTPSchema,
  InviteEmailRegisterOTPSchema,
  EmailRegisterSchema,
  EmailInviteRegisterSchema,
  RequestResetPasswordSchema,
  ResetPasswordSchema,
} from '@/lib/core/auth/validation-utils';

const ERROR_CODES = defineErrorCodes({
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
  INVALID_TENANT: 'Invalid tenant',
  INVALID_OTP: 'Invalid OTP',
  BAD_REQUEST: 'Bad request',
  REGISTRATION_FAILED: 'Registration failed',
  EMAIL_REQUIRED: 'Email is required',
  USER_NOT_FOUND: 'User not found',
  PASSWORD_RESET_FAILED: 'Error resetting password. Try again.',
});

const resetPasswordEmailHTML = ({
  otp,
  email,
  link,
}: {
  otp: string;
  email: string;
  link: string;
}) => `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Goovee Password Reset</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  background-color: #f9f9f9;
                  margin: 0;
                  padding: 20px;
              }
              .container {
                  text-align: center;
                  max-width: 600px;
                  margin: 0 auto;
                  background: #ffffff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .header {
                  margin-bottom: 20px;
              }
              .button {
                  display: inline-block;
                  margin: 20px 0;
                  padding: 12px 20px;
                  background-color: #58d59d;
                  color: #ffffff !important;
                  text-decoration: none;
                  border-radius: 5px;
                  font-size: 16px;
              }
              .footer {
                  font-size: 14px;
                  color: #666666;
                  margin-top: 20px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Goovee Password Reset</h1>
              </div>
              <p>Dear User, We've received a request to reset the password for your account associated with ${email}. If you requested this change, please follow the instructions below:</p>
              <p>To reset your password, click the link : <a href='${link}' target='_blank'>${link}</a></p>
              <p>Your OTP for password reset is : <strong>${otp}</strong></p>
              <p>This link will expire in 10 minutes, so be sure to reset your password before then.</p>
              <p>If you did not request this change or believe this is a mistake, please ignore this email. Your account remains secure, and no changes will be made.</p>
              <div class="footer">
                  <p>Best regards,<br>The Goovee Team</p>
              </div>
          </div>
      </body>
      </html>
      `;

const credentials = {
  id: 'credentials',
  endpoints: {
    signInWithCredentials: createAuthEndpoint(
      '/credentials/sign-in',
      {
        method: 'POST',
        body: z.object({
          email: z.email(),
          password: z.string(),
          tenantId: z.string(),
          rememberMe: z.boolean().optional(),
        }),
        metadata: {
          openapi: {
            summary: 'Sign in with email and password',
            tags: ['auth'],
          },
        },
      },
      async ctx => {
        const {email, password, tenantId, rememberMe} = ctx.body;

        const knownTenantIds = await manager.listTenantIds();
        if (!knownTenantIds.includes(tenantId)) {
          throw new APIError('UNAUTHORIZED', {
            ...ERROR_CODES.INVALID_EMAIL_OR_PASSWORD,
            message: await getTranslation(
              {tenant: tenantId},
              'Invalid email or password',
            ),
          });
        }

        const tenant = await manager.getTenant(tenantId);
        const {client} = tenant;

        const user = await findGooveeUserByEmail(email, client);
        if (!user) {
          throw new APIError('UNAUTHORIZED', {
            ...ERROR_CODES.INVALID_EMAIL_OR_PASSWORD,
            message: await getTranslation(
              {tenant: tenantId},
              'Invalid email or password',
            ),
          });
        }

        if (!user.password) {
          throw new APIError('UNAUTHORIZED', {
            ...ERROR_CODES.INVALID_EMAIL_OR_PASSWORD,
            message: await getTranslation(
              {tenant: tenantId},
              'Invalid email or password',
            ),
          });
        }

        const valid = await compare(password, user.password);
        if (!valid) {
          throw new APIError('UNAUTHORIZED', {
            ...ERROR_CODES.INVALID_EMAIL_OR_PASSWORD,
            message: await getTranslation(
              {tenant: tenantId},
              'Invalid email or password',
            ),
          });
        }

        const session = await ctx.context.internalAdapter.createSession(
          user.id,
          false,
          {tenantId},
        );
        await setSessionCookie(
          ctx,
          {
            session,
            user: {
              id: user.id,
              name: user.fullName || '',
              email: user.emailAddress?.address || email,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          !rememberMe,
        );
        return session;
      },
    ),

    registerSendOtp: createAuthEndpoint(
      '/credentials/register/send-otp',
      {
        method: 'POST',
        body: EmailRegisterOTPSchema,
        metadata: {
          openapi: {
            summary: 'Generate OTP for email registration',
            tags: ['auth'],
          },
        },
      },
      async ctx => {
        const {email, workspaceURL, tenantId} = ctx.body;

        const tenant = await manager.getTenant(tenantId);
        if (!tenant) {
          throw new APIError('NOT_FOUND', {
            ...ERROR_CODES.INVALID_TENANT,
            message: await getTranslation({tenant: tenantId}, 'Invalid tenant'),
          });
        }
        const {client} = tenant;

        let defaultPartnerWorkspaceConfig;
        if (workspaceURL) {
          defaultPartnerWorkspaceConfig =
            await findDefaultPartnerWorkspaceConfig({
              url: workspaceURL,
              client,
            });
        }

        const template =
          defaultPartnerWorkspaceConfig?.portalAppConfig?.otpTemplateList?.[0]
            ?.template;

        return coreGenerateOTP({
          email,
          scope: Scope.Registration,
          tenantId,
          client,
          mailConfig: template?.content
            ? {
                template: {
                  subject: template.subject ?? undefined,
                  content: template.content,
                },
              }
            : undefined,
        });
      },
    ),

    register: createAuthEndpoint(
      '/credentials/register',
      {
        method: 'POST',
        body: EmailRegisterSchema,
        metadata: {
          openapi: {
            summary: 'Register with email and OTP',
            tags: ['auth'],
          },
        },
      },
      async ctx => {
        const {
          email,
          tenantId,
          otp,
          type,
          name,
          password,
          workspaceURL,
          firstName,
          companyName,
          identificationNumber,
          companyNumber,
          locale,
        } = ctx.body;

        const tenant = await manager.getTenant(tenantId);
        if (!tenant) {
          throw new APIError('NOT_FOUND', {
            ...ERROR_CODES.INVALID_TENANT,
            message: await getTranslation({tenant: tenantId}, 'Invalid tenant'),
          });
        }
        const {client, config} = tenant;

        const otpResult = await findOne({
          scope: Scope.Registration,
          entity: email,
          client,
        });

        if (!otpResult) {
          throw new APIError('UNAUTHORIZED', {
            ...ERROR_CODES.INVALID_OTP,
            message: await getTranslation({tenant: tenantId}, 'Invalid OTP'),
          });
        }

        if (!(await isValid({id: otpResult.id, value: otp, client}))) {
          throw new APIError('UNAUTHORIZED', {
            ...ERROR_CODES.INVALID_OTP,
            message: await getTranslation({tenant: tenantId}, 'Invalid OTP'),
          });
        }

        try {
          await client.$transaction(async txClient => {
            await markUsed({id: otpResult.id, client: txClient});
            await register({
              email,
              tenantId,
              type,
              name,
              password,
              workspaceURL,
              firstName,
              companyName,
              identificationNumber,
              companyNumber,
              locale,
              client: txClient,
              config,
            });
          });
          return {success: true};
        } catch (err) {
          throw new APIError('BAD_REQUEST', {
            ...ERROR_CODES.REGISTRATION_FAILED,
            message:
              err instanceof Error
                ? err.message
                : await getTranslation(
                    {tenant: tenantId},
                    'Registration failed',
                  ),
          });
        }
      },
    ),

    inviteSendOtp: createAuthEndpoint(
      '/credentials/invite/send-otp',
      {
        method: 'POST',
        body: InviteEmailRegisterOTPSchema,
        metadata: {
          openapi: {
            summary: 'Generate OTP for invite registration',
            tags: ['auth'],
          },
        },
      },
      async ctx => {
        const {inviteId, tenantId} = ctx.body;

        const tenant = await manager.getTenant(tenantId);
        if (!tenant) {
          throw new APIError('NOT_FOUND', {
            ...ERROR_CODES.INVALID_TENANT,
            message: await getTranslation({tenant: tenantId}, 'Invalid tenant'),
          });
        }
        const {client} = tenant;

        const invite = await findInviteById({id: inviteId, client});

        if (!(invite?.workspace && invite?.partner)) {
          throw new APIError('BAD_REQUEST', {
            ...ERROR_CODES.BAD_REQUEST,
            message: await getTranslation({tenant: tenantId}, 'Bad request'),
          });
        }

        const workspace = await findWorkspace({
          url: invite.workspace.url,
          user: {
            id: invite.partner.id,
            isContact: false,
            mainPartnerId: undefined,
          },
          client,
        });

        if (!workspace?.config) {
          throw new APIError('BAD_REQUEST', {
            ...ERROR_CODES.BAD_REQUEST,
            message: await getTranslation({tenant: tenantId}, 'Bad request'),
          });
        }

        const emailAddress = invite?.emailAddress?.address;
        if (!emailAddress) {
          throw new APIError('BAD_REQUEST', {
            ...ERROR_CODES.EMAIL_REQUIRED,
            message: await getTranslation(
              {tenant: tenantId},
              'Email is required',
            ),
          });
        }

        if (!workspace.config.otpTemplateList?.length) {
          return coreGenerateOTP({
            email: emailAddress,
            scope: Scope.Registration,
            tenantId,
            client,
          });
        }

        const {otpTemplateList} = workspace.config;
        const localization = invite.partner?.localization?.code;

        let template =
          localization &&
          otpTemplateList.find(t => t?.localization?.code === localization);

        if (!template) {
          template = otpTemplateList?.[0];
        }

        return coreGenerateOTP({
          email: emailAddress,
          scope: Scope.Registration,
          tenantId,
          client,
          mailConfig: template?.template?.content
            ? {
                template: {
                  subject: template.template.subject ?? undefined,
                  content: template.template.content,
                },
              }
            : undefined,
        });
      },
    ),

    inviteRegister: createAuthEndpoint(
      '/credentials/invite/register',
      {
        method: 'POST',
        body: EmailInviteRegisterSchema,
        metadata: {
          openapi: {
            summary: 'Register via invite with OTP',
            tags: ['auth'],
          },
        },
      },
      async ctx => {
        const {
          email,
          tenantId,
          otp,
          firstName,
          name,
          password,
          inviteId,
          locale,
        } = ctx.body;

        const tenant = await manager.getTenant(tenantId);
        if (!tenant) {
          throw new APIError('NOT_FOUND', {
            ...ERROR_CODES.INVALID_TENANT,
            message: await getTranslation({tenant: tenantId}, 'Invalid tenant'),
          });
        }
        const {client, config} = tenant;

        const otpResult = await findOne({
          scope: Scope.Registration,
          entity: email,
          client,
        });

        if (!otpResult) {
          throw new APIError('UNAUTHORIZED', {
            ...ERROR_CODES.INVALID_OTP,
            message: await getTranslation({tenant: tenantId}, 'Invalid OTP'),
          });
        }

        if (!(await isValid({id: otpResult.id, value: otp, client}))) {
          throw new APIError('UNAUTHORIZED', {
            ...ERROR_CODES.INVALID_OTP,
            message: await getTranslation({tenant: tenantId}, 'Invalid OTP'),
          });
        }

        try {
          const query = await client.$transaction(async txClient => {
            await markUsed({id: otpResult.id, client: txClient});
            const {query} = await registerByInvite({
              email,
              tenantId,
              firstName,
              name,
              password,
              inviteId,
              locale,
              client: txClient,
              config,
            });
            return query;
          });
          return {success: true, data: {query}};
        } catch (err) {
          throw new APIError('BAD_REQUEST', {
            ...ERROR_CODES.REGISTRATION_FAILED,
            message:
              err instanceof Error
                ? err.message
                : await getTranslation(
                    {tenant: tenantId},
                    'Registration failed',
                  ),
          });
        }
      },
    ),

    resetPasswordRequest: createAuthEndpoint(
      '/credentials/reset-password/request',
      {
        method: 'POST',
        body: RequestResetPasswordSchema,
        metadata: {
          openapi: {
            summary: 'Request password reset email',
            tags: ['auth'],
          },
        },
      },
      async ctx => {
        const {email, tenantId, searchQuery} = ctx.body;

        const tenant = await manager.getTenant(tenantId);
        if (!tenant) {
          throw new APIError('NOT_FOUND', {
            ...ERROR_CODES.INVALID_TENANT,
            message: await getTranslation({tenant: tenantId}, 'Invalid tenant'),
          });
        }
        const {client} = tenant;

        const user = await findGooveeUserByEmail(email, client);

        const link = `${getPublicEnvironment(tenant.config).GOOVEE_PUBLIC_HOST}${withBasePath(
          `/auth/reset-password/${email}?${searchQuery}`,
        )}`;

        if (user) {
          const mailService = NotificationManager.getService(
            NotificationType.mail,
            tenant.config,
          );
          after(async () => {
            try {
              const result = await createOTP({
                entity: email,
                scope: Scope.ResetPassword,
                client,
                force: true,
              });

              if (result?.otp) {
                await mailService?.notify({
                  subject: 'Goovee Password Reset',
                  to: email,
                  html: resetPasswordEmailHTML({email, otp: result.otp, link}),
                });
              }
            } catch (err) {
              console.error('[AUTH] Failed to send password reset mail', err);
            }
          });
        }

        return {success: true, data: {url: link}};
      },
    ),

    resetPassword: createAuthEndpoint(
      '/credentials/reset-password',
      {
        method: 'POST',
        body: ResetPasswordSchema,
        metadata: {
          openapi: {
            summary: 'Reset password with OTP',
            tags: ['auth'],
          },
        },
      },
      async ctx => {
        const {email, otp, password, tenantId} = ctx.body;

        const tenant = await manager.getTenant(tenantId);
        if (!tenant) {
          throw new APIError('NOT_FOUND', {
            ...ERROR_CODES.INVALID_TENANT,
            message: await getTranslation(
              {tenant: tenantId},
              'Error resetting password. Try again.',
            ),
          });
        }
        const {client, config} = tenant;

        const result = await findOne({
          scope: Scope.ResetPassword,
          entity: email,
          client,
        });

        if (!result) {
          throw new APIError('BAD_REQUEST', {
            ...ERROR_CODES.BAD_REQUEST,
            message: await getTranslation({tenant: tenantId}, 'Bad request'),
          });
        }

        const isValidOTP = await isValid({id: result.id, value: otp, client});
        if (!isValidOTP) {
          throw new APIError('UNAUTHORIZED', {
            ...ERROR_CODES.INVALID_OTP,
            message: await getTranslation({tenant: tenantId}, 'Invalid OTP'),
          });
        }

        const user = await findGooveeUserByEmail(email, client);
        if (!user) {
          throw new APIError('NOT_FOUND', {
            ...ERROR_CODES.USER_NOT_FOUND,
            message: await getTranslation(
              {tenant: tenantId},
              'You are not registered',
            ),
          });
        }

        const hashedPassword = await hash(password);

        try {
          await withMattermostSync({
            config,
            email: user.emailAddress?.address || email,
            password,
            name: user.name || 'user',
            firstName: user.firstName || 'user',
            context: RESET_PASSWORD,
          });
        } catch (err: unknown) {
          throw new APIError('BAD_REQUEST', {
            ...ERROR_CODES.PASSWORD_RESET_FAILED,
            message: await getTranslation(
              {tenant: tenantId},
              'Error resetting password. Try again.',
            ),
          });
        }

        await client.$transaction(async txClient => {
          await txClient.aOSPartner.update({
            data: {
              id: String(user.id),
              version: user.version,
              password: hashedPassword,
            },
            select: {id: true},
          });

          await txClient.otp.update({
            data: {
              id: result.id,
              version: result.version,
              used: true,
            },
            select: {id: true},
          });
        });

        return {
          success: true,
          message: await getTranslation(
            {tenant: tenantId},
            'Password reset successfully.',
          ),
        };
      },
    ),
  },
  rateLimit: [
    {
      pathMatcher: (path: string) => path === '/credentials/sign-in',
      window: 300,
      max: 5,
    },
    {
      pathMatcher: (path: string) => path === '/credentials/register/send-otp',
      window: 300,
      max: 3,
    },
    {
      pathMatcher: (path: string) => path === '/credentials/register',
      window: 300,
      max: 5,
    },
    {
      pathMatcher: (path: string) => path === '/credentials/invite/send-otp',
      window: 300,
      max: 3,
    },
    {
      pathMatcher: (path: string) => path === '/credentials/invite/register',
      window: 300,
      max: 5,
    },
    {
      pathMatcher: (path: string) =>
        path === '/credentials/reset-password/request',
      window: 300,
      max: 3,
    },
    {
      pathMatcher: (path: string) => path === '/credentials/reset-password',
      window: 300,
      max: 5,
    },
  ],

  $ERROR_CODES: ERROR_CODES,
} satisfies BetterAuthPlugin;

export type Credentials = typeof credentials;
export default credentials;
