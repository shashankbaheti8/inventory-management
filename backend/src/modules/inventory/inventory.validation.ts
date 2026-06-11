import { z } from 'zod';

export const stockInSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().positive('Quantity must be positive'),
    reason: z.string().min(1, 'Reason is required').max(500),
    reference: z.string().max(100).optional(),
  }),
});

export const stockOutSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().positive('Quantity must be positive'),
    reason: z.string().min(1, 'Reason is required').max(500),
    reference: z.string().max(100).optional(),
  }),
});

export const adjustmentSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int('Quantity must be an integer'),
    reason: z.string().min(1, 'Reason is required').max(500),
  }),
});
