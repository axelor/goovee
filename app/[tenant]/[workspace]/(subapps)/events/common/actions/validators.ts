import {z} from 'zod';
import {IdSchema} from '@/utils/validators';

export const SearchEventsSchema = z.object({
  search: z.string(),
});

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

/* Free registrations only; a priced one goes through the payment flow. */
export const RegisterSchema = z.object({
  eventId: IdSchema,
  values: RegistrationValuesSchema,
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const FetchContactsSchema = z.object({
  search: z.string(),
});
export type FetchContactsInput = z.infer<typeof FetchContactsSchema>;

export const IsValidParticipantSchema = z.object({
  eventId: IdSchema,
  email: z.email(),
});
export type IsValidParticipantInput = z.infer<typeof IsValidParticipantSchema>;

export const FetchEventSchema = z.object({
  slug: z.string(),
});
export type FetchEventInput = z.infer<typeof FetchEventSchema>;
