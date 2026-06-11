import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    sku: z.string().min(1, 'SKU is required').max(50),
    description: z.string().max(1000).optional(),
    price: z.number().positive('Price must be positive'),
    minimumStockLevel: z.number().int().min(0).optional(),
    categoryId: z.string().uuid('Invalid category ID'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    sku: z.string().min(1).max(50).optional(),
    description: z.string().max(1000).optional(),
    price: z.number().positive().optional(),
    minimumStockLevel: z.number().int().min(0).optional(),
    categoryId: z.string().uuid().optional(),
  }),
});
