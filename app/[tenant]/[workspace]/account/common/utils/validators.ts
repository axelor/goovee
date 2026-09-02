import {z} from 'zod';
import {
  IdSchema,
  OTPSchema,
  WorkspaceURLSchema,
  RoleSelectSchema,
  NotificationAppCodeSchema,
} from '@/utils/validators';
import {uploadTokenSchema} from '@/lib/core/upload/validators';
import {Authorization, Role} from '../types';

/* -------- Profile picture -------- */
/* `token` redeems a staged upload (image pre-uploaded on pick); a null/absent
 * token clears the current picture. */
export const UpdateProfileImageSchema = z.object({
  token: uploadTokenSchema.nullish(),
});

export type UpdateProfileImage = z.infer<typeof UpdateProfileImageSchema>;

/* -------- Personal -------- */
export const UpdatePersonalSchema = z.object({
  companyName: z.string().optional(),
  identificationNumber: z.string().optional(),
  companyNumber: z.string().optional(),
  firstName: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.email().optional(),
  otp: OTPSchema.optional(),
  mainPartner: z.string().optional(),
  linkedInLink: z.string().optional(),
});

export type UpdatePersonal = z.infer<typeof UpdatePersonalSchema>;

/* -------- Preferences -------- */
export const UpdatePreferenceSchema = z.object({
  defaultWorkspace: z.string().optional(),
  localization: z.string().optional(),
});

export type UpdatePreference = z.infer<typeof UpdatePreferenceSchema>;

/* -------- Settings -------- */
export const RemoveWorkspaceSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  workspaceURI: z.string().min(1),
});

export type RemoveWorkspace = z.infer<typeof RemoveWorkspaceSchema>;

/* -------- Notifications -------- */
export const UpdateNotificationPreferenceSchema = z.object({
  code: NotificationAppCodeSchema,
  workspaceURL: WorkspaceURLSchema,
  workspaceURI: z.string().min(1),
  data: z.object({
    activateNotification: z.boolean().optional(),
    record: z
      .object({
        id: z.string().min(1),
        activateNotification: z.boolean().optional(),
      })
      .optional(),
  }),
});

export type UpdateNotificationPreference = z.infer<
  typeof UpdateNotificationPreferenceSchema
>;

/* -------- Addresses -------- */
const AddressRecordSchema = z.object({
  id: IdSchema,
  formattedFullName: z.string().min(1),
});

const AddressObjectSchema = z.object({
  id: IdSchema.optional(),
  version: z.number().optional(),
  country: z.object({
    id: IdSchema,
    name: z.string().min(1),
    version: z.number(),
  }),
  streetName: z.string().min(1),
  zip: z.string().min(1),
  townName: z.string().min(1),
  /* nullish, not optional: clearing one of these has to reach the database as
   * null, because an undefined field is left at its stored value. */
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  companyName: z.string().nullish(),
  fullName: z.string().optional(),
  formattedFullName: z.string().optional(),
  city: z
    .object({
      id: IdSchema,
      name: z.string().min(1),
      zip: z.string().optional(),
      version: z.number(),
    })
    .optional(),
  addressl2: z.string().optional(),
  addressl3: z.string().optional(),
  addressl4: z.string().optional(),
  addressl5: z.string().optional(),
  addressl6: z.string().optional(),
  countrySubDivision: z.string().optional(),
  subDepartment: z.string().optional(),
});

export const CreateAddressSchema = z.object({
  address: AddressObjectSchema,
  isDeliveryAddr: z.boolean(),
  isInvoicingAddr: z.boolean(),
  isDefaultAddr: z.boolean().nullish(),
});

export type CreateAddress = z.infer<typeof CreateAddressSchema>;

export const UpdateAddressSchema = z.object({
  address: AddressObjectSchema.extend({
    id: IdSchema,
    version: z.number(),
  }),
  id: IdSchema,
  isDeliveryAddr: z.boolean(),
  isInvoicingAddr: z.boolean(),
  isDefaultAddr: z.boolean().nullish(),
  version: z.number(),
});

export type UpdateAddress = z.infer<typeof UpdateAddressSchema>;

export const UpdateDefaultAddressSchema = z.object({
  type: z.enum(['invoicing', 'delivery']),
  id: IdSchema,
  isDefault: z.boolean(),
});

export type UpdateDefaultAddress = z.infer<typeof UpdateDefaultAddressSchema>;

export const ConfirmAddressesSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  subAppCode: z.string().min(1),
  record: z.object({
    id: IdSchema,
    mainInvoicingAddress: AddressRecordSchema,
    deliveryAddress: AddressRecordSchema,
  }),
});

export type ConfirmAddresses = z.infer<typeof ConfirmAddressesSchema>;

/* -------- Members -------- */
const InviteRefSchema = z.object({id: IdSchema});
const AppRefSchema = z.object({id: IdSchema, code: z.string().min(1)});
const MemberRefSchema = z.object({id: IdSchema});
const WorkspaceBaseSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  workspaceURI: z.string().min(1),
});

export const UpdateInviteApplicationSchema = WorkspaceBaseSchema.extend({
  invite: InviteRefSchema,
  app: AppRefSchema,
  value: z.enum(['yes', 'no']),
});

export type UpdateInviteApplication = z.infer<
  typeof UpdateInviteApplicationSchema
>;

export const UpdateInviteAuthenticationSchema = WorkspaceBaseSchema.extend({
  invite: InviteRefSchema,
  app: AppRefSchema,
  value: RoleSelectSchema,
});

export type UpdateInviteAuthentication = z.infer<
  typeof UpdateInviteAuthenticationSchema
>;

export const DeleteMemberSchema = WorkspaceBaseSchema.extend({
  member: MemberRefSchema,
});

export type DeleteMember = z.infer<typeof DeleteMemberSchema>;

export const UpdateMemberApplicationSchema = WorkspaceBaseSchema.extend({
  member: MemberRefSchema,
  app: AppRefSchema,
  value: z.enum(['yes', 'no']),
});

export type UpdateMemberApplication = z.infer<
  typeof UpdateMemberApplicationSchema
>;

export const UpdateMemberAuthenticationSchema = WorkspaceBaseSchema.extend({
  member: MemberRefSchema,
  app: AppRefSchema,
  value: RoleSelectSchema,
});

export type UpdateMemberAuthentication = z.infer<
  typeof UpdateMemberAuthenticationSchema
>;

/* -------- Invites -------- */
/* No id: the app is selected by its code and sendInvites supplies the id from
 * the workspace's available apps, so anything a caller sends is dropped here. */
const InviteAppConfigSchema = z.object({
  code: z.string().min(1),
  access: z.enum(['yes', 'no']).optional(),
  authorization: z.enum(Authorization).optional(),
});

/* The form collects recipients as one comma-separated field, so the addresses
 * are split and checked here rather than trusted downstream. Each one costs
 * several sequential queries when the invite is created, hence the ceiling.
 * Only user and admin can be handed out by an invite; owner is not invitable. */
const MAX_INVITES_PER_REQUEST = 50;

export const SendInvitesSchema = WorkspaceBaseSchema.extend({
  emails: z
    .string()
    .transform(value =>
      value
        .split(',')
        .map(email => email.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.email()).min(1).max(MAX_INVITES_PER_REQUEST)),
  role: z.enum([Role.user, Role.admin]),
  apps: z.record(z.string().min(1), InviteAppConfigSchema),
});

export type SendInvites = z.input<typeof SendInvitesSchema>;
