import {z} from 'zod';
import {TenantIdSchema, WorkspaceURLSchema} from '@/utils/validators';

export const FindSearchNewsSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  search: z.string().optional(),
});
export type FindSearchNewsInput = z.infer<typeof FindSearchNewsSchema>;

export const FindRecommendedNewsSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  tenantId: TenantIdSchema,
  categoryIds: z.array(z.string()),
});
export type FindRecommendedNewsInput = z.infer<
  typeof FindRecommendedNewsSchema
>;
