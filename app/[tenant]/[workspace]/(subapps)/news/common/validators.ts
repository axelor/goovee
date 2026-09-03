import {z} from 'zod';

export const FindSearchNewsSchema = z.object({
  search: z.string().optional(),
});
export type FindSearchNewsInput = z.infer<typeof FindSearchNewsSchema>;

export const FindRecommendedNewsSchema = z.object({
  categoryIds: z.array(z.string()),
});
export type FindRecommendedNewsInput = z.infer<
  typeof FindRecommendedNewsSchema
>;
