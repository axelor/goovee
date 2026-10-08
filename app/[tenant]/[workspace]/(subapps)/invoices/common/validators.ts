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
