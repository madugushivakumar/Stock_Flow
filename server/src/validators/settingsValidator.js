const { z } = require('zod');

const updateSettingsSchema = z.object({
  defaultLowStockThreshold: z
    .number({ required_error: 'Default low stock threshold is required' })
    .int('Default threshold must be an integer')
    .min(0, 'Default threshold cannot be negative')
    .max(1000000, 'Threshold is unreasonably high'),
});

module.exports = {
  updateSettingsSchema,
};
