import {z} from 'zod';
import {IdSchema} from '@/utils/validators';

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
