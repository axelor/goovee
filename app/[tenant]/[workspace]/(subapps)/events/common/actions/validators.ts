import {z} from 'zod';
import {IdSchema, WorkspaceURLSchema} from '@/utils/validators';
import {PaymentOption} from '@/types';

export const GetAllEventsSchema = z.object({
  limit: z.number().optional(),
  page: z.number().optional(),
  categories: z.array(z.string()).optional(),
  search: z.string().optional(),
  day: z.union([z.string(), z.number()]).optional(),
  month: z.number().optional(),
  year: z.number().optional(),
  dates: z.array(z.date()).optional(),
  workspaceURL: WorkspaceURLSchema,
  onlyRegisteredEvent: z.boolean().optional(),
});
export type GetAllEventsInput = z.infer<typeof GetAllEventsSchema>;

export const SearchEventsSchema = z.object({
  search: z.string(),
  workspaceURL: WorkspaceURLSchema,
});
export type SearchEventsInput = z.infer<typeof SearchEventsSchema>;

const SubscriptionSchema = z.object({
  id: IdSchema,
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

const ParticipantSchema = z.object({
  emailAddress: z.email(),
  name: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  sequence: z.number(),
  contactAttrs: z.string().optional(),
  company: z.string().optional(),
  subscriptionSet: z.array(SubscriptionSchema).optional(),
});
export type Participant = z.infer<typeof ParticipantSchema>;

export const RegistrationValuesSchema = ParticipantSchema.extend({
  otherPeople: z.array(ParticipantSchema).optional(),
});
export type RegistrationValues = z.infer<typeof RegistrationValuesSchema>;

const PaymentDataSchema = z.object({
  id: z.string().optional(),
  params: z.unknown().optional(),
});

const PaymentSchema = z.object({
  data: PaymentDataSchema,
  mode: z.enum(PaymentOption),
});

const BaseRegisterSchema = z.object({
  eventId: z.string(),
  workspaceURL: WorkspaceURLSchema,
});

const FreeRegisterSchema = BaseRegisterSchema.extend({
  values: RegistrationValuesSchema,
});

const PaidRegisterSchema = BaseRegisterSchema.extend({
  payment: PaymentSchema,
});

export const RegisterSchema = z.union([PaidRegisterSchema, FreeRegisterSchema]);
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const FetchContactsSchema = z.object({
  search: z.string(),
  workspaceURL: WorkspaceURLSchema,
});
export type FetchContactsInput = z.infer<typeof FetchContactsSchema>;

export const IsValidParticipantSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  eventId: IdSchema,
  email: z.email(),
});
export type IsValidParticipantInput = z.infer<typeof IsValidParticipantSchema>;

export const FetchEventSchema = z.object({
  slug: z.string(),
  workspaceURL: WorkspaceURLSchema,
});
export type FetchEventInput = z.infer<typeof FetchEventSchema>;

export const CreateStripeCheckoutSessionSchema = z.object({
  eventId: IdSchema,
  workspaceURL: WorkspaceURLSchema,
  values: RegistrationValuesSchema,
});
export type CreateStripeCheckoutSessionInput = z.infer<
  typeof CreateStripeCheckoutSessionSchema
>;

export const PaypalCreateOrderSchema = z.object({
  values: RegistrationValuesSchema,
  workspaceURL: WorkspaceURLSchema,
  eventId: IdSchema,
});
export type PaypalCreateOrderInput = z.infer<typeof PaypalCreateOrderSchema>;

export const PayboxCreateOrderSchema = z.object({
  eventId: IdSchema,
  workspaceURL: WorkspaceURLSchema,
  values: RegistrationValuesSchema,
  uri: z.string(),
});
export type PayboxCreateOrderInput = z.infer<typeof PayboxCreateOrderSchema>;
