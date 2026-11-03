const { z } = require('zod');

const updateSettingsSchema = z.object({
  defaultLowStockThreshold: z
    .number({ error: (issue) => (issue.input === undefined ? 'Default low stock threshold is required' : 'Default threshold must be a number') })
    .int('Default threshold must be an integer')
    .min(0, 'Default threshold cannot be negative')
    .max(1000000, 'Threshold is unreasonably high'),
});

module.exports = {
  updateSettingsSchema,
};
