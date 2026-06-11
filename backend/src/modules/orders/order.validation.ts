import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

export const createOrderSchema = z.object({
  body: z.object({
    supplierId: z.string().uuid('Invalid supplier ID'),
    notes: z.string().max(1000).optional(),
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(['APPROVED', 'RECEIVED', 'COMPLETED', 'CANCELLED']),
  }),
});
