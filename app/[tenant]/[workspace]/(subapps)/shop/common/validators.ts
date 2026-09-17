import {z} from 'zod';
import {IdSchema, WorkspaceURLSchema} from '@/utils/validators';

export const CartItemSchema = z.object({
  product: IdSchema,
  /* Whole units only — the stepper emits digits and nothing else is a quantity. */
  quantity: z.coerce.number().int().positive(),
  note: z.string().optional(),
});
export type CartItemInput = z.infer<typeof CartItemSchema>;

export const CartSchema = z.object({
  items: z.array(CartItemSchema).min(1),
  invoicingAddress: z.union([IdSchema, z.null()]).optional(),
  deliveryAddress: z.union([IdSchema, z.null()]).optional(),
});
export type CartInput = z.infer<typeof CartSchema>;

export const PaypalCaptureOrderSchema = z.object({
  orderId: z.string().min(1),
  workspaceURL: WorkspaceURLSchema,
});
export type PaypalCaptureOrderInput = z.infer<typeof PaypalCaptureOrderSchema>;

export const CartOrderSchema = z.object({
  cart: CartSchema,
  workspaceURL: WorkspaceURLSchema,
});
export type CartOrderInput = z.infer<typeof CartOrderSchema>;

export const ValidateStripePaymentSchema = z.object({
  stripeSessionId: z.string().min(1),
  workspaceURL: WorkspaceURLSchema,
});
export type ValidateStripePaymentInput = z.infer<
  typeof ValidateStripePaymentSchema
>;

export const PayboxCreateOrderSchema = z.object({
  cart: CartSchema,
  workspaceURL: WorkspaceURLSchema,
  uri: z.string().min(1),
});
export type PayboxCreateOrderInput = z.infer<typeof PayboxCreateOrderSchema>;

export const ValidatePayboxPaymentSchema = z.object({
  params: z.record(z.string(), z.string()),
  workspaceURL: WorkspaceURLSchema,
});
export type ValidatePayboxPaymentInput = z.infer<
  typeof ValidatePayboxPaymentSchema
>;
