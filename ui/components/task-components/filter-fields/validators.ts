import {z} from 'zod';

export const dateFilterSchema = z
  .tuple([z.string().optional(), z.string().optional()])
  .superRefine((data, ctx) => {
    const [start, end] = data;
    if (!start || !end) return;
    const [startDate, endDate] = [start, end].map(d => new Date(d).getTime());
    if (startDate > endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date must be earlier than End date.',
      });
    }
  });
