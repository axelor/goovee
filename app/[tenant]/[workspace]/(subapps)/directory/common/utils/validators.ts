import {z} from 'zod';

export const SearchEntriesSchema = z.object({
  search: z.string().optional(),
});

export type SearchEntriesInput = z.infer<typeof SearchEntriesSchema>;
