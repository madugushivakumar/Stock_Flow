const { z } = require('zod');

const signupSchema = z
  .object({
    organizationName: z
      .string({ error: (issue) => (issue.input === undefined ? 'Organization name is required' : undefined) })
      .trim()
      .min(2, 'Organization name must be at least 2 characters')
      .max(100, 'Organization name cannot exceed 100 characters'),
    email: z
      .string({ error: (issue) => (issue.input === undefined ? 'Email is required' : undefined) })
      .trim()
      .email('Invalid email address format')
      .toLowerCase(),
    password: z
      .string({ error: (issue) => (issue.input === undefined ? 'Password is required' : undefined) })
      .min(6, 'Password must be at least 6 characters long')
      .max(100, 'Password cannot exceed 100 characters'),
    confirmPassword: z
      .string({ error: (issue) => (issue.input === undefined ? 'Confirm password is required' : undefined) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z
    .string({ error: (issue) => (issue.input === undefined ? 'Email is required' : undefined) })
    .trim()
    .email('Invalid email address format')
    .toLowerCase(),
  password: z
    .string({ error: (issue) => (issue.input === undefined ? 'Password is required' : undefined) })
    .min(1, 'Password is required'),
});

module.exports = {
  signupSchema,
  loginSchema,
};
