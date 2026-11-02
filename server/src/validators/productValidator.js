const { z } = require('zod');

const productSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(1, 'Product name cannot be empty')
    .max(200, 'Product name cannot exceed 200 characters'),
  sku: z
    .string({ required_error: 'SKU is required' })
    .trim()
    .min(1, 'SKU cannot be empty')
    .max(100, 'SKU cannot exceed 100 characters')
    .transform((val) => val.toUpperCase()),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .nullable()
    .optional(),
  quantityOnHand: z
    .number({ required_error: 'Quantity on hand is required' })
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative'),
  costPrice: z
    .number({ invalid_type_error: 'Cost price must be a valid number' })
    .min(0, 'Cost price cannot be negative')
    .nullable()
    .optional(),
  sellingPrice: z
    .number({ invalid_type_error: 'Selling price must be a valid number' })
    .min(0, 'Selling price cannot be negative')
    .nullable()
    .optional(),
  lowStockThreshold: z
    .number({ invalid_type_error: 'Low-stock threshold must be a number' })
    .int('Low-stock threshold must be an integer')
    .min(0, 'Low-stock threshold cannot be negative')
    .nullable()
    .optional(),
});

const stockAdjustmentSchema = z.object({
  adjustment: z
    .number({ required_error: 'Adjustment amount is required' })
    .int('Adjustment must be an integer')
    .refine((val) => val !== 0, {
      message: 'Adjustment amount cannot be zero',
    }),
  note: z
    .string()
    .trim()
    .max(500, 'Note cannot exceed 500 characters')
    .optional(),
});

module.exports = {
  productSchema,
  stockAdjustmentSchema,
};
