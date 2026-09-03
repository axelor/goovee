import {z} from 'zod';
import {IdSchema} from '@/utils/validators';

export const LocaleRedirectionSchema = z.object({
  websiteSlug: z.string(),
  websitePageSlug: z.string().optional(),
});

export type LocaleRedirectionInput = z.infer<typeof LocaleRedirectionSchema>;

export const UpdateWikiContentSchema = z.object({
  websiteSlug: z.string(),
  websitePageSlug: z.string(),
  contentId: IdSchema,
  contentVersion: z.number(),
  content: z.string(),
});

export type UpdateWikiContentInput = z.infer<typeof UpdateWikiContentSchema>;
