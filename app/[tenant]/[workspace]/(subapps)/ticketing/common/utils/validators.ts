import type {Expand} from '@/types/util';
import {z} from 'zod';

export const CreateFormSchema = z.object({
  subject: z
    .string({required_error: 'Subject is required'})
    .trim()
    .min(1, {message: 'Subject is required'}),
  category: z.string().optional(),
  priority: z.string().optional(),
  managedBy: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

export const UpdateFormSchema = z.object({
  category: z.string().optional(),
  priority: z.string().optional(),
  managedBy: z.string().optional(),
});

export const UpdateTicketSchema = UpdateFormSchema.extend({
  id: z.string(),
  version: z.number(),
  status: z.string().optional(),
  assignment: z.number().optional(),
});

export const CreateTicketSchema = CreateFormSchema.extend({
  project: z.string(),
});

export type CreateFormData = z.infer<typeof CreateFormSchema>;
export type UpdateFormData = z.infer<typeof UpdateFormSchema>;
export type CreateTicketInfo = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketInfo = z.infer<typeof UpdateTicketSchema>;

export const RelatedTicketSchema = z.object({
  linkType: z.string({required_error: 'Link type is required'}),
  ticket: z.object(
    {id: z.string(), fullName: z.string().optional(), version: z.number()},
    {required_error: 'Ticket is required'},
  ),
});

export const ChildTicketSchema = z.object({
  ticket: z.object(
    {id: z.string(), fullName: z.string().optional(), version: z.number()},
    {required_error: 'Ticket is required'},
  ),
});

export const FilterSchema = z.object({
  createdBy: z.array(z.string()).optional(),
  priority: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  updatedOn: z
    .tuple([z.string().optional(), z.string().optional()])
    .superRefine((data, ctx) => {
      const [start, end] = data;
      if (!start && !end) return;
      if (!start) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start date is required.',
          path: [0],
        });
      }
      if (!end) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date is required.',
          path: [1],
        });
      }
      const [startDate, endDate] = [start, end].map(d => new Date(d).getTime());
      if (startDate >= endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start date must be earlier than End date.',
        });
      }
    })
    .optional(),
  myTickets: z.boolean().optional(),
  managedBy: z.array(z.string()).optional(),
  assignment: z.number().nullable().optional(),
});

export const EncodedFilterSchema = FilterSchema.partial().transform(arg => {
  const filter = Object.fromEntries(
    Object.entries(arg).filter(([_, value]) => {
      if (Array.isArray(value)) {
        return value.length && value.every(v => v != undefined && v != ''); // remove empty arrays and arrays with empty values
      }
      if (typeof value === 'boolean') {
        return value; // remove false
      }
      if (value == null) return false; // remove null and undefined
      return true;
    }),
  ) as Omit<Partial<z.infer<typeof FilterSchema>>, 'updatedOn'> & {
    updatedOn?: [string, string];
  };
  if (!Object.keys(filter).length) return null; // remove empty object
  return filter;
});

export type EncodedFilter = Expand<z.infer<typeof EncodedFilterSchema>>;
