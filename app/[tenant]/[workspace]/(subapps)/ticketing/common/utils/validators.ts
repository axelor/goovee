import type {Expand} from '@/types/util';
import {dateFilterSchema} from '@/ui/components/task-components/filter-fields/validators';
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

export const TicketFilterSchema = z.object({
  createdBy: z.array(z.string()).optional(),
  priority: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  updatedOn: dateFilterSchema.optional(),
  taskDate: dateFilterSchema.optional(),
  myTickets: z.boolean().optional(),
  managedBy: z.array(z.string()).optional(),
  assignment: z.number().nullable().optional(),
});

export const EncodedTicketFilterSchema = TicketFilterSchema.partial().transform(
  arg => {
    const filter = Object.fromEntries(
      Object.entries(arg).filter(([_, value]) => {
        if (Array.isArray(value)) {
          return value.length && value.some(v => v != undefined && v != ''); // remove empty arrays and arrays with empty values
        }
        if (typeof value === 'boolean') {
          return value; // remove false
        }
        if (value == null) return false; // remove null and undefined
        return true;
      }),
    ) as Partial<z.infer<typeof TicketFilterSchema>>;
    if (!Object.keys(filter).length) return null; // remove empty object
    return filter;
  },
);

export type EncodedTicketFilter = Expand<
  z.infer<typeof EncodedTicketFilterSchema>
>;
