import { z } from 'zod';

export const transferSchema = z.object({
  to_recipient_id: z.string()
    .trim()
    .length(10, 'Recipient ID must be 10 digits')
    .regex(/^\d+$/, 'Recipient ID must contain only numbers'),
  amount: z.number()
    .positive('Amount must be greater than 0')
    .max(1000000, 'Amount exceeds maximum limit'),
  description: z.string()
    .max(200, 'Description too long')
    .optional(),
});

export type TransferFormData = z.infer<typeof transferSchema>;
