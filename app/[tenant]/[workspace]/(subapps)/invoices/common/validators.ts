import {z} from 'zod';
import {IdSchema, WorkspaceURLSchema} from '@/utils/validators';

export const InvoiceRefSchema = z.object({id: IdSchema});
export type InvoiceRef = z.infer<typeof InvoiceRefSchema>;

export const InvoicePaymentSchema = z.object({
  invoice: InvoiceRefSchema,
  amount: z.string().min(1),
  workspaceURL: WorkspaceURLSchema,
  token: z.string().optional(),
});
export type InvoicePaymentInput = z.infer<typeof InvoicePaymentSchema>;

export const InvoicePaymentWithUriSchema = InvoicePaymentSchema.extend({
  uri: z.string().min(1),
});
export type InvoicePaymentWithUriInput = z.infer<
  typeof InvoicePaymentWithUriSchema
>;

export const InitiatePispPaymentSchema = InvoicePaymentWithUriSchema.extend({
  localInstrument: z.enum(['SCT', 'INST']).optional(),
});
export type InitiatePispPaymentInput = z.infer<
  typeof InitiatePispPaymentSchema
>;

export const PaypalCaptureOrderSchema = z.object({
  orderID: z.string().min(1),
  workspaceURL: WorkspaceURLSchema,
  token: z.string().optional(),
});
export type PaypalCaptureOrderInput = z.infer<typeof PaypalCaptureOrderSchema>;

export const ValidateStripePaymentSchema = z.object({
  stripeSessionId: z.string().min(1),
  workspaceURL: WorkspaceURLSchema,
  token: z.string().optional(),
});
export type ValidateStripePaymentInput = z.infer<
  typeof ValidateStripePaymentSchema
>;

export const CancelStripeBankTransferSchema = z.object({
  id: z.string().min(1),
  contextId: z.string().min(1),
  workspaceURL: WorkspaceURLSchema,
  token: z.string().optional(),
});
export type CancelStripeBankTransferInput = z.infer<
  typeof CancelStripeBankTransferSchema
>;

export const ValidatePayboxPaymentSchema = z.object({
  params: z.record(z.string(), z.string()),
  workspaceURL: WorkspaceURLSchema,
  token: z.string().optional(),
});
export type ValidatePayboxPaymentInput = z.infer<
  typeof ValidatePayboxPaymentSchema
>;
